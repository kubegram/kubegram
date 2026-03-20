package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/kubegram/kubegram-operator/pkg/controllers"
	"github.com/kubegram/kubegram-operator/pkg/mcp"
	"github.com/kubegram/kubegram-operator/pkg/transport"
	sdkMcp "github.com/modelcontextprotocol/go-sdk/mcp"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/healthz"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	metricsserver "sigs.k8s.io/controller-runtime/pkg/metrics/server"
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
}

func main() {
	var metricsAddr string
	var enableLeaderElection bool
	var probeAddr string
	var argoMCPCmd string
	var k8sMCPCmd string
	var mcpHTTPAddr string

	flag.StringVar(&metricsAddr, "metrics-bind-address", ":8080", "The address the metric endpoint binds to.")
	flag.StringVar(&probeAddr, "health-probe-bind-address", ":8081", "The address the probe endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "leader-elect", false,
		"Enable leader election for controller manager. "+
			"Enabling this will ensure there is only one active controller manager.")

	// These flags allow connecting to a remote MCP server via SSE
	var argoMCPURL string
	var k8sMCPURL string

	// Flags for MCP Proxies
	// These flags allow the operator to proxy tools from other MCP servers.
	// For example, to proxy Argo CD tools, you would run with --argo-mcp-cmd "npx -y @argoproj-labs/mcp-for-argocd"
	flag.StringVar(&argoMCPCmd, "argo-mcp-cmd", "", "Command to run Argo MCP server (e.g. 'npx argocd-mcp@latest')")
	flag.StringVar(&argoMCPURL, "argo-mcp-url", "", "URL to Argo MCP server (e.g. 'http://argo-mcp:8080/sse')")
	flag.StringVar(&k8sMCPCmd, "k8s-mcp-cmd", "", "Command to run Kubernetes MCP server (e.g. 'uvx kubernetes-mcp-server')")
	flag.StringVar(&k8sMCPURL, "k8s-mcp-url", "", "URL to Kubernetes MCP server (e.g. 'http://k8s-mcp:8080/sse')")

	// Flag for MCP HTTP Server
	// By default, the MCP server runs on Stdio (standard input/output) for integration with local clients like Claude Desktop.
	// Setting this flag enables HTTP/SSE mode, which is useful for remote connections or debugging.
	flag.StringVar(&mcpHTTPAddr, "mcp-http-addr", "", "Address to bind MCP HTTP server (e.g. ':8082'). If empty, runs on Stdio.")

	var llmWebSocketURL string
	flag.StringVar(&llmWebSocketURL, "llm-websocket-url", "", "URL for external LLM WebSocket service")

	opts := zap.Options{
		Development: true,
	}
	opts.BindFlags(flag.CommandLine)
	flag.Parse()

	// If flag is empty, check env var
	if llmWebSocketURL == "" {
		llmWebSocketURL = os.Getenv("LLM_HOST")
	}

	// If still empty, default to localhost
	if llmWebSocketURL == "" {
		llmWebSocketURL = "ws://localhost:8665"
	}
	llmWebSocketURL = fmt.Sprintf("%s/%s", llmWebSocketURL, "operator")

	// Get kubegram-server URL and token for operator registration
	kubegramServerURL := os.Getenv("KUBEGRAM_SERVER_URL")
	if kubegramServerURL == "" {
		kubegramServerURL = "http://kubegram-server:8090"
	}

	serverToken := os.Getenv("KUBEGRAM_SERVER_TOKEN")
	if serverToken == "" {
		setupLog.Error(nil, "KUBEGRAM_SERVER_TOKEN environment variable is required")
		os.Exit(1)
	}

	ctrl.SetLogger(zap.New(zap.UseFlagOptions(&opts)))

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:                 scheme,
		Metrics:                metricsserver.Options{BindAddress: metricsAddr},
		HealthProbeBindAddress: probeAddr,
		LeaderElection:         enableLeaderElection,
		LeaderElectionID:       "kubegram-operator-leader-election",
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	if err := mgr.AddHealthzCheck("healthz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up health check")
		os.Exit(1)
	}
	if err := mgr.AddReadyzCheck("readyz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up ready check")
		os.Exit(1)
	}

	// Initialize Proxies for MCP
	var argoCmd []string
	if argoMCPCmd != "" {
		argoCmd = strings.Fields(argoMCPCmd)
	}
	var k8sCmd []string
	if k8sMCPCmd != "" {
		k8sCmd = strings.Fields(k8sMCPCmd)
	}

	ctx := context.Background()
	proxies := mcp.InitProxies(ctx, argoCmd, argoMCPURL, k8sCmd, k8sMCPURL)

	// Start WebSocket MCP Server
	if llmWebSocketURL != "" {
		go func() {
			setupLog.Info("Starting WebSocket MCP Server")
			// Retry loop for WebSocket connection
			for {
				select {
				case <-ctx.Done():
					return
				default:
				}

				server := mcp.NewServer(ctx, proxies)
				// Re-use transport package import
				wsTransport := transport.NewWebSocketTransport(llmWebSocketURL)

				setupLog.Info("Connecting to WebSocket MCP", "url", llmWebSocketURL)
				if err := server.Run(ctx, wsTransport); err != nil {
					setupLog.Error(err, "WebSocket MCP server disconnected, retrying in 5s")
					select {
					case <-ctx.Done():
						return
					case <-time.After(5 * time.Second):
						continue
					}
				}
				// If Run returns nil, it might mean the transport closed gracefully or context ended
				setupLog.Info("WebSocket MCP server stopped")
				select {
				case <-ctx.Done():
					return
				case <-time.After(1 * time.Second):
					// Small backoff to prevent tight loop if it returns immediately without error
					continue
				}
			}
		}()
	}

	// Start Stdio/HTTP MCP Server
	// We run this if specific flags are set or if we want default Stdio behavior
	// mirroring the previous logic: if argo/k8s cmds are present OR http addr is set.
	if argoMCPCmd != "" || k8sMCPCmd != "" || mcpHTTPAddr != "" {
		go func() {
			setupLog.Info("Starting Standard MCP Server")
			// Note: StartMCPServer creates its own proxies, which is duplicative/wasteful if we already created them.
			// So we invoke NewServer directly.
			server := mcp.NewServer(ctx, proxies)

			if mcpHTTPAddr != "" {
				setupLog.Info("Starting HTTP MCP Server", "addr", mcpHTTPAddr)

				sseHandler := sdkMcp.NewSSEHandler(func(r *http.Request) *sdkMcp.Server {
					return server
				}, nil)
				if err := http.ListenAndServe(mcpHTTPAddr, sseHandler); err != nil {
					setupLog.Error(err, "HTTP MCP server failed")
				}
			} else {
				setupLog.Info("Starting Stdio MCP Server")
				// Stdio
				t := &sdkMcp.StdioTransport{}
				if err := server.Run(ctx, t); err != nil {
					setupLog.Error(err, "Stdio MCP server failed")
				}
			}
		}()
	}

	// Register Pod readiness reconciler — triggers validation when all
	// kubegram-annotated pods reach Ready state after a codegen deployment.
	kubegramServerURL = os.Getenv("KUBEGRAM_SERVER_URL")
	if kubegramServerURL == "" {
		kubegramServerURL = "http://kubegram-server:8090"
	}
	podReconciler := controllers.NewPodReadinessReconciler(mgr.GetClient(), mgr.GetScheme(), kubegramServerURL)
	if err := podReconciler.SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to set up pod readiness reconciler")
		os.Exit(1)
	}

	// Register operator with kubegram-server
	go registerOperator(kubegramServerURL, serverToken)

	setupLog.Info("starting manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}

func registerOperator(serverURL, token string) {
	// Get cluster ID from environment (can be set via downward API from Helm)
	clusterID := os.Getenv("KUBEGRAM_CLUSTER_ID")
	if clusterID == "" {
		// Use hostname as fallback - will be associated on first registration
		hostname, err := os.Hostname()
		if err != nil {
			clusterID = "unknown"
		} else {
			clusterID = hostname
		}
	}

	// Get operator version
	version := "latest"
	if buildVersion := os.Getenv("OPERATOR_VERSION"); buildVersion != "" {
		version = buildVersion
	}

	// Get MCP endpoint
	mcpEndpoint := os.Getenv("KUBEGRAM_MCP_ENDPOINT")
	if mcpEndpoint == "" {
		mcpEndpoint = "stdio"
	}

	payload := fmt.Sprintf(`{
		"clusterId": "%s",
		"version": "%s",
		"mcpEndpoint": "%s"
	}`, clusterID, version, mcpEndpoint)

	req, err := http.NewRequest("POST", serverURL+"/api/admin/v1/operators/register", strings.NewReader(payload))
	if err != nil {
		setupLog.Error(err, "failed to create operator registration request")
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		setupLog.Error(err, "failed to register operator with kubegram-server", "url", serverURL)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		setupLog.Info("operator registered with kubegram-server", "clusterId", clusterID)
	} else {
		setupLog.Error(nil, "operator registration failed", "status", resp.StatusCode)
	}
}
