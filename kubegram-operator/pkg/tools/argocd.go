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

// ArgoCDInstallerTool is a tool that installs Argo CD and optionally the Argo MCP server
type ArgoCDInstallerTool struct {
}

// NewArgoCDInstallerTool creates a new ArgoCDInstallerTool
func NewArgoCDInstallerTool() mcp.Tool {
	return mcp.Tool{
		Name:        "install_argo_mcp",
		Description: "Installs the Argo MCP Server sidecar/deployment into the cluster. Requires an existing Argo CD installation or can be used to add the MCP capability.",
		InputSchema: mustGenerateSchema(reflect.TypeOf(struct {
			Namespace string `json:"namespace"`
			MCPToken  string `json:"mcp_token"`
		}{})),
	}
}

// HandleArgoCDInstall handles the execution of the install_argo_mcp tool
func HandleArgoCDInstall(ctx context.Context, request *mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	var args struct {
		Namespace string `json:"namespace"`
		MCPToken  string `json:"mcp_token"`
	}

	// Set defaults
	args.Namespace = "argocd"

	if err := json.Unmarshal(request.Params.Arguments, &args); err != nil {
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{
					Text: fmt.Sprintf("Error parsing arguments: %v", err),
				},
			},
			IsError: true,
		}, nil
	}

	output := strings.Builder{}

	if args.MCPToken == "" {
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{
					Text: "Error: mcp_token is required",
				},
			},
			IsError: true,
		}, nil
	}

	output.WriteString(fmt.Sprintf("\nInstalling Argo MCP Server into namespace %s...\n", args.Namespace))

	// Determine Argo CD URL (internal service DNS)
	// Assuming standard Helm install names: argocd-server
	argoURL := fmt.Sprintf("http://argocd-server.%s.svc.cluster.local", args.Namespace)

	manifest := fmt.Sprintf(argoMCPManifestTemplate, args.Namespace, args.Namespace, argoURL, args.MCPToken, args.Namespace)

	// Apply via kubectl
	cmd := exec.CommandContext(ctx, "kubectl", "apply", "-f", "-")
	cmd.Stdin = strings.NewReader(manifest)
	if out, err := cmd.CombinedOutput(); err != nil {
		return &mcp.CallToolResult{
			Content: []mcp.Content{
				&mcp.TextContent{
					Text: fmt.Sprintf("Failed to apply Argo MCP manifest: %s\nOutput: %s", err, string(out)),
				},
			},
			IsError: true,
		}, nil
	}
	output.WriteString("Argo MCP Server installed successfully.\n")
	output.WriteString(fmt.Sprintf("MCP Server URL (Internal): http://argocd-mcp.%s.svc.cluster.local:8080/sse\n", args.Namespace))
	output.WriteString("\nNOTE: You may need to update the Kubegram Operator configuration to point to this new MCP server if it's not the default one.")

	return &mcp.CallToolResult{
		Content: []mcp.Content{
			&mcp.TextContent{
				Text: output.String(),
			},
		},
	}, nil
}

// argoMCPManifestTemplate is the YAML manifest for Argo MCP Server
// We use Sprintf placeholders: %s for namespace (x4), %s for ARGOCD_API_URL, %s for ARGOCD_TOKEN
const argoMCPManifestTemplate = `
apiVersion: v1
kind: ServiceAccount
metadata:
  name: argocd-mcp
  namespace: %s
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argocd-mcp
  namespace: %s
  labels:
    app: argocd-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: argocd-mcp
  template:
    metadata:
      labels:
        app: argocd-mcp
    spec:
      serviceAccountName: argocd-mcp
      containers:
        - name: argocd-mcp
          image: radiantone/argocd-mcp:latest
          imagePullPolicy: IfNotPresent
          env:
            - name: ARGOCD_API_URL
              value: "%s"
            - name: ARGOCD_TOKEN
              value: "%s"
            - name: ARGOCD_VERIFY_SSL
              value: "false"
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          livenessProbe:
            tcpSocket:
              port: http
          readinessProbe:
            tcpSocket:
              port: http
          resources:
            limits:
              cpu: 100m
              memory: 128Mi
            requests:
              cpu: 100m
              memory: 128Mi
---
apiVersion: v1
kind: Service
metadata:
  name: argocd-mcp
  namespace: %s
spec:
  type: ClusterIP
  ports:
    - port: 8080
      targetPort: http
      protocol: TCP
      name: http
  selector:
    app: argocd-mcp
`
