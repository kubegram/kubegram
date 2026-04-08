package integration

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/kubegram/kubegram-operator/pkg/controllers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
)

// ── helpers ────────────────────────────────────────────────────────────────────

func reconcileDiscoveryPod(t *testing.T, c *controllers.ServiceDiscoveryController, namespace, name string) {
	t.Helper()
	_, err := c.Reconcile(context.Background(), ctrl.Request{
		NamespacedName: types.NamespacedName{Namespace: namespace, Name: name},
	})
	require.NoError(t, err)
}

func getDiscovery(c *controllers.ServiceDiscoveryController) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/service/discovery", nil)
	c.ServeHTTP(w, r)
	return w
}

type discoveryBody struct {
	Services []struct {
		Namespace    string `json:"namespace"`
		Service      string `json:"service"`
		SidecarCount int    `json:"sidecar_count"`
		Schema       *struct {
			Type   string `json:"type"`
			URL    string `json:"url"`
			Schema string `json:"schema"`
		} `json:"schema"`
	} `json:"services"`
}

func decodeDiscovery(t *testing.T, w *httptest.ResponseRecorder) discoveryBody {
	t.Helper()
	var body discoveryBody
	require.NoError(t, json.NewDecoder(w.Body).Decode(&body))
	return body
}

// newDiscoveryController creates a controller seeded with one ready sidecar pod and
// the base URL pointing to srv, so schema probes hit the test server.
func newDiscoveryController(t *testing.T, srv *httptest.Server) *controllers.ServiceDiscoveryController {
	t.Helper()
	pod := makeReadySidecarPod("pod-1", "default", "my-svc", "10.0.0.1")
	c := controllers.NewServiceDiscoveryController(newVPFakeClient(pod), vpScheme())
	c.SetEndpointForTest("default", "my-svc", "pod-1", "10.0.0.1:9090")
	c.SetBaseURLForTest("default", "my-svc", srv.URL)
	return c
}

// ── tests ─────────────────────────────────────────────────────────────────────

func TestServiceDiscovery_EmptyRegistry(t *testing.T) {
	c := controllers.NewServiceDiscoveryController(newVPFakeClient(), vpScheme())
	w := getDiscovery(c)

	assert.Equal(t, http.StatusOK, w.Code)
	body := decodeDiscovery(t, w)
	assert.Empty(t, body.Services)
}

func TestServiceDiscovery_InvalidMethod(t *testing.T) {
	c := controllers.NewServiceDiscoveryController(newVPFakeClient(), vpScheme())
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/service/discovery", nil)
	c.ServeHTTP(w, r)
	assert.Equal(t, http.StatusMethodNotAllowed, w.Code)
}

func TestServiceDiscovery_GraphQLService(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/graphql" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"__schema":{"types":[]}}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	c := newDiscoveryController(t, srv)
	w := getDiscovery(c)

	assert.Equal(t, http.StatusOK, w.Code)
	body := decodeDiscovery(t, w)
	require.Len(t, body.Services, 1)
	require.NotNil(t, body.Services[0].Schema)
	assert.Equal(t, "graphql", body.Services[0].Schema.Type)
	assert.Contains(t, body.Services[0].Schema.URL, "/graphql")
	assert.NotEmpty(t, body.Services[0].Schema.Schema)
}

func TestServiceDiscovery_OpenAPIService(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/openapi.json" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"openapi":"3.0.0","info":{"title":"Test"}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	c := newDiscoveryController(t, srv)
	w := getDiscovery(c)

	body := decodeDiscovery(t, w)
	require.Len(t, body.Services, 1)
	require.NotNil(t, body.Services[0].Schema)
	assert.Equal(t, "openapi", body.Services[0].Schema.Type)
	assert.Contains(t, body.Services[0].Schema.URL, "/openapi.json")
}

func TestServiceDiscovery_NoSchemaFound(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}))
	defer srv.Close()

	c := newDiscoveryController(t, srv)
	w := getDiscovery(c)

	body := decodeDiscovery(t, w)
	require.Len(t, body.Services, 1)
	assert.Nil(t, body.Services[0].Schema)
	assert.Equal(t, 1, body.Services[0].SidecarCount)
}

