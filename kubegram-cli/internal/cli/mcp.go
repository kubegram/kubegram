package cli

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/kubegram/kubegram-cli/internal/util"
)

func newMCPCmd() *cobra.Command {
	mcpCmd := &cobra.Command{
		Use:   "mcp",
		Short: "Manage the Kubegram MCP server",
		Long:  "Commands for starting and stopping the Kubegram MCP server integration.",
	}

	mcpCmd.AddCommand(newMCPStartCmd())
	mcpCmd.AddCommand(newMCPStopCmd())
	mcpCmd.AddCommand(newMCPStatusCmd())
	return mcpCmd
}

func newMCPStartCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start the MCP server",
		Long: `Start the Kubegram MCP server.

Modes:
  local  - Run the operator binary locally (default)
  cluster - Port-forward to operator running in a Kubernetes cluster`,
		RunE: runMCPStart,
	}

	cmd.Flags().String("mode", "local", "Mode to run MCP server: local or cluster")
	cmd.Flags().Int("port", 8080, "Port to run MCP server on")
	cmd.Flags().String("token", "", "Auth token for the MCP server")
	cmd.Flags().String("namespace", "", "Kubernetes namespace (cluster mode only)")

	return cmd
}

func runMCPStart(cmd *cobra.Command, args []string) error {
	mode, _ := cmd.Flags().GetString("mode")
	port, _ := cmd.Flags().GetInt("port")
	token, _ := cmd.Flags().GetString("token")
	namespace, _ := cmd.Flags().GetString("namespace")

	if mode != "local" && mode != "cluster" {
		return fmt.Errorf("invalid mode: %s (must be 'local' or 'cluster')", mode)
	}

	ctx := context.Background()

	if mode == "cluster" {
		return runMCPStartCluster(ctx, cmd, port, namespace, token)
	}

	return runMCPStartLocal(ctx, cmd, port, token)
}

func runMCPStartLocal(ctx context.Context, cmd *cobra.Command, port int, token string) error {
	operatorBin, err := util.FindOperatorBinary()
	if err != nil {
		return fmt.Errorf("%w\n\nTo fix: Download the kubegram-operator binary and place it in your PATH or at ~/.kubegram/bin/", err)
	}

	if token == "" {
		token = viper.GetString("mcp.token")
		if token == "" {
			token = os.Getenv("KUBEGRAM_SERVER_TOKEN")
		}
		if token == "" {
			color.Yellow("Warning: No auth token provided. Set --token or configure via kubegram login.")
			color.Yellow("Run 'kubegram login' first to authenticate, or pass --token explicitly.")
		}
	}

	env := os.Environ()
	if token != "" {
		env = append(env, fmt.Sprintf("KUBEGRAM_SERVER_TOKEN=%s", token))
		serverURL := viper.GetString("server.url")
		if serverURL == "" {
			serverURL = os.Getenv("KUBEGRAM_SERVER_URL")
		}
		if serverURL == "" {
			serverURL = "http://localhost:8090"
		}
		env = append(env, fmt.Sprintf("KUBEGRAM_SERVER_URL=%s", serverURL))
	}

	operatorCmd := exec.Command(operatorBin, "--mcp-http-addr", fmt.Sprintf(":%d", port))
	operatorCmd.Env = env
	operatorCmd.Stdout = os.Stdout
	operatorCmd.Stderr = os.Stderr

	if err := operatorCmd.Start(); err != nil {
		return fmt.Errorf("failed to start MCP server: %w", err)
	}

	if err := util.WritePID(operatorCmd.Process.Pid); err != nil {
		operatorCmd.Process.Kill()
		return fmt.Errorf("failed to write PID file: %w", err)
	}

	green := color.New(color.FgGreen, color.Bold)
	green.Printf("\nMCP server started on http://localhost:%d (PID %d)\n", port, operatorCmd.Process.Pid)
	fmt.Println()

	if token == "" {
		color.Yellow("Note: No auth token configured. MCP server started without authentication.")
	} else {
		fmt.Println("MCP server is running with authentication.")
	}

	fmt.Println("\nAdd to your AI assistant configuration:")
	fmt.Printf("  {\n    \"url\": \"http://localhost:%d/mcp\"\n  }\n\n", port)

	fmt.Println("To stop: kubegram mcp stop")

	return nil
}

