package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"reflect"
	"strings"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

// NewKubectlTool creates a new tool for executing kubectl commands
// This tool exposes a "kubectl" function to the MCP client.
func NewKubectlTool() mcp.Tool {
	return mcp.Tool{
		Name:        "kubectl",
		Description: "Execute a kubectl command. Use this tool to interact with the Kubernetes cluster configured in the local kubeconfig.",
		InputSchema: mustGenerateSchema(reflect.TypeOf(struct {
			Args []string `json:"args"`
		}{})),
	}
}

// HandleKubectlCommand executes the kubectl command
// It receives a list of arguments, executes "kubectl" with those arguments, and returns the output.
func HandleKubectlCommand(ctx context.Context, request *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	var args struct {
		Args []string `json:"args"`
	}
	if err := json.Unmarshal(request.Params.Arguments, &args); err != nil {
		return &mcp.CallToolResult{
			IsError: true,
			Content: []mcp.Content{
				&mcp.TextContent{
					Text: fmt.Sprintf("failed to unmarshal arguments: %v", err),
				},
			},
		}, nil
	}

	// Basic validation
	if len(args.Args) == 0 {
		return &mcp.CallToolResult{
			IsError: true,
			Content: []mcp.Content{
				&mcp.TextContent{
					Text: "args cannot be empty",
				},
			},
		}, nil
	}

	// Execute kubectl
	// We use CommandContext to respect the context cancellation.
	cmd := exec.CommandContext(ctx, "kubectl", args.Args...)
	output, err := cmd.CombinedOutput()

	result := &mcp.CallToolResult{
		Content: []mcp.Content{
			&mcp.TextContent{
				Text: string(output),
			},
		},
	}

	if err != nil {
		result.IsError = true
		result.Content = append(result.Content, &mcp.TextContent{
			Text: fmt.Sprintf("\nError executing kubectl %s: %v", strings.Join(args.Args, " "), err),
		})
	}

	return result, nil
}