func TestServiceDiscovery_SchemaCacheHit(t *testing.T) {
	var callCount atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/graphql" {
			callCount.Add(1)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	c := newDiscoveryController(t, srv)

	// First call — cache miss, probe fired.
	getDiscovery(c)
	assert.Equal(t, int32(1), callCount.Load())

	// Second call within TTL — cache hit, no additional probe.
	getDiscovery(c)
	assert.Equal(t, int32(1), callCount.Load())
}

func TestServiceDiscovery_CacheTTLExpiry(t *testing.T) {
	var callCount atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/graphql" {
			callCount.Add(1)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	// Freeze clock at t=0.
	frozen := time.Now()
	c := newDiscoveryController(t, srv)
	c.SetClockFnForTest(func() time.Time { return frozen })

	// First call — cache miss.
	getDiscovery(c)
	assert.Equal(t, int32(1), callCount.Load())

	// Advance clock past TTL.
	c.SetClockFnForTest(func() time.Time { return frozen.Add(6 * time.Minute) })

	// Second call — TTL expired, cache miss → re-probe.
	getDiscovery(c)
	assert.Equal(t, int32(2), callCount.Load())
}

func TestServiceDiscovery_PodDeletionInvalidatesCache(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/graphql" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	pod := makeReadySidecarPod("pod-1", "default", "my-svc", "10.0.0.1")
	fc := newVPFakeClient(pod)
	c := controllers.NewServiceDiscoveryController(fc, vpScheme())
	c.SetEndpointForTest("default", "my-svc", "pod-1", "10.0.0.1:9090")
	c.SetBaseURLForTest("default", "my-svc", srv.URL)

	// Seed cache via first discovery request.
	getDiscovery(c)
	body := decodeDiscovery(t, getDiscovery(c))
	require.Len(t, body.Services, 1)

	// Delete pod and reconcile — registry entry and cache should be removed.
	require.NoError(t, fc.Delete(context.Background(), pod))
	reconcileDiscoveryPod(t, c, "default", "pod-1")

	body = decodeDiscovery(t, getDiscovery(c))
	assert.Empty(t, body.Services)
}

func TestServiceDiscovery_ResponseIsJSON(t *testing.T) {
	c := controllers.NewServiceDiscoveryController(newVPFakeClient(), vpScheme())
	w := getDiscovery(c)
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
}

