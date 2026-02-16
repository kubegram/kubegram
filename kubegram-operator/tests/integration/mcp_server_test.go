package integration

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/kubegram/kubegram-operator/pkg/mcp"
	"github.com/kubegram/kubegram-operator/pkg/transport"
	"github.com/modelcontextprotocol/go-sdk/jsonrpc"
	sdk "github.com/modelcontextprotocol/go-sdk/mcp"
)

func TestMCPServerInitialization(t *testing.T) {
	// 1. Setup a Mock LLM Server (WebSocket)
	// This server acts as the "Client" in MCP terms (it sends requests to the Operator)
	// correctly mimicking the user request scenario.
	upgrader := websocket.Upgrader{}

	initDone := make(chan struct{})
	toolsDone := make(chan struct{})

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("Failed to upgrade websocket: %v", err)
			return
		}
		defer conn.Close()

		// Read loop to drain any messages from Operator (Client -> Server logs etc)
		// and to ensure connection stays open
		go func() {
			for {
				if _, _, err := conn.NextReader(); err != nil {
					return
				}
			}
		}()

		// 2. Send 'initialize' request
		req := map[string]interface{}{
			"jsonrpc": "2.0",
			"method":  "initialize",
			"id":      "init-1",
			"params": map[string]interface{}{
				"protocolVersion": "2024-11-05",
				"capabilities": map[string]interface{}{
					"experimental": map[string]interface{}{},
					"sampling":     nil,
					"roots": map[string]interface{}{
						"listChanged": false,
					},
				},
				"clientInfo": map[string]interface{}{
					"name":    "kuberag-client",
					"version": "0.1.0",
				},
			},
		}

		if err := conn.WriteJSON(req); err != nil {
			t.Errorf("Failed to write initialize request: %v", err)
			return
		}

		// 3. Wait match response?
		// Since we have a read loop above effectively consuming everything, we can't easily read responses there.
		// We should change the design to read and parse responses.
	}))
	ts.Close() // Close previous one to correct logic

	// Create a new one with correct logic
	ts = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("Failed to upgrade websocket: %v", err)
			return
		}
		defer conn.Close()

		// Send initialize
		initReq := map[string]interface{}{
			"jsonrpc": "2.0",
			"method":  "initialize",
			"id":      "init-1",
			"params": map[string]interface{}{
				"protocolVersion": "2024-11-05",
				"capabilities":    map[string]interface{}{},
				"clientInfo": map[string]interface{}{
					"name":    "test-client",
					"version": "1.0",
				},
			},
		}
		if err := conn.WriteJSON(initReq); err != nil {
			t.Errorf("Write init error: %v", err)
			return
		}

		// Read loop
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			t.Logf("Received message: %s", string(msg))

			var resp map[string]interface{}
			if err := json.Unmarshal(msg, &resp); err != nil {
				t.Logf("Failed to unmarshal: %v", err)
				continue
			}

			// Check for init response
			if id, ok := resp["id"]; ok {
				// ID comes back as interface{}, likely string or json.RawMessage if we parsed to map
				if idStr, ok := id.(string); ok && idStr == "init-1" {
					if _, ok := resp["result"]; ok {
						t.Log("Received initialize response")
						close(initDone)

						// Send initialized notification
						conn.WriteJSON(map[string]interface{}{
							"jsonrpc": "2.0",
							"method":  "notifications/initialized",
						})

						// Send tools/list
						conn.WriteJSON(map[string]interface{}{
							"jsonrpc": "2.0",
							"method":  "tools/list",
							"id":      "tools-1",
						})
					}
				}
			}

			// Check for tools response
			if id, ok := resp["id"]; ok {
				if idStr, ok := id.(string); ok && idStr == "tools-1" {
					if _, ok := resp["result"]; ok {
						t.Logf("Received tools list")

						// Now test tools/call
						conn.WriteJSON(map[string]interface{}{
							"jsonrpc": "2.0",
							"method":  "tools/call",
							"id":      "call-1",
							"params": map[string]interface{}{
								"name": "bash",
								"arguments": map[string]interface{}{
									"command": "echo 'hello mcp'",
								},
							},
						})
					}
				}
			}

			// Check for call response
			if id, ok := resp["id"]; ok {
				if idStr, ok := id.(string); ok && idStr == "call-1" {
					t.Logf("Received call response: %s", string(msg))
					// Check result content
					if result, ok := resp["result"].(map[string]interface{}); ok {
						if content, ok := result["content"].([]interface{}); ok && len(content) > 0 {
							if item, ok := content[0].(map[string]interface{}); ok {
								if text, ok := item["text"].(string); ok {
									if strings.Contains(text, "hello mcp") {
										t.Log("Verified bash output")
										close(toolsDone) // Done with testing
										return
									}
								}
							}
						}
					}
					t.Errorf("Unexpected call result: %v", resp)
					close(toolsDone) // Fail but exit loop
					return
				}
			}
		}
	}))
	defer ts.Close()

	// 4. Start the Operator MCP Server connecting to our Mock LLM
	// Convert http url to ws
	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize proxies (empty for now or mocked if needed)
	proxies := []*mcp.ProxyClient{}

	server := mcp.NewServer(ctx, proxies)
	wsTransport := transport.NewWebSocketTransport(wsURL)

	go func() {
		if err := server.Run(ctx, wsTransport); err != nil {
			t.Logf("Server returned: %v", err)
		}
	}()

	// 5. Wait for test completion
	select {
	case <-initDone:
		t.Log("Initialization successful")
	case <-time.After(5 * time.Second):
		t.Errorf("Timeout waiting for initialization")
	}

	select {
	case <-toolsDone:
		t.Log("Tools listing successful")
	case <-time.After(5 * time.Second):
		t.Errorf("Timeout waiting for tools list")
	}
}

