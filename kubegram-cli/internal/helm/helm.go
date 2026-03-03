// Package helm wraps the Helm Go SDK for installing and uninstalling Kubegram Helm charts.
// Using the SDK means no host `helm` binary is required.
package helm

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"helm.sh/helm/v3/pkg/action"
	"helm.sh/helm/v3/pkg/chart/loader"
	"helm.sh/helm/v3/pkg/cli"
	"helm.sh/helm/v3/pkg/cli/values"
	"helm.sh/helm/v3/pkg/getter"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

// InstallOpts configures a Helm upgrade --install operation.
type InstallOpts struct {
	ReleaseName string
	ChartPath   string
	Namespace   string
	KubeContext string
	ImageTag    string
	ExtraValues []string // --set key=value pairs
	ValuesFiles []string // -f path/to/values.yaml
	Timeout     time.Duration
}

// UninstallOpts configures a Helm uninstall operation.
type UninstallOpts struct {
	ReleaseName string
	Namespace   string
	KubeContext string
}

// FindChartPath walks up from CWD looking for the kubegram-operator Helm chart directory.
// The --chart-path flag takes precedence and should be checked by the caller before using this.
func FindChartPath() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		candidate := filepath.Join(dir, "kubegram-operator", "charts", "kubegram-operator", "Chart.yaml")
		if _, statErr := os.Stat(candidate); statErr == nil {
			return filepath.Dir(candidate), nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf(
		"kubegram-operator Helm chart not found; " +
			"use --chart-path to specify the path to the chart directory",
	)
}

func newSettings(kubeContext string) *cli.EnvSettings {
	settings := cli.New()
	if kubeContext != "" {
		settings.KubeContext = kubeContext
	}
	return settings
}

func newActionConfig(settings *cli.EnvSettings, namespace string, debug bool) (*action.Configuration, error) {
	actionConfig := new(action.Configuration)
	logFn := func(format string, v ...interface{}) {
		if debug {
			fmt.Printf("[helm] "+format+"\n", v...)
		}
	}
	if err := actionConfig.Init(settings.RESTClientGetter(), namespace, "secrets", logFn); err != nil {
		return nil, fmt.Errorf("failed to initialize Helm configuration: %w", err)
	}
	return actionConfig, nil
}

// ensureNamespace creates the target namespace if it does not already exist.
func ensureNamespace(ctx context.Context, kubeContext, namespace string) error {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	overrides := &clientcmd.ConfigOverrides{}
	if kubeContext != "" {
		overrides.CurrentContext = kubeContext
	}
	restCfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		loadingRules, overrides,
	).ClientConfig()
	if err != nil {
		return fmt.Errorf("unable to load kubeconfig: %w", err)
	}

	clientset, err := kubernetes.NewForConfig(restCfg)
	if err != nil {
		return fmt.Errorf("unable to create Kubernetes client: %w", err)
	}

	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{Name: namespace},
	}
	_, err = clientset.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return fmt.Errorf("unable to create namespace %q: %w", namespace, err)
	}
	return nil
}

// Install runs `helm upgrade --install` using the Helm Go SDK.
func Install(ctx context.Context, opts InstallOpts) error {
	if opts.Timeout == 0 {
		opts.Timeout = 5 * time.Minute
	}

	// Ensure the target namespace exists before the Helm operation.
	if err := ensureNamespace(ctx, opts.KubeContext, opts.Namespace); err != nil {
		return err
	}

	settings := newSettings(opts.KubeContext)
	actionConfig, err := newActionConfig(settings, opts.Namespace, false)
	if err != nil {
		return err
	}

	// Load chart from local directory.
	chart, err := loader.Load(opts.ChartPath)
	if err != nil {
		return fmt.Errorf("failed to load Helm chart from %q: %w\n"+
			"  If the chart has dependencies, run: helm dependency update %s",
			opts.ChartPath, err, opts.ChartPath,
		)
	}

	// Merge values from --set flags and -f files.
	valueOpts := &values.Options{
		Values:     opts.ExtraValues,
		ValueFiles: opts.ValuesFiles,
	}
	vals, err := valueOpts.MergeValues(getter.All(settings))
	if err != nil {
		return fmt.Errorf("failed to merge Helm values: %w", err)
	}

	// Inject image tag if specified.
	if opts.ImageTag != "" {
		if vals["image"] == nil {
			vals["image"] = map[string]interface{}{}
		}
		if imgMap, ok := vals["image"].(map[string]interface{}); ok {
			imgMap["tag"] = opts.ImageTag
		}
	}

	// helm upgrade --install
	upgradeAction := action.NewUpgrade(actionConfig)
	upgradeAction.Install = true
	upgradeAction.Namespace = opts.Namespace
	upgradeAction.Timeout = opts.Timeout
	upgradeAction.Wait = true

	fmt.Printf("Installing release %q from %q into namespace %q...\n",
		opts.ReleaseName, opts.ChartPath, opts.Namespace)

	if _, err = upgradeAction.Run(opts.ReleaseName, chart, vals); err != nil {
		return fmt.Errorf("helm upgrade --install failed: %w", err)
	}

	fmt.Printf("Release %q successfully installed in namespace %q.\n",
		opts.ReleaseName, opts.Namespace)
	return nil
}

// Uninstall runs `helm uninstall` using the Helm Go SDK.
func Uninstall(_ context.Context, opts UninstallOpts) error {
	settings := newSettings(opts.KubeContext)
	actionConfig, err := newActionConfig(settings, opts.Namespace, false)
	if err != nil {
		return err
	}

	uninstallAction := action.NewUninstall(actionConfig)
	if _, err = uninstallAction.Run(opts.ReleaseName); err != nil {
		return fmt.Errorf("helm uninstall failed: %w", err)
	}

	fmt.Printf("Release %q successfully uninstalled from namespace %q.\n",
		opts.ReleaseName, opts.Namespace)
	return nil
}
