// Package operator implements business logic for `kubegram operator install`.
package operator

import (
	"context"

	"github.com/kubegram/kubegram-cli/internal/helm"
)

const defaultReleaseName = "kubegram-operator"

// InstallOpts configures the operator install operation.
type InstallOpts struct {
	Namespace   string
	KubeContext string
	ChartPath   string
	ImageTag    string
	ExtraValues []string
	ValuesFiles []string
}

// Install installs the kubegram-operator Helm chart into the target cluster.
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
