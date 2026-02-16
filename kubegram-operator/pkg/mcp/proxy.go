package mcp

import (
	"context"
	"fmt"
	"os/exec"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// ProxyClient represents a connection to a remote MCP server
// It manages the lifecycle of the connection and forwards requests.
type ProxyClient struct {
	Client  *mcp.Client
	Session *mcp.ClientSession
	Name    string // Name of the proxied service (e.g., "argo", "k8s")
}

// NewStdioProxyClient creates a new client connection to an external MCP server via stdio
// It spawns the external server command (e.g., "npx ...") and connects to its stdin/stdout.
func NewStdioProxyClient(ctx context.Context, name string, command string, args []string) (*ProxyClient, error) {
	// Create a command transport
	// This transport runs the command and uses its stdin/stdout for communication.
	cmd := exec.Command(command, args...)
	transport := &mcp.CommandTransport{
		Command: cmd,
	}

	return newProxyClientWithTransport(ctx, name, transport)
}

// NewSSEProxyClient creates a new client connection to an external MCP server via SSE
func NewSSEProxyClient(ctx context.Context, name string, url string) (*ProxyClient, error) {
	transport := &mcp.SSEClientTransport{
		Endpoint: url,
	}

	return newProxyClientWithTransport(ctx, name, transport)
}

func newProxyClientWithTransport(ctx context.Context, name string, transport mcp.Transport) (*ProxyClient, error) {
	// Create the client
	impl := &mcp.Implementation{
		Name:    "kubegram-operator-proxy",
		Version: "0.1.0",
	}

	client := mcp.NewClient(impl, nil)

	// Connect to the server
	// This establishes the session with the external MCP server.
	session, err := client.Connect(ctx, transport, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to %s mcp server: %w", name, err)
	}

	return &ProxyClient{
		Client:  client,
		Session: session,
		Name:    name,
	}, nil
}

// ListTools returns the tools available on the proxied server
// It delegates the ListTools call to the connected session.
func (p *ProxyClient) ListTools(ctx context.Context) ([]*mcp.Tool, error) {
	if p.Session == nil {
		return nil, fmt.Errorf("session is not initialized for %s", p.Name)
	}

	// ListTools takes *ListToolsParams
	listToolsResult, err := p.Session.ListTools(ctx, &mcp.ListToolsParams{})
	if err != nil {
		return nil, fmt.Errorf("failed to list tools from %s: %w", p.Name, err)
	}

	return listToolsResult.Tools, nil
}

// CallTool calls a tool on the proxied server
// It delegates the CallTool call to the connected session, passing the arguments.
func (p *ProxyClient) CallTool(ctx context.Context, toolName string, arguments map[string]interface{}) (*mcp.CallToolResult, error) {
	if p.Session == nil {
		return nil, fmt.Errorf("session is not initialized for %s", p.Name)
	}

	// CallTool takes *CallToolParams
	return p.Session.CallTool(ctx, &mcp.CallToolParams{
		Name:      toolName,
		Arguments: arguments,
	})
}

// Close closes the connection to the proxied server
func (p *ProxyClient) Close() error {
	if p.Session != nil {
		return p.Session.Close()
	}
	return nil
}
