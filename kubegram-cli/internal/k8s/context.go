// Package k8s provides Kubernetes client helpers for the kubegram CLI.
package k8s

import (
	"fmt"
	"os"
	"path/filepath"

	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// GetRestConfig returns a *rest.Config for the given kubecontext.
// If kubeContext is empty the current context from ~/.kube/config is used.
func GetRestConfig(kubeContext string) (*rest.Config, error) {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	if loadingRules.ExplicitPath == "" {
		if home, err := os.UserHomeDir(); err == nil {
			loadingRules.ExplicitPath = filepath.Join(home, ".kube", "config")
		}
	}

	overrides := &clientcmd.ConfigOverrides{}
	if kubeContext != "" {
		overrides.CurrentContext = kubeContext
	}

	cfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		loadingRules,
		overrides,
	).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("unable to load kubeconfig: %w", err)
	}
	return cfg, nil
}

// CurrentContext returns the name of the currently active kubectl context.
func CurrentContext() (string, error) {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	raw, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		loadingRules,
		&clientcmd.ConfigOverrides{},
	).RawConfig()
	if err != nil {
		return "", fmt.Errorf("unable to read kubeconfig: %w", err)
	}
	return raw.CurrentContext, nil
}
