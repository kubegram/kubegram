// Package controllers contains controller-runtime reconcilers for kubegram-operator.
package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
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
	servicePortAnnotation = "kubegram.io/service-port"
	schemaCacheTTL        = 5 * time.Minute
)

// ServiceSchema describes a discovered API schema for a service.
type ServiceSchema struct {
	Type   string `json:"type"`   // "graphql" or "openapi"
	URL    string `json:"url"`
	Schema string `json:"schema"`
}

// ServiceInfo describes a service with attached sidecars and its discovered schema.
type ServiceInfo struct {
	Namespace    string         `json:"namespace"`
	Service      string         `json:"service"`
	SidecarCount int            `json:"sidecar_count"`
	Schema       *ServiceSchema `json:"schema"`
}

// discoveryResponse is the JSON body returned by GET /service/discovery.
type discoveryResponse struct {
	Services []ServiceInfo `json:"services"`
}

// cachedSchema wraps a schema discovery result with a timestamp for TTL eviction.
type cachedSchema struct {
	result    *ServiceSchema
	fetchedAt time.Time
}

// ServiceDiscoveryController watches pods with the kubegram sidecar injected,
// maintains a registry of live sidecar-attached services, and on request probes
// each service for a GraphQL introspection endpoint or an OpenAPI/Swagger schema.
//
// It is mounted at GET /service/discovery on the metrics server (port 8080).
// Schema results are cached for 5 minutes and invalidated when pod state changes.
//
// Flow:
//  1. Client GETs /service/discovery.
//  2. Controller iterates registry; for each service checks the schema cache.
//  3. On cache miss or TTL expiry: probes service URL for GraphQL then OpenAPI.
//  4. Returns a list of ServiceInfo, including schema (or null) per service.
type ServiceDiscoveryController struct {
	client.Client
	Scheme     *runtime.Scheme
	httpClient *http.Client

	mu sync.RWMutex
	// registry maps "namespace/service" → map[podName]"podIP:9090"
	registry map[string]map[string]string
	// schemaCache maps "namespace/service" → cached discovery result
	schemaCache map[string]*cachedSchema
	// baseURLOverrides maps "namespace/service" → base URL; used in tests to
	// redirect cluster-local DNS to a test HTTP server.
	baseURLOverrides map[string]string

	// clockFn returns the current time; injectable for tests.
	clockFn func() time.Time
}

// NewServiceDiscoveryController creates a ServiceDiscoveryController.
func NewServiceDiscoveryController(c client.Client, scheme *runtime.Scheme) *ServiceDiscoveryController {
	return &ServiceDiscoveryController{
		Client:           c,
		Scheme:           scheme,
		httpClient:       &http.Client{Timeout: 10 * time.Second},
		registry:         make(map[string]map[string]string),
		schemaCache:      make(map[string]*cachedSchema),
		baseURLOverrides: make(map[string]string),
		clockFn:          time.Now,
	}
}

// SetupWithManager registers the reconciler with the controller-runtime manager.
func (c *ServiceDiscoveryController) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		Named("service-discovery").
		For(&corev1.Pod{}).
		WithEventFilter(predicate.NewPredicateFuncs(func(obj client.Object) bool {
			ann := obj.GetAnnotations()
			return ann != nil && ann[injectAnnotation] == "true"
		})).
		Complete(c)
}

// Reconcile keeps the sidecar registry up to date and invalidates stale schema cache
// entries whenever pod state changes.
func (c *ServiceDiscoveryController) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
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
		delete(c.schemaCache, key) // invalidate stale cache on topology change
		c.mu.Unlock()

		logger.Info("discovery: registered sidecar endpoint",
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
			delete(c.schemaCache, key)
		}
		c.mu.Unlock()
	}

	return ctrl.Result{}, nil
}

