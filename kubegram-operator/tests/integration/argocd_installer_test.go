package integration

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/kubegram/kubegram-operator/pkg/tools"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func TestArgoCDInstallerTool(t *testing.T) {
	// This test assumes a local cluster (e.g. minikube) is running and accessible via KUBECONFIG
	// It also assumes 'make deploy-argocd' has been run or we run it here.
	// For simplicity, we assume the environment is prepped or we skip if not verifiable.

	// Use default kubeconfig
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	configOverrides := &clientcmd.ConfigOverrides{}
	kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)
	config, err := kubeConfig.ClientConfig()
	if err != nil {
		t.Skipf("Skipping integration test: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	require.NoError(t, err)

	// Ensure argocd namespace exists (meaning Argo CD is likely installed)
	_, err = clientset.CoreV1().Namespaces().Get(context.Background(), "argocd", metav1.GetOptions{})
	if err != nil {
		t.Skip("Skipping integration test: argocd namespace not found. Run 'make deploy-argocd' first.")
	}

	// Try to read token from tests/e2e/argocd_token.env
	// Format: ARGOCD_TOKEN=...
	token := "test-token-12345" // Default dummy
	envContent, err := os.ReadFile("../../tests/e2e/argocd_token.env")
	if err == nil {
		lines := strings.Split(string(envContent), "\n")
		for _, line := range lines {
			if strings.HasPrefix(line, "ARGOCD_TOKEN=") {
				token = strings.TrimPrefix(line, "ARGOCD_TOKEN=")
				break
			}
		}
	}

	// Prepare arguments
	args := map[string]interface{}{
		"namespace": "argocd",
		"mcp_token": token,
	}
	argsBytes, _ := json.Marshal(args)

	// dummy connection for tool call (not used by handler which just uses args)
	req := mcp.CallToolRequest{
		Params: &mcp.CallToolParamsRaw{
			Name:      "install_argo_mcp",
			Arguments: json.RawMessage(argsBytes),
		},
	}

	// Call the handler directly
	ctx := context.Background()
	result, err := tools.HandleArgoCDInstall(ctx, &req)

	require.NoError(t, err)
	require.False(t, result.IsError, "Tool execution returned error result: %v", result.Content)

	// Verify Output
	assert.NotEmpty(t, result.Content)
	content := result.Content[0].(*mcp.TextContent)
	assert.Contains(t, content.Text, "Argo MCP Server installed successfully")

	// Verify Kubernetes Resources
	time.Sleep(2 * time.Second) // Give it a sec to propagate

	deploy, err := clientset.AppsV1().Deployments("argocd").Get(ctx, "argocd-mcp", metav1.GetOptions{})
	require.NoError(t, err)
	assert.Equal(t, "argocd-mcp", deploy.Name)

	// Cleanup (Optional)
	// clientset.AppsV1().Deployments("argocd").Delete(ctx, "argocd-mcp", metav1.DeleteOptions{})
}
