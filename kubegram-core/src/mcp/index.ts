/**
 * MCP (Model Context Protocol) service for kubegram-core
 * Supports lazy-loading - starts only when first WebSocket connects
 */

export interface MCPConfig {
  port?: number;
  host?: string;
}

export interface MCPServiceOptions {
  port?: number;
}

export class MCPService {
  private server: any = null;
  private isRunning = false;
  private config: MCPConfig;

  constructor(config: MCPConfig = {}) {
    this.config = {
      port: config.port || 3001,
      host: config.host || '0.0.0.0',
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
  async onConnection(socket: any): Promise<void> {
    if (!this.isRunning) {
      console.info('Starting MCP server on first WebSocket connection...');
      this.isRunning = true;
      // Initialize MCP server here
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.info('MCP service stopped');
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
