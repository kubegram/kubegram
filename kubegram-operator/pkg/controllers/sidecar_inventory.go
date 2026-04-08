// Package controllers contains controller-runtime reconcilers for kubegram-operator.
package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"sync"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/predicate"
)

// serviceInventoryEntry describes a single service and its live sidecar endpoints.
type serviceInventoryEntry struct {
	Namespace    string   `json:"namespace"`
	Service      string   `json:"service"`
	SidecarCount int      `json:"sidecar_count"`
	Endpoints    []string `json:"endpoints"`
}

// inventoryResponse is the JSON body returned by GET /sidecar/inventory.
type inventoryResponse struct {
	TotalSidecars int                     `json:"total_sidecars"`
	Services      []serviceInventoryEntry `json:"services"`
}

// SidecarInventoryController watches pods with the kubegram sidecar injected and
// maintains a cluster-wide in-memory census of live sidecar endpoints.
//
// It is mounted at GET /sidecar/inventory on the metrics server (port 8080).
//
// Response:
//
//	{ "total_sidecars": 3, "services": [
//	    { "namespace": "default", "service": "my-api", "sidecar_count": 2, "endpoints": ["10.0.0.1:9090", "10.0.0.2:9090"] }
//	]}
type SidecarInventoryController struct {
	client.Client
	Scheme *runtime.Scheme

	mu sync.RWMutex
	// registry maps "namespace/service" → map[podName]"podIP:9090"
	registry map[string]map[string]string
}

// NewSidecarInventoryController creates a SidecarInventoryController.
func NewSidecarInventoryController(c client.Client, scheme *runtime.Scheme) *SidecarInventoryController {
	return &SidecarInventoryController{
		Client:   c,
		Scheme:   scheme,
		registry: make(map[string]map[string]string),
	}
}

// SetupWithManager registers the reconciler with the controller-runtime manager.
func (c *SidecarInventoryController) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		Named("sidecar-inventory").
		For(&corev1.Pod{}).
		WithEventFilter(predicate.NewPredicateFuncs(func(obj client.Object) bool {
			ann := obj.GetAnnotations()
			return ann != nil && ann[injectAnnotation] == "true"
		})).
		Complete(c)
}

// Reconcile keeps the sidecar registry up to date when pods change state.
func (c *SidecarInventoryController) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	var pod corev1.Pod
	if err := c.Get(ctx, req.NamespacedName, &pod); err != nil {
		if client.IgnoreNotFound(err) == nil {
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

		logger.Info("inventory: registered sidecar endpoint",
			"pod", pod.Name,
			"service", svc,
			"endpoint", endpoint,
		)
	} else {
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

// ServeHTTP handles GET /sidecar/inventory.
// Returns the total number of live sidecars and a per-service breakdown.
func (c *SidecarInventoryController) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	c.mu.RLock()
	keys := make([]string, 0, len(c.registry))
	for k := range c.registry {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var total int
	entries := make([]serviceInventoryEntry, 0, len(keys))
	for _, key := range keys {
		pods := c.registry[key]
		eps := make([]string, 0, len(pods))
		for _, ep := range pods {
			eps = append(eps, ep)
		}
		sort.Strings(eps)

		ns, svc := splitRegistryKey(key)
		entries = append(entries, serviceInventoryEntry{
			Namespace:    ns,
			Service:      svc,
			SidecarCount: len(pods),
			Endpoints:    eps,
		})
		total += len(pods)
	}
	c.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(inventoryResponse{ //nolint:errcheck
		TotalSidecars: total,
		Services:      entries,
	})
}

// SetEndpointForTest injects a sidecar endpoint directly into the registry.
// Intended for use in tests only.
func (c *SidecarInventoryController) SetEndpointForTest(namespace, service, podName, endpoint string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	key := registryKey(namespace, service)
	if c.registry[key] == nil {
		c.registry[key] = make(map[string]string)
	}
	c.registry[key][podName] = endpoint
}

// removePod removes a pod from all service registry entries within its namespace.
func (c *SidecarInventoryController) removePod(namespace, podName string) {
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

// splitRegistryKey splits a "namespace/service" key into its components.
func splitRegistryKey(key string) (namespace, service string) {
	for i := 0; i < len(key); i++ {
		if key[i] == '/' {
			return key[:i], key[i+1:]
		}
	}
	return key, ""
}
