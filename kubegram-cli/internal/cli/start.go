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
)

func newStartCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start the local Kubegram runtime",
		Long: `Start all Kubegram services locally using Docker Compose.

kubegram start locates the docker-compose.yml by walking up from the current
directory (just like git finds .git). Override with --compose-file.

Services started:
  • kubegram-server  — API Gateway + Auth      (port 8090)
  • kuberag          — RAG + LLM workflows     (port 8665)
  • PostgreSQL        — User/project data       (port 5433)
  • Redis             — Cache + pub/sub         (port 6379)
  • Dgraph            — Graph + vector DB       (port 8080)`,
		RunE: runStart,
	}

	cmd.Flags().Int("port", 0, "override kubegram-server port (default from config: 8090)")
	cmd.Flags().String("compose-file", "", "path to docker-compose.yml (auto-detected if not set)")

	return cmd
}

func runStart(cmd *cobra.Command, args []string) error {
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

	// 1. Verify Docker is running.
	fmt.Println("Checking Docker daemon...")
	if err := compose.CheckDaemon(ctx); err != nil {
		return err
	}

	// 2. Start services.
	bold := color.New(color.Bold)
	bold.Println("\nStarting Kubegram services...")

	if err := compose.Up(ctx, compose.Options{ComposeFile: composeFile}); err != nil {
		return err
	}

	// 3. Poll health endpoints.
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

	// 4. Print banner.
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
