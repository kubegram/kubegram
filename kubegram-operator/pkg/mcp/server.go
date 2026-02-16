package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/kubegram/kubegram-operator/pkg/tools"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// ServerOptions configuration for the MCP server
type ServerOptions struct {
	ArgoMCPCommand []string
	ArgoMCPURL     string
	K8sMCPCommand  []string
	K8sMCPURL      string
	HTTPAddr       string
}

// InitProxies initializes the connections to upstream MCP servers
func InitProxies(ctx context.Context, argoCmd []string, argoURL string, k8sCmd []string, k8sURL string) []*ProxyClient {
	proxies := []*ProxyClient{}

	// Helper to setup proxy
	setupProxy := func(name string, cmdArgs []string, url string) {
		var proxy *ProxyClient
		var err error

		if url != "" {
			proxy, err = NewSSEProxyClient(ctx, name, url)
		} else if len(cmdArgs) > 0 {
			proxy, err = NewStdioProxyClient(ctx, name, cmdArgs[0], cmdArgs[1:])
		} else {
			return
		}

		if err != nil {
			log.Printf("Warning: Failed to connect to %s MCP proxy: %v", name, err)
			return
		}
		proxies = append(proxies, proxy)
		log.Printf("Connected to %s MCP proxy", name)
	}

	setupProxy("argo", argoCmd, argoURL)
	setupProxy("k8s", k8sCmd, k8sURL)

	return proxies
}

// NewServer creates a new MCP server instance with all tools registered
func NewServer(ctx context.Context, proxies []*ProxyClient) *mcp.Server {
	// Create the server
	server := mcp.NewServer(&mcp.Implementation{
		Name:    "kubegram-operator",
		Version: "0.1.0",
	}, nil)

	// Register Local Tools
	bashTool := tools.NewBashTool()
	server.AddTool(&bashTool, tools.HandleBashCommand)

	kubectlTool := tools.NewKubectlTool()
	server.AddTool(&kubectlTool, tools.HandleKubectlCommand)

	argoTool := tools.NewArgoCDInstallerTool()
	server.AddTool(&argoTool, tools.HandleArgoCDInstall)

	// Register Proxy Tools
	for _, proxy := range proxies {
		// Register proxied tools
		remoteTools, err := proxy.ListTools(ctx)
		if err != nil {
			log.Printf("Warning: Failed to list tools from %s: %v", proxy.Name, err)
			continue
		}

		for _, tool := range remoteTools {
			// We wrap the handler to call the proxy
			p := proxy
			tName := tool.Name

			server.AddTool(tool, func(ctx context.Context, request *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
				// We need to pass arguments as map[string]interface{} to the proxy
				// But request.Params.Arguments is json.RawMessage
				var args map[string]interface{}
				if len(request.Params.Arguments) > 0 {
					if err := json.Unmarshal(request.Params.Arguments, &args); err != nil {
						return nil, fmt.Errorf("failed to unmarshal arguments for proxy: %w", err)
					}
				}
				return p.CallTool(ctx, tName, args)
			})
			log.Printf("Registered proxied tool: %s (from %s)", tool.Name, proxy.Name)
		}
	}

	return server
}

// StartMCPServer starts the MCP server
// Deprecated: Use InitProxies and NewServer manually for more control
func StartMCPServer(ctx context.Context, opts ServerOptions) error {
	proxies := InitProxies(ctx, opts.ArgoMCPCommand, opts.ArgoMCPURL, opts.K8sMCPCommand, opts.K8sMCPURL)
	server := NewServer(ctx, proxies)

	if opts.HTTPAddr != "" {
		log.Printf("Starting Kubegram MCP Server on HTTP %s...", opts.HTTPAddr)
		sseHandler := mcp.NewSSEHandler(func(r *http.Request) *mcp.Server {
			return server
		}, nil)
		return http.ListenAndServe(opts.HTTPAddr, sseHandler)
	}

	// Start the server using Stdio transport
	// StdioTransport is exported in mcp package
	transport := &mcp.StdioTransport{}
	log.Println("Starting Kubegram MCP Server on Stdio...")
	return server.Run(ctx, transport)
}