// ServeHTTP handles GET /service/discovery.
// For each service in the registry, returns its sidecar count and discovered schema.
func (c *ServiceDiscoveryController) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Snapshot registry under read lock.
	c.mu.RLock()
	keys := make([]string, 0, len(c.registry))
	type snapshot struct {
		count int
		port  string
	}
	snapshots := make(map[string]snapshot, len(c.registry))
	for k, pods := range c.registry {
		// Grab the service-port annotation from any pod in this group.
		// We use the registry key to find pods; port defaults to "80".
		port := "80"
		snapshots[k] = snapshot{count: len(pods), port: port}
		keys = append(keys, k)
	}
	c.mu.RUnlock()

	sort.Strings(keys)
	ctx := r.Context()

	services := make([]ServiceInfo, 0, len(keys))
	for _, key := range keys {
		ns, svc := splitRegistryKey(key)
		snap := snapshots[key]
		schema := c.cachedOrDiscover(ctx, key, ns, svc, snap.port)
		services = append(services, ServiceInfo{
			Namespace:    ns,
			Service:      svc,
			SidecarCount: snap.count,
			Schema:       schema,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(discoveryResponse{Services: services}) //nolint:errcheck
}

// cachedOrDiscover returns the cached schema for key or runs discovery and caches the result.
func (c *ServiceDiscoveryController) cachedOrDiscover(ctx context.Context, key, namespace, service, port string) *ServiceSchema {
	c.mu.RLock()
	cached := c.schemaCache[key]
	now := c.clockFn()
	c.mu.RUnlock()

	if cached != nil && now.Sub(cached.fetchedAt) < schemaCacheTTL {
		return cached.result
	}

	result := c.discoverSchema(ctx, namespace, service, port)

	c.mu.Lock()
	c.schemaCache[key] = &cachedSchema{result: result, fetchedAt: now}
	c.mu.Unlock()

	return result
}

// discoverSchema probes the service for a GraphQL or OpenAPI schema.
// It first tries GraphQL introspection, then a set of well-known OpenAPI paths.
func (c *ServiceDiscoveryController) discoverSchema(ctx context.Context, namespace, service, port string) *ServiceSchema {
	baseURL := c.serviceBaseURL(namespace, service, port)

	// 1. GraphQL introspection
	graphqlURL := baseURL + "/graphql"
	body := []byte(`{"query":"{ __schema { types { name } } }"}`)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, graphqlURL, bytes.NewReader(body))
	if err == nil {
		req.Header.Set("Content-Type", "application/json")
		resp, err := c.httpClient.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				data, err := io.ReadAll(resp.Body)
				if err == nil && json.Valid(data) {
					return &ServiceSchema{Type: "graphql", URL: graphqlURL, Schema: string(data)}
				}
			}
		}
	}

	// 2. OpenAPI / Swagger
	openAPIPaths := []string{
		"/openapi.json",
		"/swagger.json",
		"/api-docs",
		"/v2/api-docs",
		"/v3/api-docs",
		"/swagger/v1/swagger.json",
	}
	for _, path := range openAPIPaths {
		u := baseURL + path
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
		if err != nil {
			continue
		}
		resp, err := c.httpClient.Do(req)
		if err != nil {
			continue
		}
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			data, err := io.ReadAll(resp.Body)
			if err == nil {
				return &ServiceSchema{Type: "openapi", URL: u, Schema: string(data)}
			}
		}
	}

	return nil
}

// serviceBaseURL returns the base URL to probe for schema discovery.
// In tests this can be overridden via SetBaseURLForTest.
func (c *ServiceDiscoveryController) serviceBaseURL(namespace, service, port string) string {
	c.mu.RLock()
	override := c.baseURLOverrides[registryKey(namespace, service)]
	c.mu.RUnlock()
	if override != "" {
		return override
	}
	if port == "80" || port == "" {
		return fmt.Sprintf("http://%s.%s.svc.cluster.local", service, namespace)
	}
	return fmt.Sprintf("http://%s.%s.svc.cluster.local:%s", service, namespace, port)
}

// SetEndpointForTest injects a sidecar endpoint directly into the registry.
// Intended for use in tests only.
func (c *ServiceDiscoveryController) SetEndpointForTest(namespace, service, podName, endpoint string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	key := registryKey(namespace, service)
	if c.registry[key] == nil {
		c.registry[key] = make(map[string]string)
	}
	c.registry[key][podName] = endpoint
}

// SetBaseURLForTest overrides the base URL used in discoverSchema for a specific
// namespace/service pair, redirecting probes to a test HTTP server.
func (c *ServiceDiscoveryController) SetBaseURLForTest(namespace, service, baseURL string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.baseURLOverrides[registryKey(namespace, service)] = baseURL
}

// SetClockFnForTest replaces the clock function used for cache TTL checks.
// Intended for use in tests only.
func (c *ServiceDiscoveryController) SetClockFnForTest(fn func() time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.clockFn = fn
}

// removePod removes a pod from the registry and invalidates the schema cache for
// all service entries within its namespace.
func (c *ServiceDiscoveryController) removePod(namespace, podName string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	prefix := namespace + "/"
	for key, pods := range c.registry {
		if len(key) > len(prefix) && key[:len(prefix)] == prefix {
			delete(pods, podName)
			if len(pods) == 0 {
				delete(c.registry, key)
			}
			delete(c.schemaCache, key)
		}
	}
}