// TestServiceDiscovery_NullSchemaField verifies that services with no discoverable
// schema serialize the "schema" key as JSON null, not as a missing key or empty object.
func TestServiceDiscovery_NullSchemaField(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	}))
	defer srv.Close()

	c := newDiscoveryController(t, srv)
	w := getDiscovery(c)

	var raw struct {
		Services []map[string]interface{} `json:"services"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&raw))
	require.Len(t, raw.Services, 1)
	schema, exists := raw.Services[0]["schema"]
	assert.True(t, exists, "schema key must be present in the JSON output")
	assert.Nil(t, schema, "schema value must be null, not absent or an empty object")
}

// TestServiceDiscovery_ReconcileRegistersService verifies the full reconcile path:
// Reconcile (not SetEndpointForTest) populates the registry and the service appears
// in the discovery response.
func TestServiceDiscovery_ReconcileRegistersService(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/graphql" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	pod := makeReadySidecarPod("pod-1", "staging", "my-svc", "10.1.0.1")
	fc := newVPFakeClient(pod)
	c := controllers.NewServiceDiscoveryController(fc, vpScheme())
	c.SetBaseURLForTest("staging", "my-svc", srv.URL)

	// Populate registry via Reconcile rather than SetEndpointForTest.
	reconcileDiscoveryPod(t, c, "staging", "pod-1")

	body := decodeDiscovery(t, getDiscovery(c))
	require.Len(t, body.Services, 1)
	assert.Equal(t, "staging", body.Services[0].Namespace)
	assert.Equal(t, "my-svc", body.Services[0].Service)
	assert.Equal(t, 1, body.Services[0].SidecarCount)
	require.NotNil(t, body.Services[0].Schema)
	assert.Equal(t, "graphql", body.Services[0].Schema.Type)
}

// TestServiceDiscovery_PodTransitionsToNotReady verifies that when a registered pod
// becomes not-ready, its service is removed from the discovery response and its
// cached schema is invalidated.
func TestServiceDiscovery_PodTransitionsToNotReady(t *testing.T) {
	var probeCount atomic.Int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/graphql" {
			probeCount.Add(1)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv.Close()

	pod := makeReadySidecarPod("pod-1", "default", "my-svc", "10.0.0.1")
	fc := newVPFakeClient(pod)
	c := controllers.NewServiceDiscoveryController(fc, vpScheme())
	c.SetEndpointForTest("default", "my-svc", "pod-1", "10.0.0.1:9090")
	c.SetBaseURLForTest("default", "my-svc", srv.URL)

	// Seed the registry and cache.
	body := decodeDiscovery(t, getDiscovery(c))
	require.Len(t, body.Services, 1)
	assert.Equal(t, int32(1), probeCount.Load())

	// Transition pod to not-ready in the fake client.
	var current corev1.Pod
	require.NoError(t, fc.Get(context.Background(),
		types.NamespacedName{Namespace: "default", Name: "pod-1"}, &current))
	current.Status.Conditions[0].Status = corev1.ConditionFalse
	require.NoError(t, fc.Status().Update(context.Background(), &current))

	reconcileDiscoveryPod(t, c, "default", "pod-1")

	// Service should no longer appear; cache should also be gone.
	body = decodeDiscovery(t, getDiscovery(c))
	assert.Empty(t, body.Services)
	// No additional probes because registry (and cache) were cleared.
	assert.Equal(t, int32(1), probeCount.Load())
}

// TestServiceDiscovery_CrossNamespaceServices verifies that identically named services
// in different namespaces are tracked and probed independently.
func TestServiceDiscovery_CrossNamespaceServices(t *testing.T) {
	srvA := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/graphql" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srvA.Close()

	srvB := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/openapi.json" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"openapi":"3.0.0"}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srvB.Close()

	pod1 := makeReadySidecarPod("pod-1", "ns-a", "api", "10.0.0.1")
	pod2 := makeReadySidecarPod("pod-2", "ns-b", "api", "10.0.0.2")
	fc := newVPFakeClient(pod1, pod2)
	c := controllers.NewServiceDiscoveryController(fc, vpScheme())
	c.SetEndpointForTest("ns-a", "api", "pod-1", "10.0.0.1:9090")
	c.SetEndpointForTest("ns-b", "api", "pod-2", "10.0.0.2:9090")
	c.SetBaseURLForTest("ns-a", "api", srvA.URL)
	c.SetBaseURLForTest("ns-b", "api", srvB.URL)

	body := decodeDiscovery(t, getDiscovery(c))
	require.Len(t, body.Services, 2)

	// Sorted by key: "ns-a/api" < "ns-b/api"
	assert.Equal(t, "ns-a", body.Services[0].Namespace)
	require.NotNil(t, body.Services[0].Schema)
	assert.Equal(t, "graphql", body.Services[0].Schema.Type)

	assert.Equal(t, "ns-b", body.Services[1].Namespace)
	require.NotNil(t, body.Services[1].Schema)
	assert.Equal(t, "openapi", body.Services[1].Schema.Type)
}

// TestServiceDiscovery_MultipleServices verifies that a single GET /service/discovery
// returns correctly discovered schemas for multiple services in one response.
func TestServiceDiscovery_MultipleServices(t *testing.T) {
	srvGQL := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/graphql" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{"__schema":{}}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srvGQL.Close()

	srvOAS := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/openapi.json" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"openapi":"3.0.0","info":{"title":"REST"}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srvOAS.Close()

	pod1 := makeReadySidecarPod("pod-1", "default", "svc-graphql", "10.0.0.1")
	pod2 := makeReadySidecarPod("pod-2", "default", "svc-openapi", "10.0.0.2")
	fc := newVPFakeClient(pod1, pod2)
	c := controllers.NewServiceDiscoveryController(fc, vpScheme())
	c.SetEndpointForTest("default", "svc-graphql", "pod-1", "10.0.0.1:9090")
	c.SetEndpointForTest("default", "svc-openapi", "pod-2", "10.0.0.2:9090")
	c.SetBaseURLForTest("default", "svc-graphql", srvGQL.URL)
	c.SetBaseURLForTest("default", "svc-openapi", srvOAS.URL)

	body := decodeDiscovery(t, getDiscovery(c))
	require.Len(t, body.Services, 2)

	// Sorted by key: "default/svc-graphql" < "default/svc-openapi"
	require.NotNil(t, body.Services[0].Schema)
	assert.Equal(t, "graphql", body.Services[0].Schema.Type)
	require.NotNil(t, body.Services[1].Schema)
	assert.Equal(t, "openapi", body.Services[1].Schema.Type)
}

// TestServiceDiscovery_GraphQLInvalidJSONFallsThrough verifies that a GraphQL endpoint
// returning HTTP 200 but non-JSON body is treated as a failed probe and the controller
// falls through to OpenAPI discovery.
func TestServiceDiscovery_GraphQLInvalidJSONFallsThrough(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/graphql":
			// 200 but plaintext, not JSON.
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Internal Server Error")) //nolint:errcheck
		case "/openapi.json":
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"openapi":"3.0.0"}`)) //nolint:errcheck
		default:
			http.NotFound(w, r)
		}
	}))
	defer srv.Close()

	c := newDiscoveryController(t, srv)
	body := decodeDiscovery(t, getDiscovery(c))

	require.Len(t, body.Services, 1)
	require.NotNil(t, body.Services[0].Schema)
	assert.Equal(t, "openapi", body.Services[0].Schema.Type)
}

