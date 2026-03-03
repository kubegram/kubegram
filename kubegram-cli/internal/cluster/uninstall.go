package cluster

import (
	"context"

	"github.com/kubegram/kubegram-cli/internal/helm"
)

// UninstallOpts configures the cluster uninstall operation.
type UninstallOpts struct {
	Namespace   string
	KubeContext string
	ReleaseName string
}

// Uninstall removes all Kubegram cluster components.
func Uninstall(ctx context.Context, opts UninstallOpts) error {
	releaseName := opts.ReleaseName
	if releaseName == "" {
		releaseName = defaultReleaseName
	}

	return helm.Uninstall(ctx, helm.UninstallOpts{
		ReleaseName: releaseName,
		Namespace:   opts.Namespace,
		KubeContext: opts.KubeContext,
	})
}
