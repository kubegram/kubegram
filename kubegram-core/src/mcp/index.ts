/**
 * @stub MCPService — lazy-start Model Context Protocol server.
 *
 * The full MCP server implementation (tools, WebSocket transport, kubectl proxy)
 * lives in kubegram-operator (Go). This TypeScript stub exists to reserve the
 * interface contract and support future kubegram-core-native MCP tooling.
 *
 * Current behavior:
 *  - `start()` logs a config message but does NOT bind a port.
 *  - `onConnection()` sets `isRunning=true` but does NOT initialize a real server.
 *  - `stop()` resets `isRunning` and logs.
 */

export interface MCPConfig {
  port?: number;
  host?: string;
}

export interface MCPServiceOptions {
  port?: number;
}

export class MCPService {
  private server: null = null;
  private isRunning = false;
  private config: MCPConfig;

  constructor(config: MCPConfig = {}) {
    this.config = {
      port: config.port || 3001,
      host: config.host || "0.0.0.0",
    };
  }

  /**
   * Start MCP server - lazy loading pattern
   * Server only starts when first WebSocket connects
   */
  async start(options: MCPServiceOptions = {}): Promise<void> {
    const port = options.port || this.config.port;

    console.info(`MCP service configured on port ${port} (lazy-start mode)`);
    // Actual server start happens on first connection
  }

  /**
   * Called when a WebSocket connection is established
   * This is where we actually start the MCP server
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onConnection(_socket: unknown): Promise<void> {
    if (!this.isRunning) {
      console.info("Starting MCP server on first WebSocket connection...");
      this.isRunning = true;
      // Initialize MCP server here
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.info("MCP service stopped");
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
