package integration

import (
	"context"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/kubegram/kubegram-operator/pkg/mcp"
)

func TestK8sMCPProxy(t *testing.T) {
	// Ensure minikube is running
	if err := exec.Command("kubectl", "cluster-info").Run(); err != nil {
		t.Skip("Minikube not running, skipping integration test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// 1. Connect to Kubernetes MCP Server
	// We use "uvx" to run the server as per the user's setup
	proxy, err := mcp.NewStdioProxyClient(ctx, "k8s", "uvx", []string{"kubernetes-mcp-server"})
	if err != nil {
		t.Fatalf("Failed to create proxy client: %v", err)
	}
	defer proxy.Close()

	// 2. Discover Tools
	tools, err := proxy.ListTools(ctx)
	if err != nil {
		t.Fatalf("Failed to list tools: %v", err)
	}

	t.Logf("Discovered %d tools", len(tools))
	for _, tool := range tools {
		t.Logf("Tool: %s", tool.Name)
	}

	// Helper to find tool
	_ = func(name string) bool {
		for _, tool := range tools {
			if tool.Name == name {
				return true
			}
		}
		return false
	}

	// NOTE: The exact tool names for kubernetes-mcp-server might vary.
	// Common ones are "apply_file", "apply", "delete", etc.
	// Assuming "apply" takes yaml content or similar.
	// Let's assume the server exposes "kubectl_apply" or similar if it's a wrapper,
	// OR more likely it exposes high level tools.
	// Actually, looking at standard MCP servers, it might just be "apply".
	// We will verify tool names from the log output if this fails or refine based on list.

	// 3. Define Resources
	// 3. Define Resources
	deploymentYaml := `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world-mcp
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello-world-mcp
  template:
    metadata:
      labels:
        app: hello-world-mcp
    spec:
      containers:
      - name: hello-world
        image: hello-world:latest
`

	// 4. Create Resource (Create/Update)
	t.Log("Creating deployment...")
	result, err := proxy.CallTool(ctx, "resources_create_or_update", map[string]interface{}{
		"resource": deploymentYaml,
	})
	if err != nil {
		t.Fatalf("Failed to create resource: %v", err)
	}
	if result.IsError {
		for _, c := range result.Content {
			t.Logf("Content: %+v", c)
		}
		t.Fatalf("Tool returned error during creation")
	}
	t.Logf("Tool Result: %+v", result)
	for _, c := range result.Content {
		t.Logf("Content: %+v", c)
	}

	// Verify creation
	time.Sleep(5 * time.Second) // Wait for k8s to process
	if err := exec.Command("kubectl", "get", "deployment", "hello-world-mcp").Run(); err != nil {
		t.Fatalf("Deployment not found after creation: %v", err)
	}

	// 5. Update Resource (Scale Up)
	t.Log("Updating deployment (scaling to 2)...")
	// We use resources_create_or_update as resources_scale was not taking effect
	deploymentYamlScaled := strings.Replace(deploymentYaml, "replicas: 1", "replicas: 2", 1)
	result, err = proxy.CallTool(ctx, "resources_create_or_update", map[string]interface{}{
		"resource": deploymentYamlScaled,
	})
	if err != nil {
		t.Fatalf("Failed to update resource: %v", err)
	}
	if result.IsError {
		for _, c := range result.Content {
			t.Logf("Content: %+v", c)
		}
		t.Fatalf("Tool returned error during scaling")
	}
	t.Logf("Scale Tool Result: %+v", result)
	for _, c := range result.Content {
		t.Logf("Scale Content: %+v", c)
	}

	// Verify update
	time.Sleep(10 * time.Second)
	// Check replicas
	out, err := exec.Command("kubectl", "get", "deployment", "hello-world-mcp", "-o=jsonpath={.spec.replicas}").Output()
	if err != nil {
		t.Fatalf("Failed to get deployment replicas: %v", err)
	}
	if string(out) != "2" {
		t.Errorf("Expected 2 replicas, got %s", string(out))
	}

	// 6. Delete Resource
	t.Log("Deleting deployment...")
	result, err = proxy.CallTool(ctx, "resources_delete", map[string]interface{}{
		"apiVersion": "apps/v1",
		"namespace":  "default",
		"name":       "hello-world-mcp",
		"kind":       "Deployment",
	})
	if err != nil {
		t.Fatalf("Failed to delete resource: %v", err)
	}
	if result.IsError {
		for _, c := range result.Content {
			t.Logf("Content: %+v", c)
		}
		t.Fatalf("Tool returned error during deletion")
	}

	// Verify deletion
	time.Sleep(5 * time.Second)
	if err := exec.Command("kubectl", "get", "deployment", "hello-world-mcp").Run(); err == nil {
		t.Errorf("Deployment still exists after deletion")
	} else {
		t.Log("Deployment successfully deleted")
	}
}
