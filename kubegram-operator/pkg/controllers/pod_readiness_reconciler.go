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
	// injectAnnotation is the opt-in label for kubegram-sidecar injection.
	injectAnnotation = "kubegram.io/inject"

	// graphIDAnnotation carries the kubegram graph ID. Added to pods by the
	// operator (or codegen pipeline) so the readiness reconciler can correlate
	// which graph a pod belongs to.
	graphIDAnnotation = "kubegram.io/graph-id"

	// triggerEndpoint is the kubegram-server route that kicks off validation.
	triggerEndpoint = "/api/internal/graph/validate/trigger"
)

// triggerPayload is the JSON body sent to kubegram-server.
type triggerPayload struct {
	GraphID       string `json:"graphId"`
	Namespace     string `json:"namespace"`
	ReadyPodCount int    `json:"readyPodCount"`
}

// PodReadinessReconciler watches Pods annotated with kubegram.io/inject=true.
// When all pods for a given graph-id reach Ready state, it POSTs to
// kubegram-server to auto-trigger the validation workflow.
type PodReadinessReconciler struct {
	client.Client
	Scheme         *runtime.Scheme
	KubegramServer string // e.g. "http://kubegram-server:8090"

	// mu guards triggered to prevent duplicate calls per graphId+namespace pair.
	mu      sync.Mutex
	triggered map[string]bool // key: "namespace/graphId"
	httpClient *http.Client
}

// NewPodReadinessReconciler creates a reconciler.
func NewPodReadinessReconciler(c client.Client, scheme *runtime.Scheme, kubegramServer string) *PodReadinessReconciler {
	return &PodReadinessReconciler{
		Client:         c,
		Scheme:         scheme,
		KubegramServer: kubegramServer,
		triggered:      make(map[string]bool),
		httpClient:     &http.Client{Timeout: 10 * time.Second},
	}
}

// SetupWithManager registers the reconciler with the controller-runtime manager.
func (r *PodReadinessReconciler) SetupWithManager(mgr ctrl.Manager) error {
	// Only reconcile pods that carry the kubegram inject annotation.
	annotationFilter := predicate.NewPredicateFuncs(func(obj client.Object) bool {
		annotations := obj.GetAnnotations()
		return annotations != nil && annotations[injectAnnotation] == "true" && annotations[graphIDAnnotation] != ""
	})

	return ctrl.NewControllerManagedBy(mgr).
		For(&corev1.Pod{}).
		WithEventFilter(annotationFilter).
		Complete(r)
}

// Reconcile is called whenever a kubegram-annotated pod changes state.
func (r *PodReadinessReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	// Fetch the pod
	var pod corev1.Pod
	if err := r.Get(ctx, req.NamespacedName, &pod); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// Extract graph ID
	graphID := pod.Annotations[graphIDAnnotation]
	if graphID == "" {
		return ctrl.Result{}, nil
	}

	namespace := pod.Namespace
	key := fmt.Sprintf("%s/%s", namespace, graphID)

	// Skip if we've already triggered validation for this graph
	r.mu.Lock()
	if r.triggered[key] {
		r.mu.Unlock()
		return ctrl.Result{}, nil
	}
	r.mu.Unlock()

	// List all pods for this graph in the same namespace
	var podList corev1.PodList
	if err := r.List(ctx, &podList,
		client.InNamespace(namespace),
		client.MatchingLabels{},
	); err != nil {
		return ctrl.Result{}, err
	}

	// Filter to pods belonging to this graph
	graphPods := make([]corev1.Pod, 0)
	for _, p := range podList.Items {
		if p.Annotations[graphIDAnnotation] == graphID && p.Annotations[injectAnnotation] == "true" {
			graphPods = append(graphPods, p)
		}
	}

	if len(graphPods) == 0 {
		return ctrl.Result{}, nil
	}

	// Check if all pods for this graph are Ready
	readyCount := 0
	for _, p := range graphPods {
		if isPodReady(&p) {
			readyCount++
		}
	}

	if readyCount < len(graphPods) {
		// Not all ready yet — requeue after a short delay to avoid tight loops
		logger.Info("waiting for all pods to be ready",
			"graphId", graphID,
			"namespace", namespace,
			"ready", readyCount,
			"total", len(graphPods),
		)
		return ctrl.Result{RequeueAfter: 15 * time.Second}, nil
	}

	// All pods are ready — mark as triggered and call kubegram-server
	r.mu.Lock()
	if r.triggered[key] {
		r.mu.Unlock()
		return ctrl.Result{}, nil
	}
	r.triggered[key] = true
	r.mu.Unlock()

	logger.Info("all pods Ready — triggering validation",
		"graphId", graphID,
		"namespace", namespace,
		"readyPods", readyCount,
	)

	if err := r.triggerValidation(ctx, graphID, namespace, readyCount); err != nil {
		// Reset triggered flag so we retry on the next reconcile
		r.mu.Lock()
		delete(r.triggered, key)
		r.mu.Unlock()

		logger.Error(err, "failed to trigger validation", "graphId", graphID)
		return ctrl.Result{RequeueAfter: 30 * time.Second}, nil
	}

	return ctrl.Result{}, nil
}

// triggerValidation calls the kubegram-server validation trigger endpoint.
func (r *PodReadinessReconciler) triggerValidation(ctx context.Context, graphID, namespace string, readyCount int) error {
	if r.KubegramServer == "" {
		return fmt.Errorf("KUBEGRAM_SERVER_URL not set; cannot trigger validation")
	}

	payload := triggerPayload{
		GraphID:       graphID,
		Namespace:     namespace,
		ReadyPodCount: readyCount,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal trigger payload: %w", err)
	}

	url := r.KubegramServer + triggerEndpoint
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("build trigger request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("post to kubegram-server: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("kubegram-server returned %d", resp.StatusCode)
	}

	return nil
}

// isPodReady returns true when the pod has a Ready condition set to True.
func isPodReady(pod *corev1.Pod) bool {
	for _, c := range pod.Status.Conditions {
		if c.Type == corev1.PodReady && c.Status == corev1.ConditionTrue {
			return true
		}
	}
	return false
}
