// Package controllers contains controller-runtime reconcilers for kubegram-operator.
package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
)

const (
	serviceAnnotation    = "kubegram.io/service"
	sidecarContainerName = "kubegram-sidecar"
	sidecarPort          = 9090
)

// TestCase mirrors sidecar's validator.TestCase for JSON-wire compatibility.
// The operator and sidecar are separate Go modules, so the type is redefined here.
type TestCase struct {
	CorrelationID  string            `json:"correlation_id"`
	Method         string            `json:"method"`
	Path           string            `json:"path"`
	Headers        map[string]string `json:"headers,omitempty"`
	Body           json.RawMessage   `json:"body,omitempty"`
	ExpectedStatus int               `json:"expected_status"`
}

// sidecarTrigger is the body forwarded to the sidecar's POST /validate.
type sidecarTrigger struct {
	TestCases      []TestCase `json:"test_cases"`
	TargetService  string     `json:"target_service"`
	TimeoutSeconds int        `json:"timeout_seconds"`
}

// proxyRequest is the JSON body received on POST /sidecar/validate.
type proxyRequest struct {
	Namespace      string     `json:"namespace"`
	Service        string     `json:"service"`
	TestCases      []TestCase `json:"test_cases"`
	TargetService  string     `json:"target_service"`
	TimeoutSeconds int        `json:"timeout_seconds"`
}

// ValidationProxyController watches pods with the kubegram sidecar injected,
// maintains an in-memory registry of live sidecar endpoints, and routes
// validation requests from kubegram-server to the appropriate sidecars.
//
// It is mounted at POST /sidecar/validate on the metrics server (port 8080) so
// kubegram-server can reach it without a separate port or Kubernetes Service.
//
// Flow:
//  1. kubegram-server POSTs to POST /sidecar/validate with test cases + target service.
//  2. The controller looks up registered sidecar endpoints for the namespace/service pair.
//  3. It fans out POST /validate to each sidecar endpoint concurrently.
//  4. Sidecars execute the test cases and push results directly to kubegram-server.
type ValidationProxyController struct {
	client.Client
	Scheme     *runtime.Scheme
	httpClient *http.Client

	mu sync.RWMutex
	// registry maps "namespace/service" → map[podName]"podIP:9090"
	registry map[string]map[string]string
}

// NewValidationProxyController creates a ValidationProxyController.
func NewValidationProxyController(c client.Client, scheme *runtime.Scheme) *ValidationProxyController {
	return &ValidationProxyController{
		Client:     c,
		Scheme:     scheme,
		httpClient: &http.Client{Timeout: 35 * time.Second},
		registry:   make(map[string]map[string]string),
	}
}

// SetupWithManager registers the reconciler with the controller-runtime manager.
func (c *ValidationProxyController) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.Pod{}).
		WithEventFilter(predicate.NewPredicateFuncs(func(obj client.Object) bool {
			ann := obj.GetAnnotations()
			return ann != nil && ann[injectAnnotation] == "true"
		})).
		Complete(c)
}

// Reconcile keeps the sidecar registry up to date when pods change state.
func (c *ValidationProxyController) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	var pod corev1.Pod
	if err := c.Get(ctx, req.NamespacedName, &pod); err != nil {
		if client.IgnoreNotFound(err) == nil {
			// Pod deleted — purge it from any registry key in this namespace.
			c.removePod(req.Namespace, req.Name)
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, err
	}

	svc := pod.Annotations[serviceAnnotation]
	if svc == "" {
		return ctrl.Result{}, nil
	}

	key := registryKey(pod.Namespace, svc)

	if isPodReadyWithSidecar(&pod) {
		endpoint := fmt.Sprintf("%s:%d", pod.Status.PodIP, sidecarPort)
		c.mu.Lock()
		if c.registry[key] == nil {
			c.registry[key] = make(map[string]string)
		}
		c.registry[key][pod.Name] = endpoint
		c.mu.Unlock()

		logger.Info("registered sidecar endpoint",
			"pod", pod.Name,
			"service", svc,
			"endpoint", endpoint,
		)
	} else {
		// Pod not ready or sidecar container not ready — remove stale entry.
		c.mu.Lock()
		if pods, ok := c.registry[key]; ok {
			delete(pods, pod.Name)
			if len(pods) == 0 {
				delete(c.registry, key)
			}
		}
		c.mu.Unlock()
	}

	return ctrl.Result{}, nil
}

