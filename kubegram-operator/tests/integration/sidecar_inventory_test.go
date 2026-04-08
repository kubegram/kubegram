package integration

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/kubegram/kubegram-operator/pkg/controllers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
)

// ── helpers ────────────────────────────────────────────────────────────────────

func reconcileInventoryPod(t *testing.T, c *controllers.SidecarInventoryController, namespace, name string) {
	t.Helper()
	_, err := c.Reconcile(context.Background(), ctrl.Request{
		NamespacedName: types.NamespacedName{Namespace: namespace, Name: name},
	})
	require.NoError(t, err)
}

func getInventory(c *controllers.SidecarInventoryController) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/sidecar/inventory", nil)
	c.ServeHTTP(w, r)
	return w
}

type inventoryBody struct {
	TotalSidecars int `json:"total_sidecars"`
	Services      []struct {
		Namespace    string   `json:"namespace"`
		Service      string   `json:"service"`
		SidecarCount int      `json:"sidecar_count"`
		Endpoints    []string `json:"endpoints"`
	} `json:"services"`
}

func decodeInventory(t *testing.T, w *httptest.ResponseRecorder) inventoryBody {
	t.Helper()
	var body inventoryBody
	require.NoError(t, json.NewDecoder(w.Body).Decode(&body))
	return body
}

// ── tests ─────────────────────────────────────────────────────────────────────

func TestSidecarInventory_EmptyRegistry(t *testing.T) {
	c := controllers.NewSidecarInventoryController(newVPFakeClient(), vpScheme())
	w := getInventory(c)

	assert.Equal(t, http.StatusOK, w.Code)
	body := decodeInventory(t, w)
	assert.Equal(t, 0, body.TotalSidecars)
	assert.Empty(t, body.Services)
}

func TestSidecarInventory_RegistersReadyPod(t *testing.T) {
	pod := makeReadySidecarPod("pod-1", "default", "my-api", "10.0.0.1")
	c := controllers.NewSidecarInventoryController(newVPFakeClient(pod), vpScheme())
	reconcileInventoryPod(t, c, "default", "pod-1")

	w := getInventory(c)
	assert.Equal(t, http.StatusOK, w.Code)

	body := decodeInventory(t, w)
	assert.Equal(t, 1, body.TotalSidecars)
	require.Len(t, body.Services, 1)
	assert.Equal(t, "default", body.Services[0].Namespace)
	assert.Equal(t, "my-api", body.Services[0].Service)
	assert.Equal(t, 1, body.Services[0].SidecarCount)
	assert.Contains(t, body.Services[0].Endpoints, "10.0.0.1:9090")
}

func TestSidecarInventory_IgnoresNotReadyPod(t *testing.T) {
	pod := makeNotReadyPod("pod-1", "default", "my-api", "10.0.0.1")
	c := controllers.NewSidecarInventoryController(newVPFakeClient(pod), vpScheme())
	reconcileInventoryPod(t, c, "default", "pod-1")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 0, body.TotalSidecars)
	assert.Empty(t, body.Services)
}

func TestSidecarInventory_IgnoresMissingSidecarContainer(t *testing.T) {
	pod := makeNoSidecarPod("pod-1", "default", "my-api", "10.0.0.1")
	c := controllers.NewSidecarInventoryController(newVPFakeClient(pod), vpScheme())
	reconcileInventoryPod(t, c, "default", "pod-1")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 0, body.TotalSidecars)
	assert.Empty(t, body.Services)
}

func TestSidecarInventory_MultiPodsMultiServices(t *testing.T) {
	pod1 := makeReadySidecarPod("pod-1", "default", "svc-a", "10.0.0.1")
	pod2 := makeReadySidecarPod("pod-2", "default", "svc-b", "10.0.0.2")
	c := controllers.NewSidecarInventoryController(newVPFakeClient(pod1, pod2), vpScheme())
	reconcileInventoryPod(t, c, "default", "pod-1")
	reconcileInventoryPod(t, c, "default", "pod-2")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 2, body.TotalSidecars)
	assert.Len(t, body.Services, 2)

	// Services sorted by key ("default/svc-a" < "default/svc-b").
	assert.Equal(t, "svc-a", body.Services[0].Service)
	assert.Equal(t, "svc-b", body.Services[1].Service)
}

func TestSidecarInventory_TwoPodsOneSameService(t *testing.T) {
	pod1 := makeReadySidecarPod("pod-1", "default", "my-api", "10.0.0.1")
	pod2 := makeReadySidecarPod("pod-2", "default", "my-api", "10.0.0.2")
	c := controllers.NewSidecarInventoryController(newVPFakeClient(pod1, pod2), vpScheme())
	reconcileInventoryPod(t, c, "default", "pod-1")
	reconcileInventoryPod(t, c, "default", "pod-2")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 2, body.TotalSidecars)
	require.Len(t, body.Services, 1)
	assert.Equal(t, 2, body.Services[0].SidecarCount)
	assert.Len(t, body.Services[0].Endpoints, 2)
}

