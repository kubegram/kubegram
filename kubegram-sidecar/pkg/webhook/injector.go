// Package webhook provides the Kubernetes Mutating Admission Webhook server
// and pod injection logic for the kubegram-sidecar.
package webhook

import (
	"encoding/json"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

const (
	injectAnnotation  = "kubegram.io/inject"
	serviceAnnotation = "kubegram.io/service"

	sidecarContainerName = "kubegram-sidecar"
)

// jsonPatch represents a single RFC 6902 JSON Patch operation.
type jsonPatch struct {
	Op    string          `json:"op"`
	Path  string          `json:"path"`
	Value json.RawMessage `json:"value,omitempty"`
}

// needsInjection returns true when the pod carries the opt-in annotation and
// does not already have the sidecar container present.
func needsInjection(pod *corev1.Pod) bool {
	if pod.Annotations[injectAnnotation] != "true" {
		return false
	}
	for _, c := range pod.Spec.Containers {
		if c.Name == sidecarContainerName {
			return false
		}
	}
	return true
}

// buildPatch returns the JSON Patch that appends the sidecar container to the pod.
func buildPatch(pod *corev1.Pod, image string) ([]byte, error) {
	serviceName := pod.Annotations[serviceAnnotation]

	privileged := false
	allowEscalation := false

	container := corev1.Container{
		Name:            sidecarContainerName,
		Image:           image,
		ImagePullPolicy: corev1.PullIfNotPresent,
		Args:            []string{"--mode=sidecar"},
		Env: []corev1.EnvVar{
			{
				Name: "KUBEGRAM_NAMESPACE",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{FieldPath: "metadata.namespace"},
				},
			},
			{
				Name: "KUBEGRAM_POD_NAME",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{FieldPath: "metadata.name"},
				},
			},
			{
				// Required so the sidecar reporter can register its pod IP with
				// kubegram-server's sidecar registry (used by the validation workflow
				// to discover which pod to forward test cases to).
				Name: "KUBEGRAM_POD_IP",
				ValueFrom: &corev1.EnvVarSource{
					FieldRef: &corev1.ObjectFieldSelector{FieldPath: "status.podIP"},
				},
			},
			{
				Name:  "KUBEGRAM_SERVICE_NAME",
				Value: serviceName,
			},
		},
		Ports: []corev1.ContainerPort{
			{
				Name:          "metrics",
				ContainerPort: 9090,
				Protocol:      corev1.ProtocolTCP,
			},
		},
		SecurityContext: &corev1.SecurityContext{
			Privileged: &privileged,
			Capabilities: &corev1.Capabilities{
				Add: []corev1.Capability{"NET_ADMIN", "BPF"},
			},
			AllowPrivilegeEscalation: &allowEscalation,
		},
		LivenessProbe: &corev1.Probe{
			ProbeHandler: corev1.ProbeHandler{
				HTTPGet: &corev1.HTTPGetAction{
					Path: "/healthz",
					Port: intstr.FromInt32(8081),
				},
			},
			InitialDelaySeconds: 5,
			PeriodSeconds:       15,
		},
	}

	containerJSON, err := json.Marshal(container)
	if err != nil {
		return nil, fmt.Errorf("marshal sidecar container: %w", err)
	}

	var patches []jsonPatch

	if len(pod.Spec.Containers) == 0 {
		patches = append(patches, jsonPatch{
			Op:    "add",
			Path:  "/spec/containers",
			Value: json.RawMessage(fmt.Sprintf("[%s]", containerJSON)),
		})
	} else {
		patches = append(patches, jsonPatch{
			Op:    "add",
			Path:  "/spec/containers/-",
			Value: json.RawMessage(containerJSON),
		})
	}

	return json.Marshal(patches)
}
