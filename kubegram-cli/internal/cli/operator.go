package cli

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/kubegram/kubegram-cli/internal/k8s"
	"github.com/kubegram/kubegram-cli/internal/operator"
)

func newOperatorCmd() *cobra.Command {
	operatorCmd := &cobra.Command{
		Use:   "operator",
		Short: "Manage the Kubegram operator on a Kubernetes cluster",
	}

	operatorCmd.AddCommand(newOperatorInstallCmd())
	return operatorCmd
}

func newOperatorInstallCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "install",
		Short: "Install the Kubegram operator into the current Kubernetes cluster",
		Long: `Deploy only the Kubegram operator Helm chart.

This is a targeted alias for 'kubegram cluster install', focused on the
operator component. Useful when other cluster components are already deployed.`,
		RunE: runOperatorInstall,
	}

	addHelmInstallFlags(cmd)
	return cmd
}

func runOperatorInstall(cmd *cobra.Command, args []string) error {
	opts, err := parseInstallFlags(cmd)
	if err != nil {
		return err
	}

	currentCtx, _ := k8s.CurrentContext()
	if opts.KubeContext == "" && currentCtx != "" {
		fmt.Printf("Using kubectl context: %s\n", currentCtx)
	}

	return operator.Install(cmd.Context(), operator.InstallOpts{
		Namespace:   opts.Namespace,
		KubeContext: opts.KubeContext,
		ChartPath:   opts.ChartPath,
		ImageTag:    opts.ImageTag,
		ExtraValues: opts.ExtraValues,
		ValuesFiles: opts.ValuesFiles,
	})
}
