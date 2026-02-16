package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"reflect"
	"strings"

	"github.com/google/jsonschema-go/jsonschema"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func mustGenerateSchema(t reflect.Type) *jsonschema.Schema {
	s, err := jsonschema.ForType(t, &jsonschema.ForOptions{})
	if err != nil {
		panic(fmt.Sprintf("failed to generate schema: %v", err))
	}
	return s
}

// NewBashTool creates a new tool for executing bash commands
// This tool exposes a "bash" function to the MCP client.
func NewBashTool() mcp.Tool {
	return mcp.Tool{
		Name:        "bash",
		Description: "Execute a bash command. Use this tool to run shell commands on the host system. Be careful with this tool as it has full access to the system.",
		InputSchema: mustGenerateSchema(reflect.TypeOf(struct {
			Command string `json:"command"`
		}{})),
	}
}

// HandleBashCommand executes the bash command
// It receives the command string, executes it using "bash -c", and returns the output.
func HandleBashCommand(ctx context.Context, request *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	var args struct {
		Command string `json:"command"`
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

	// Security check: basic prevention of empty commands
	if strings.TrimSpace(args.Command) == "" {
		return &mcp.CallToolResult{
			IsError: true,
			Content: []mcp.Content{
				&mcp.TextContent{
					Text: "command cannot be empty",
				},
			},
		}, nil
	}

	// Execute the command
	// We use CommandContext to respect the context cancellation.
	cmd := exec.CommandContext(ctx, "bash", "-c", args.Command)
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
			Text: fmt.Sprintf("\nError: %v", err),
		})
	}

	return result, nil
}
