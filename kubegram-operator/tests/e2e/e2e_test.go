package e2e

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	sdk "github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestRealOperatorConnection(t *testing.T) {
	// 1. Setup Client connecting to Operator's SSE Server
	// Operator listening on :8080 in pod, forwarded to localhost:8082
	serverURL := "http://localhost:8082/sse"

	client := sdk.NewClient(&sdk.Implementation{
		Name:    "e2e-test-client",
		Version: "1.0.0",
	}, nil)

	transport := &sdk.SSEClientTransport{
		Endpoint: serverURL,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	t.Logf("Connecting to %s...", serverURL)

	// Connect
	session, err := client.Connect(ctx, transport, nil)
	if err != nil {
		t.Fatalf("Failed to connect to Operator: %v. Ensure 'make debug-connect-http' is running.", err)
	}
	defer session.Close()

	t.Logf("Connected! Server Info: %+v", session.InitializeResult().ServerInfo)

	// 3. List Tools
	t.Log("Listing tools...")
	listResult, err := session.ListTools(ctx, &sdk.ListToolsParams{})
	if err != nil {
		t.Fatalf("ListTools failed: %v", err)
	}

	t.Logf("Received %d tools", len(listResult.Tools))

	// Export tools to file
	toolsJSON, err := json.MarshalIndent(listResult.Tools, "", "  ")
	if err != nil {
		t.Fatalf("Failed to marshal tools: %v", err)
	}
	if err := os.WriteFile("tools.json", toolsJSON, 0644); err != nil {
		t.Fatalf("Failed to write tools.json: %v", err)
	}
	t.Logf("Exported tools to tools.json")

	for _, tool := range listResult.Tools {
		t.Logf("Tool Name: %s", tool.Name)
		t.Logf("Tool Description: %s", tool.Description)
		t.Logf("Tool Arguments: %+v", tool.InputSchema)
		t.Log("----------------------------------------")
	}

	if len(listResult.Tools) == 0 {
		t.Error("Expected at least one tool (bash/kubectl), found none")
	}
}
