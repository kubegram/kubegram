// Package cluster implements business logic for `kubegram cluster install/uninstall`.
package cluster

import (
	"context"

	"github.com/kubegram/kubegram-cli/internal/helm"
)

const defaultReleaseName = "kubegram-operator"

// InstallOpts configures the cluster install operation.
type InstallOpts struct {
	Namespace   string
	KubeContext string
	ChartPath   string
	ImageTag    string
	ExtraValues []string
	ValuesFiles []string
}

// Install installs all Kubegram cluster components (currently: the operator Helm chart).
// The structure supports adding additional charts (e.g. an in-cluster server) in future.
func Install(ctx context.Context, opts InstallOpts) error {
	chartPath := opts.ChartPath
	if chartPath == "" {
		var err error
		chartPath, err = helm.FindChartPath()
		if err != nil {
			return err
		}
	}

	return helm.Install(ctx, helm.InstallOpts{
		ReleaseName: defaultReleaseName,
		ChartPath:   chartPath,
		Namespace:   opts.Namespace,
		KubeContext: opts.KubeContext,
		ImageTag:    opts.ImageTag,
		ExtraValues: opts.ExtraValues,
		ValuesFiles: opts.ValuesFiles,
	})
}