func TestSidecarInventory_RemovesPodOnDeletion(t *testing.T) {
	pod := makeReadySidecarPod("pod-1", "default", "my-api", "10.0.0.1")
	fc := newVPFakeClient(pod)
	c := controllers.NewSidecarInventoryController(fc, vpScheme())
	reconcileInventoryPod(t, c, "default", "pod-1")

	// Confirm pod is registered.
	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 1, body.TotalSidecars)

	// Delete the pod and reconcile (NotFound path triggers removal).
	require.NoError(t, fc.Delete(context.Background(), pod))
	reconcileInventoryPod(t, c, "default", "pod-1")

	body = decodeInventory(t, getInventory(c))
	assert.Equal(t, 0, body.TotalSidecars)
	assert.Empty(t, body.Services)
}

func TestSidecarInventory_InvalidMethod(t *testing.T) {
	c := controllers.NewSidecarInventoryController(newVPFakeClient(), vpScheme())
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/sidecar/inventory", nil)
	c.ServeHTTP(w, r)
	assert.Equal(t, http.StatusMethodNotAllowed, w.Code)
}

func TestSidecarInventory_ResponseIsJSON(t *testing.T) {
	c := controllers.NewSidecarInventoryController(newVPFakeClient(), vpScheme())
	w := getInventory(c)
	assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
}

// TestSidecarInventory_IdempotentReconcile verifies that reconciling the same ready
// pod twice produces exactly one endpoint entry, not two.
func TestSidecarInventory_IdempotentReconcile(t *testing.T) {
	pod := makeReadySidecarPod("pod-1", "default", "my-api", "10.0.0.1")
	fc := newVPFakeClient(pod)
	c := controllers.NewSidecarInventoryController(fc, vpScheme())

	reconcileInventoryPod(t, c, "default", "pod-1")
	reconcileInventoryPod(t, c, "default", "pod-1")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 1, body.TotalSidecars)
	require.Len(t, body.Services, 1)
	assert.Len(t, body.Services[0].Endpoints, 1)
}

// TestSidecarInventory_PodWithNoServiceAnnotation verifies that a pod carrying
// kubegram.io/inject=true but no kubegram.io/service annotation is silently ignored.
func TestSidecarInventory_PodWithNoServiceAnnotation(t *testing.T) {
	pod := makeReadySidecarPod("pod-1", "default", "", "10.0.0.1")
	fc := newVPFakeClient(pod)
	c := controllers.NewSidecarInventoryController(fc, vpScheme())
	reconcileInventoryPod(t, c, "default", "pod-1")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 0, body.TotalSidecars)
	assert.Empty(t, body.Services)
}

// TestSidecarInventory_CrossNamespaceIsolation verifies that two services sharing the
// same name but living in different namespaces are tracked as separate registry entries.
func TestSidecarInventory_CrossNamespaceIsolation(t *testing.T) {
	pod1 := makeReadySidecarPod("pod-1", "ns-a", "my-api", "10.0.0.1")
	pod2 := makeReadySidecarPod("pod-2", "ns-b", "my-api", "10.0.0.2")
	fc := newVPFakeClient(pod1, pod2)
	c := controllers.NewSidecarInventoryController(fc, vpScheme())
	reconcileInventoryPod(t, c, "ns-a", "pod-1")
	reconcileInventoryPod(t, c, "ns-b", "pod-2")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 2, body.TotalSidecars)
	require.Len(t, body.Services, 2)

	// Sorted by key: "ns-a/my-api" < "ns-b/my-api"
	assert.Equal(t, "ns-a", body.Services[0].Namespace)
	assert.Equal(t, "ns-b", body.Services[1].Namespace)
	assert.Equal(t, "my-api", body.Services[0].Service)
	assert.Equal(t, "my-api", body.Services[1].Service)
}

// TestSidecarInventory_PodTransitionsToNotReady verifies that a previously registered
// pod is removed from the inventory when it transitions to a not-ready state.
func TestSidecarInventory_PodTransitionsToNotReady(t *testing.T) {
	pod := makeReadySidecarPod("pod-1", "default", "my-api", "10.0.0.1")
	fc := newVPFakeClient(pod)
	c := controllers.NewSidecarInventoryController(fc, vpScheme())

	reconcileInventoryPod(t, c, "default", "pod-1")
	assert.Equal(t, 1, decodeInventory(t, getInventory(c)).TotalSidecars)

	// Fetch current version from fake client, flip ready condition, push status update.
	var current corev1.Pod
	require.NoError(t, fc.Get(context.Background(),
		types.NamespacedName{Namespace: "default", Name: "pod-1"}, &current))
	current.Status.Conditions[0].Status = corev1.ConditionFalse
	require.NoError(t, fc.Status().Update(context.Background(), &current))

	reconcileInventoryPod(t, c, "default", "pod-1")

	body := decodeInventory(t, getInventory(c))
	assert.Equal(t, 0, body.TotalSidecars)
	assert.Empty(t, body.Services)
}
