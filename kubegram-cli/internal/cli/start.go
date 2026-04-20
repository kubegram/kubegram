package cli

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/kubegram/kubegram-cli/internal/compose"
	"github.com/kubegram/kubegram-cli/internal/health"
	"github.com/kubegram/kubegram-cli/internal/server"
)

func newStartCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start the local Kubegram runtime",
		Long: `Start the kubegram-server locally.

By default, kubegram start downloads a self-contained kubegram-server binary
(bundled with the UI) and runs it directly — no Docker required. The server
uses an in-process cache so it works without PostgreSQL or Redis.

Use --docker to start the full stack (kubegram-server, kuberag, PostgreSQL,
Redis, Dgraph) via Docker Compose instead.`,
		RunE: runStart,
	}

	cmd.Flags().Int("port", 0, "override kubegram-server port (default from config: 8090)")
	cmd.Flags().Bool("docker", false, "use Docker Compose to start the full service stack")
	cmd.Flags().String("server-version", "", "kubegram-server version to download (default: latest)")
	cmd.Flags().String("compose-file", "", "path to docker-compose.yml (--docker mode only; auto-detected if not set)")

	return cmd
}

func runStart(cmd *cobra.Command, args []string) error {
	useDocker, _ := cmd.Flags().GetBool("docker")
	if useDocker {
		return runDockerStart(cmd, args)
	}
	return runBinaryStart(cmd, args)
}

// runBinaryStart downloads (if needed) and runs the kubegram-server standalone binary.
func runBinaryStart(cmd *cobra.Command, _ []string) error {
	port := viper.GetInt("server.port")
	if override, _ := cmd.Flags().GetInt("port"); override != 0 {
		port = override
	}

	version := viper.GetString("server.version")
	if override, _ := cmd.Flags().GetString("server-version"); override != "" {
		version = override
	}

	bold := color.New(color.Bold)
	bold.Println("\nStarting Kubegram server...")

	if !server.IsInstalled() {
		fmt.Printf("  kubegram-server not found locally — installing version %s\n", version)
		if err := server.Install(version); err != nil {
			return fmt.Errorf("failed to install kubegram-server: %w\n\nTip: use --docker to start via Docker Compose instead", err)
		}
	}

	if server.IsRunning() {
		green := color.New(color.FgGreen)
		green.Printf("  kubegram-server is already running on port %d\n", port)
		fmt.Printf("\n  UI  http://localhost:%d\n", port)
		return nil
	}

	env := []string{
		fmt.Sprintf("PORT=%d", port),
		"NODE_ENV=production",
		"ENABLE_HA=false",
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		env = append(env, "JWT_SECRET="+secret)
	} else {
		env = append(env, "JWT_SECRET=kubegram-local-dev-secret")
	}

	pid, err := server.Start(port, env)
	if err != nil {
		return err
	}
	fmt.Printf("  Started (PID %d)\n", pid)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := health.WaitForServices(ctx, []health.Service{
		{
			Name: "kubegram-server",
			URL:  fmt.Sprintf("http://localhost:%d/api/public/v1/healthz/live", port),
		},
	}); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: health check did not pass: %v\n", err)
		fmt.Fprintln(os.Stderr, "The server may still be starting. Check ~/.kubegram/server/ for logs.")
		return nil
	}

	fmt.Println()
	green := color.New(color.FgGreen, color.Bold)
	green.Println("Kubegram is running!")
	fmt.Println()
	fmt.Printf("  UI    http://localhost:%d\n", port)
	fmt.Printf("  API   http://localhost:%d/api/public/v1\n", port)
	fmt.Println()
	fmt.Println("Stop server: kubegram stop")

	return nil
}

// runDockerStart is the original Docker Compose-based start (now behind --docker).
func runDockerStart(cmd *cobra.Command, _ []string) error {
	port := viper.GetInt("server.port")
	if override, _ := cmd.Flags().GetInt("port"); override != 0 {
		port = override
	}

	composeFile, _ := cmd.Flags().GetString("compose-file")
	if composeFile == "" {
		composeFile = viper.GetString("compose.file")
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	fmt.Println("Checking Docker daemon...")
	if err := compose.CheckDaemon(ctx); err != nil {
		return err
	}

	bold := color.New(color.Bold)
	bold.Println("\nStarting Kubegram services (Docker Compose)...")

	if err := compose.Up(ctx, compose.Options{ComposeFile: composeFile}); err != nil {
		return err
	}

	fmt.Println()
	healthCtx, healthCancel := context.WithTimeout(ctx, 5*time.Minute)
	defer healthCancel()

	services := []health.Service{
		{
			Name: "kubegram-server",
			URL:  fmt.Sprintf("http://localhost:%d/api/public/v1/healthz/live", port),
		},
		{
			Name: "kuberag",
			URL:  "http://localhost:8665/health",
		},
	}

	if err := health.WaitForServices(healthCtx, services); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: health checks did not pass: %v\n", err)
		fmt.Fprintln(os.Stderr, "Services may still be starting. Check logs with: docker compose logs -f")
		return nil
	}

	fmt.Println()
	green := color.New(color.FgGreen, color.Bold)
	green.Println("Kubegram is running!")
	fmt.Println()
	fmt.Printf("  API Server    http://localhost:%d\n", port)
	fmt.Printf("  KubeRAG       http://localhost:8665/graphql\n")
	fmt.Printf("  Dgraph        http://localhost:8080\n")
	fmt.Println()
	fmt.Println("Follow logs:   docker compose logs -f")
	fmt.Println("Stop services: docker compose down")

	return nil
}