// TestServiceDiscovery_OpenAPIPathFallbacks verifies that every well-known OpenAPI path
// is tried in order when earlier paths return 404.
func TestServiceDiscovery_OpenAPIPathFallbacks(t *testing.T) {
	paths := []string{
		"/swagger.json",
		"/api-docs",
		"/v2/api-docs",
		"/v3/api-docs",
		"/swagger/v1/swagger.json",
	}
	for _, path := range paths {
		path := path
		t.Run(path, func(t *testing.T) {
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == path {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{"openapi":"3.0.0"}`)) //nolint:errcheck
					return
				}
				http.NotFound(w, r)
			}))
			defer srv.Close()

			c := newDiscoveryController(t, srv)
			body := decodeDiscovery(t, getDiscovery(c))

			require.Len(t, body.Services, 1)
			require.NotNil(t, body.Services[0].Schema)
			assert.Equal(t, "openapi", body.Services[0].Schema.Type)
			assert.Contains(t, body.Services[0].Schema.URL, path)
		})
	}
}

// TestServiceDiscovery_CachePerService verifies that schema caching is keyed per
// service: a cache hit for one service does not suppress probing another service.
func TestServiceDiscovery_CachePerService(t *testing.T) {
	var calls1, calls2 atomic.Int32

	srv1 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/graphql" {
			calls1.Add(1)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"data":{}}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv1.Close()

	srv2 := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/openapi.json" {
			calls2.Add(1)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"openapi":"3.0.0"}`)) //nolint:errcheck
			return
		}
		http.NotFound(w, r)
	}))
	defer srv2.Close()

	pod1 := makeReadySidecarPod("pod-1", "default", "svc-1", "10.0.0.1")
	pod2 := makeReadySidecarPod("pod-2", "default", "svc-2", "10.0.0.2")
	fc := newVPFakeClient(pod1, pod2)
	c := controllers.NewServiceDiscoveryController(fc, vpScheme())
	c.SetEndpointForTest("default", "svc-1", "pod-1", "10.0.0.1:9090")
	c.SetEndpointForTest("default", "svc-2", "pod-2", "10.0.0.2:9090")
	c.SetBaseURLForTest("default", "svc-1", srv1.URL)
	c.SetBaseURLForTest("default", "svc-2", srv2.URL)

	// First GET: both services probed once.
	getDiscovery(c)
	assert.Equal(t, int32(1), calls1.Load())
	assert.Equal(t, int32(1), calls2.Load())

	// Second GET within TTL: both served from cache, no additional probes.
	getDiscovery(c)
	assert.Equal(t, int32(1), calls1.Load())
	assert.Equal(t, int32(1), calls2.Load())
}
