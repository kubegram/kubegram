package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/kubegram/kubegram-cli/internal/cluster"
	"github.com/kubegram/kubegram-cli/internal/k8s"
)

func newClusterCmd() *cobra.Command {
	clusterCmd := &cobra.Command{
		Use:   "cluster",
		Short: "Manage Kubegram on a Kubernetes cluster",
		Long:  "Install or uninstall Kubegram components on the currently active Kubernetes cluster.",
	}

	clusterCmd.AddCommand(newClusterInstallCmd())
	clusterCmd.AddCommand(newClusterUninstallCmd())
	return clusterCmd
}

func newClusterInstallCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "install",
		Short: "Install Kubegram into the current Kubernetes cluster",
		Long: `Deploy the Kubegram operator Helm chart into the target cluster.

Uses the current kubectl context by default. Override with --context.
The Helm chart is located automatically by walking up from the current directory.`,
		RunE: runClusterInstall,
	}

	addHelmInstallFlags(cmd)
	return cmd
}

func runClusterInstall(cmd *cobra.Command, args []string) error {
	opts, err := parseInstallFlags(cmd)
	if err != nil {
		return err
	}

	ctx := cmd.Context()

	currentCtx, _ := k8s.CurrentContext()
	if opts.KubeContext == "" && currentCtx != "" {
		fmt.Printf("Using kubectl context: %s\n", currentCtx)
	}

	extraValues := append(opts.ExtraValues,
		fmt.Sprintf("kubegram.serverUrl=%s", opts.ServerURL),
		fmt.Sprintf("kubegram.serverToken=%s", opts.ServerToken),
	)

	return cluster.Install(ctx, cluster.InstallOpts{
		Namespace:   opts.Namespace,
		KubeContext: opts.KubeContext,
		ChartPath:   opts.ChartPath,
		ImageTag:    opts.ImageTag,
		ExtraValues: extraValues,
		ValuesFiles: opts.ValuesFiles,
	})
}

func newClusterUninstallCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "uninstall",
		Short: "Uninstall Kubegram from the current Kubernetes cluster",
		RunE:  runClusterUninstall,
	}

	cmd.Flags().String("namespace", "default", "Kubernetes namespace of the release")
	cmd.Flags().String("context", "", "kubectl context to use (defaults to current context)")
	cmd.Flags().String("release-name", "kubegram-operator", "Helm release name to uninstall")
	return cmd
}

func runClusterUninstall(cmd *cobra.Command, args []string) error {
	namespace, _ := cmd.Flags().GetString("namespace")
	kubeContext, _ := cmd.Flags().GetString("context")
	releaseName, _ := cmd.Flags().GetString("release-name")

	currentCtx, _ := k8s.CurrentContext()
	if kubeContext == "" && currentCtx != "" {
		fmt.Printf("Using kubectl context: %s\n", currentCtx)
	}

	return cluster.Uninstall(cmd.Context(), cluster.UninstallOpts{
		Namespace:   namespace,
		KubeContext: kubeContext,
		ReleaseName: releaseName,
	})
}

// addHelmInstallFlags attaches shared install flags to a command.
func addHelmInstallFlags(cmd *cobra.Command) {
	cmd.Flags().String("namespace", "default", "Kubernetes namespace to install into")
	cmd.Flags().String("context", "", "kubectl context to use (defaults to current context)")
	cmd.Flags().String("image-tag", "latest", "operator container image tag")
	cmd.Flags().String("chart-path", "", "path to Helm chart directory (auto-detected if not set)")
	cmd.Flags().String("server-url", "http://kubegram-server:8090", "Kubegram server URL")
	cmd.Flags().String("server-token", "", "Kubegram server token (required for operator authentication)")
	cmd.Flags().StringArray("set", nil, "set Helm values (can be repeated: --set key=value)")
	cmd.Flags().StringArrayP("values", "f", nil, "path to values.yaml file (can be repeated)")
}

// installFlagValues is a typed container for parsed install flags.
type installFlagValues struct {
	Namespace   string
	KubeContext string
	ChartPath   string
	ImageTag    string
	ServerURL   string
	ServerToken string
	ExtraValues []string
	ValuesFiles []string
}

func parseInstallFlags(cmd *cobra.Command) (*installFlagValues, error) {
	namespace, _ := cmd.Flags().GetString("namespace")
	kubeContext, _ := cmd.Flags().GetString("context")
	chartPath, _ := cmd.Flags().GetString("chart-path")
	imageTag, _ := cmd.Flags().GetString("image-tag")
	serverURL, _ := cmd.Flags().GetString("server-url")
	serverToken, _ := cmd.Flags().GetString("server-token")
	extraValues, _ := cmd.Flags().GetStringArray("set")
	valuesFiles, _ := cmd.Flags().GetStringArray("values")

	if serverToken == "" {
		return nil, fmt.Errorf("server-token is required (get one from kubegram-server: POST /api/admin/v1/operator-tokens)")
	}

	return &installFlagValues{
		Namespace:   namespace,
		KubeContext: kubeContext,
		ChartPath:   chartPath,
		ImageTag:    imageTag,
		ServerURL:   serverURL,
		ServerToken: serverToken,
		ExtraValues: extraValues,
		ValuesFiles: valuesFiles,
	}, nil
}