// PipeTransport implements mcp.Transport using net.Pipe
type PipeTransport struct {
	conn net.Conn
}

func (t *PipeTransport) Connect(ctx context.Context) (sdk.Connection, error) {
	return &PipeConnection{conn: t.conn}, nil
}

// PipeConnection implements mcp.Connection
type PipeConnection struct {
	conn net.Conn
}

func (c *PipeConnection) SessionID() string { return "pipe-session" }
func (c *PipeConnection) Close() error      { return c.conn.Close() }
func (c *PipeConnection) Read(ctx context.Context) (jsonrpc.Message, error) {
	// Simple JSON-RPC reading - we assume 1 JSON object per Write
	// net.Pipe guarantees atomic writes? No.
	// We need a framer or decoder.
	// For test, we can use json.Decoder. It handles standard stream parsing.
	decoder := json.NewDecoder(c.conn)
	// We need to decode into something generic first or directly using sdk helpers?
	// jsonrpc.DecodeMessage takes []byte.
	var raw json.RawMessage
	if err := decoder.Decode(&raw); err != nil {
		return nil, err
	}
	return jsonrpc.DecodeMessage(raw)
}

func (c *PipeConnection) Write(ctx context.Context, message jsonrpc.Message) error {
	data, err := jsonrpc.EncodeMessage(message)
	if err != nil {
		return err
	}
	// We need to send it as a distinct JSON object. Content is already JSON.
	// Just write it.
	_, err = c.conn.Write(data)
	return err
}