// ServeHTTP handles POST /sidecar/validate.
// kubegram-server calls this to trigger sidecar validation for a named service.
//
// Request body: { "namespace": "", "service": "", "test_cases": [],
//
//	"target_service": "svc:8080", "timeout_seconds": 30 }
//
// Response 202: { "dispatched": N } — sidecars process async and push results to kubegram-server.
// Response 404: no ready sidecars found for the service.
func (c *ValidationProxyController) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req proxyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON body: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Namespace == "" || req.Service == "" {
		http.Error(w, "namespace and service are required", http.StatusBadRequest)
		return
	}
	if len(req.TestCases) == 0 {
		w.WriteHeader(http.StatusAccepted)
		return
	}

	ctx := r.Context()
	endpoints := c.endpointsFor(req.Namespace, req.Service)

	// Fall back to a live K8s query when the registry hasn't been populated yet
	// (e.g., controller cold-start before the first reconcile has completed).
	if len(endpoints) == 0 {
		var err error
		endpoints, err = c.discoverLive(ctx, req.Namespace, req.Service)
		if err != nil {
			http.Error(w, "sidecar discovery error: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if len(endpoints) == 0 {
		http.Error(w, fmt.Sprintf("no ready sidecar found for %s/%s", req.Namespace, req.Service), http.StatusNotFound)
		return
	}

	timeout := req.TimeoutSeconds
	if timeout <= 0 {
		timeout = 30
	}

	trigger := sidecarTrigger{
		TestCases:      req.TestCases,
		TargetService:  req.TargetService,
		TimeoutSeconds: timeout,
	}

	logger := log.FromContext(ctx)
	logger.Info("dispatching validation trigger",
		"namespace", req.Namespace,
		"service", req.Service,
		"cases", len(req.TestCases),
		"sidecars", len(endpoints),
	)

	var wg sync.WaitGroup
	for _, ep := range endpoints {
		wg.Add(1)
		go func(ep string) {
			defer wg.Done()
			if err := c.dispatchToSidecar(ctx, ep, trigger); err != nil {
				logger.Error(err, "failed to dispatch to sidecar", "endpoint", ep)
			}
		}(ep)
	}
	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]int{"dispatched": len(endpoints)}) //nolint:errcheck
}

// endpointsFor returns registered endpoints for the given namespace/service from the registry.
func (c *ValidationProxyController) endpointsFor(namespace, service string) []string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	pods := c.registry[registryKey(namespace, service)]
	if len(pods) == 0 {
		return nil
	}
	eps := make([]string, 0, len(pods))
	for _, ep := range pods {
		eps = append(eps, ep)
	}
	return eps
}

// discoverLive queries the Kubernetes API for ready sidecar pods when the registry
// is empty (cold-start fallback).
func (c *ValidationProxyController) discoverLive(ctx context.Context, namespace, service string) ([]string, error) {
	var podList corev1.PodList
	if err := c.List(ctx, &podList, client.InNamespace(namespace)); err != nil {
		return nil, fmt.Errorf("list pods: %w", err)
	}

	var eps []string
	for i := range podList.Items {
		pod := &podList.Items[i]
		if pod.Annotations[injectAnnotation] != "true" {
			continue
		}
		if pod.Annotations[serviceAnnotation] != service {
			continue
		}
		if !isPodReadyWithSidecar(pod) {
			continue
		}
		eps = append(eps, fmt.Sprintf("%s:%d", pod.Status.PodIP, sidecarPort))
	}
	return eps, nil
}

// dispatchToSidecar POSTs the validation trigger payload to a single sidecar endpoint.
func (c *ValidationProxyController) dispatchToSidecar(ctx context.Context, endpoint string, trigger sidecarTrigger) error {
	data, err := json.Marshal(trigger)
	if err != nil {
		return fmt.Errorf("marshal trigger: %w", err)
	}

	url := fmt.Sprintf("http://%s/validate", endpoint)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("post to sidecar %s: %w", endpoint, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("sidecar %s returned unexpected status %d", endpoint, resp.StatusCode)
	}
	return nil
}

// SetEndpointForTest injects a sidecar endpoint directly into the registry.
// Intended for use in tests only — allows seeding a known host:port without
// needing a real pod or a reconcile cycle.
func (c *ValidationProxyController) SetEndpointForTest(namespace, service, podName, endpoint string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	key := registryKey(namespace, service)
	if c.registry[key] == nil {
		c.registry[key] = make(map[string]string)
	}
	c.registry[key][podName] = endpoint
}

// removePod removes a pod from all service registry entries within its namespace.
func (c *ValidationProxyController) removePod(namespace, podName string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	prefix := namespace + "/"
	for key, pods := range c.registry {
		if len(key) > len(prefix) && key[:len(prefix)] == prefix {
			delete(pods, podName)
			if len(pods) == 0 {
				delete(c.registry, key)
			}
		}
	}
}

// registryKey returns the map key for a namespace+service pair.
func registryKey(namespace, service string) string {
	return namespace + "/" + service
}

// isPodReadyWithSidecar returns true when the pod has a Ready condition, a non-empty
// pod IP, and the kubegram-sidecar container is in a ready state.
func isPodReadyWithSidecar(pod *corev1.Pod) bool {
	if !isPodReady(pod) {
		return false
	}
	if pod.Status.PodIP == "" {
		return false
	}
	for _, cs := range pod.Status.ContainerStatuses {
		if cs.Name == sidecarContainerName && cs.Ready {
			return true
		}
	}
	return false
}
