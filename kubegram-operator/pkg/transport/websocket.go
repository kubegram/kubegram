package transport

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/modelcontextprotocol/go-sdk/jsonrpc"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

// WebSocketTransport implements mcp.Transport
type WebSocketTransport struct {
	URL     string
	mu      sync.Mutex
	conn    *websocket.Conn
	stopCh  chan struct{}
	handler func(jsonrpc.Message)
}

// NewWebSocketTransport creates a new WebSocket transport
func NewWebSocketTransport(url string) *WebSocketTransport {
	return &WebSocketTransport{
		URL:    url,
		stopCh: make(chan struct{}),
	}
}

// Connect dial the websocket and returns a connection
func (t *WebSocketTransport) Connect(ctx context.Context) (mcp.Connection, error) {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}
	conn, _, err := dialer.DialContext(ctx, t.URL, nil)
	if err != nil {
		return nil, err
	}
	return &WebSocketConnection{conn: conn}, nil
}

// connect establishes the websocket connection and stores it in the transport.
// This is an internal helper for the Start method.
func (t *WebSocketTransport) connect(ctx context.Context) error {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}
	conn, _, err := dialer.DialContext(ctx, t.URL, nil)
	if err != nil {
		return err
	}
	t.mu.Lock()
	t.conn = conn
	t.mu.Unlock()
	return nil
}

// Start connects to the WebSocket and starts listening for messages
// It implements mcp.Transport.Start
func (t *WebSocketTransport) Start(ctx context.Context, handler func(jsonrpc.Message)) error {
	t.mu.Lock()
	t.handler = handler
	t.mu.Unlock()

	logger := log.Log.WithName("websocket-transport")
	logger.Info("Starting WebSocket transport", "url", t.URL)

	const (
		initialInterval = 1 * time.Second
		maxInterval     = 30 * time.Second
		multiplier      = 2.0
		resetWindow     = 30 * time.Minute
	)
	currentInterval := initialInterval

	for {
		select {
		case <-ctx.Done():
			return nil
		case <-t.stopCh:
			return nil
		default:
			if err := t.connect(ctx); err != nil {
				logger.Error(err, "Failed to connect", "retry_after", currentInterval.String())

				select {
				case <-ctx.Done():
					return nil
				case <-time.After(currentInterval):
					// Exponential backoff
					currentInterval = time.Duration(float64(currentInterval) * multiplier)
					if currentInterval > maxInterval {
						currentInterval = maxInterval
					}
					continue
				}
			}

			// Connection successful
			connectedAt := time.Now()
			logger.Info("Connected to WebSocket server")

			// Read loop
			done := make(chan struct{})
			go func() {
				defer close(done)
				t.mu.Lock()
				currentConn := t.conn
				t.mu.Unlock()

				if currentConn == nil {
					logger.Error(nil, "Connection is nil in read loop, this should not happen")
					return
				}

				for {
					_, message, err := currentConn.ReadMessage()
					if err != nil {
						logger.Error(err, "Read error")
						return
					}
					// logger.Info("Received message", "message", string(message))

					var rpcMsg jsonrpc.Message
					if err := json.Unmarshal(message, &rpcMsg); err != nil {
						logger.Error(err, "Failed to unmarshal JSON-RPC message")
						continue
					}

					t.mu.Lock()
					h := t.handler
					t.mu.Unlock()
					if h != nil {
						h(rpcMsg)
					}
				}
			}()

			select {
			case <-done:
				logger.Info("Connection closed, reconnecting...")
				t.Close() // Close the old connection before attempting to reconnect

				// Check if connection was stable long enough to reset backoff
				if time.Since(connectedAt) > resetWindow {
					currentInterval = initialInterval
				} else {
					// Connection was short-lived, apply backoff
					logger.Info("Connection closed prematurely, applying backoff", "retry_after", currentInterval.String())
					select {
					case <-ctx.Done():
						return nil
					case <-time.After(currentInterval):
						currentInterval = time.Duration(float64(currentInterval) * multiplier)
						if currentInterval > maxInterval {
							currentInterval = maxInterval
						}
					}
				}

			case <-ctx.Done():
				t.Close()
				return nil
			case <-t.stopCh:
				t.Close()
				return nil
			}
		}
	}
}

// Close closes the underlying websocket connection and stops the transport.
func (t *WebSocketTransport) Close() error {
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.conn != nil {
		err := t.conn.Close()
		t.conn = nil // Clear the connection
		if err != nil {
			return fmt.Errorf("failed to close websocket connection: %w", err)
		}
	}
	// Signal to stop the Start loop if it's running
	select {
	case <-t.stopCh:
		// Already closed
	default:
		close(t.stopCh)
	}
	return nil
}

// WebSocketConnection implements mcp.Connection
type WebSocketConnection struct {
	conn   *websocket.Conn
	sendMu sync.Mutex
}

func (c *WebSocketConnection) SessionID() string {
	return "websocket-session"
}

func (c *WebSocketConnection) Read(ctx context.Context) (jsonrpc.Message, error) {
	_, message, err := c.conn.ReadMessage()
	if err != nil {
		return nil, err
	}

	return jsonrpc.DecodeMessage(message)
}

func (c *WebSocketConnection) Write(ctx context.Context, message jsonrpc.Message) error {
	c.sendMu.Lock()
	defer c.sendMu.Unlock()

	data, err := jsonrpc.EncodeMessage(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}
	return c.conn.WriteMessage(websocket.TextMessage, data)
}

func (c *WebSocketConnection) Close() error {
	return c.conn.Close()
}