func TestMCPProxiedToolsAggregation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Create Mock Downstream Servers
	createMockServer := func(name string, toolName string) (*mcp.ProxyClient, func()) {
		// Create server
		server := sdk.NewServer(&sdk.Implementation{
			Name:    name,
			Version: "1.0.0",
		}, nil)

		tool := sdk.Tool{
			Name:        toolName,
			Description: "Mock tool",
			InputSchema: map[string]interface{}{
				"type": "object",
			},
		}

		server.AddTool(&tool, func(ctx context.Context, request *sdk.CallToolRequest) (*sdk.CallToolResult, error) {
			return &sdk.CallToolResult{Content: []sdk.Content{
				&sdk.TextContent{Text: "mock output"},
			}}, nil
		})

		// Create Transport Pair
		c1, c2 := net.Pipe()

		// Run server in background
		go server.Run(ctx, &PipeTransport{conn: c1})

		// Create Client to connect to it
		client := sdk.NewClient(&sdk.Implementation{
			Name:    "operator-proxy",
			Version: "1.0",
		}, nil)

		session, err := client.Connect(ctx, &PipeTransport{conn: c2}, nil)
		if err != nil {
			t.Fatalf("Failed to connect to mock %s: %v", name, err)
		}

		return &mcp.ProxyClient{
				Client:  client,
				Session: session,
				Name:    name,
			}, func() {
				c1.Close()
				c2.Close()
			}
	}

	argoProxy, cleanupArgo := createMockServer("argo", "argo-tool")
	defer cleanupArgo()
	k8sProxy, cleanupK8s := createMockServer("k8s", "k8s-tool")
	defer cleanupK8s()

	// 2. Setup Operator Server with these proxies
	proxies := []*mcp.ProxyClient{argoProxy, k8sProxy}
	server := mcp.NewServer(ctx, proxies)

	// 3. Setup WebSocket Mock for Client <-> Operator
	upgrader := websocket.Upgrader{}
	toolsDone := make(chan struct{})

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("Upgrade error: %v", err)
			return
		}
		defer conn.Close()

		// Send initialize
		conn.WriteJSON(map[string]interface{}{
			"jsonrpc": "2.0",
			"method":  "initialize",
			"id":      "init-1",
			"params": map[string]interface{}{
				"protocolVersion": "2024-11-05",
				"capabilities":    map[string]interface{}{},
				"clientInfo":      map[string]interface{}{"name": "test", "version": "1"},
			},
		})

		// Read loop
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}

			var resp map[string]interface{}
			json.Unmarshal(msg, &resp)

			if id, ok := resp["id"].(string); ok && id == "init-1" {
				// Init done, send tools/list
				conn.WriteJSON(map[string]interface{}{
					"jsonrpc": "2.0",
					"method":  "notifications/initialized",
				})
				conn.WriteJSON(map[string]interface{}{
					"jsonrpc": "2.0",
					"method":  "tools/list",
					"id":      "tools-1",
				})
			}

			if id, ok := resp["id"].(string); ok && id == "tools-1" {
				// Verify tools
				if res, ok := resp["result"].(map[string]interface{}); ok {
					if tools, ok := res["tools"].([]interface{}); ok {
						// We expect: bash, kubectl, argo-tool, k8s-tool
						foundArgo := false
						foundK8s := false
						foundBash := false

						for _, tRaw := range tools {
							toolMap := tRaw.(map[string]interface{})
							name := toolMap["name"]
							desc := toolMap["description"]
							args := toolMap["inputSchema"]
							t.Logf("Tool Name: %v", name)
							t.Logf("Tool Description: %v", desc)
							t.Logf("Tool Arguments: %+v", args)
							t.Log("----------------------------------------")

							if nameStr, ok := name.(string); ok {
								if nameStr == "argo-tool" {
									foundArgo = true
								}
								if nameStr == "k8s-tool" {
									foundK8s = true
								}
								if nameStr == "bash" {
									foundBash = true
								}
							}
						}

						if foundArgo && foundK8s && foundBash {
							t.Log("Found all expected tools!")
							close(toolsDone)
							return
						} else {
							t.Logf("Tools found: %+v", tools)
						}
					}
				}
			}
		}
	}))
	defer ts.Close()

	// 4. Connect Operator to Mock WS
	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http")
	wsTransport := transport.NewWebSocketTransport(wsURL)
	go server.Run(ctx, wsTransport)

	select {
	case <-toolsDone:
		// success
	case <-time.After(5 * time.Second):
		t.Fatal("Timeout waiting for tools list")
	}
}