func runMCPStartCluster(ctx context.Context, cmd *cobra.Command, port int, namespace string, token string) error {
	installed, err := util.IsOperatorInstalled(ctx, namespace)
	if err != nil {
		return fmt.Errorf("failed to check operator installation: %w", err)
	}
	if !installed {
		return fmt.Errorf("operator not found in namespace %s.\nRun 'kubegram operator install' first to deploy the operator.", namespace)
	}

	pf, err := util.CreatePortForward(ctx, namespace, port)
	if err != nil {
		return fmt.Errorf("failed to start port forward: %w", err)
	}

	if token == "" {
		token = viper.GetString("mcp.token")
		if token == "" {
			token = os.Getenv("KUBEGRAM_SERVER_TOKEN")
		}
	}

	if err := util.WritePID(pf.GetPID()); err != nil {
		pf.Stop()
		return fmt.Errorf("failed to write PID file: %w", err)
	}

	green := color.New(color.FgGreen, color.Bold)
	green.Printf("\nMCP server (cluster mode) started on http://localhost:%d (PID %d)\n", port, pf.GetPID())
	fmt.Println()

	if token == "" {
		color.Yellow("Note: No auth token provided. MCP server started without authentication.")
		color.Yellow("Run 'kubegram login' first to authenticate, or pass --token explicitly.")
	}

	fmt.Println("\nAdd to your AI assistant configuration:")
	fmt.Printf("  {\n    \"url\": \"http://localhost:%d/mcp\"\n  }\n\n", port)

	fmt.Println("To stop: kubegram mcp stop")

	return nil
}

func newMCPStopCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "stop",
		Short: "Stop the MCP server",
		Long:  "Stop the currently running MCP server.",
		RunE:  runMCPStop,
	}

	return cmd
}

func runMCPStop(cmd *cobra.Command, args []string) error {
	pid, err := util.ReadPID()
	if err != nil {
		return fmt.Errorf("MCP server not running (no PID file found). Run 'kubegram mcp start' first.")
	}

	if !util.IsProcessRunning(pid) {
		color.Yellow("Stale PID file found (process %d not running). Cleaning up...", pid)
		if err := util.RemovePIDFile(); err != nil {
			return fmt.Errorf("failed to remove stale PID file: %w", err)
		}
		return nil
	}

	if err := util.KillProcess(pid); err != nil {
		return fmt.Errorf("failed to stop MCP server: %w", err)
	}

	if err := util.RemovePIDFile(); err != nil {
		return fmt.Errorf("failed to remove PID file: %w", err)
	}

	green := color.New(color.FgGreen, color.Bold)
	green.Printf("MCP server (PID %d) stopped\n", pid)

	return nil
}

func newMCPStatusCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "status",
		Short: "Check MCP server status",
		Long:  "Check if the MCP server is currently running.",
		RunE:  runMCPStatus,
	}

	return cmd
}

func runMCPStatus(cmd *cobra.Command, args []string) error {
	pid, err := util.ReadPID()
	if err != nil {
		fmt.Println("MCP server is not running.")
		fmt.Println("Run 'kubegram mcp start' to start the MCP server.")
		return nil
	}

	if !util.IsProcessRunning(pid) {
		color.Yellow("MCP server status: stale PID file (process %d not running)", pid)
		fmt.Println("Run 'kubegram mcp stop' to clean up.")
		return nil
	}

	port := viper.GetInt("mcp.port")
	if port == 0 {
		port = 8080
	}

	green := color.New(color.FgGreen, color.Bold)
	green.Printf("MCP server is running (PID %d)\n", pid)
	fmt.Printf("URL: http://localhost:%d/mcp\n", port)

	token := viper.GetString("mcp.token")
	if token != "" {
		fmt.Println("Auth: configured")
	} else if os.Getenv("KUBEGRAM_SERVER_TOKEN") != "" {
		fmt.Println("Auth: configured (via environment)")
	} else {
		color.Yellow("Auth: not configured")
	}

	return nil
}
