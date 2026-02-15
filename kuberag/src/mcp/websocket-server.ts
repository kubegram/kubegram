/**
 * MCP WebSocket Server
 * Standalone WebSocket server for MCP integration
 */

import { createServer, Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { mcpService } from './service';
import { serverConfig } from '../config';

export class MCPWebSocketServer {
  private server: Server;
  private wss: WebSocketServer;

  constructor() {
    // Create HTTP server
    this.server = createServer();
    
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: this.server,
      path: '/operator',
    });

    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.info(`MCP WebSocket connection established from ${req.socket.remoteAddress}`);
      mcpService.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      console.error('MCP WebSocket server error:', error);
    });

    this.server.on('error', (error) => {
      console.error('MCP HTTP server error:', error);
    });
  }

  async start(): Promise<void> {
    const port = serverConfig.port + 1; // Use port+1 for WebSocket server
    
    return new Promise((resolve, reject) => {
      this.server.listen(port, () => {
        console.info(`MCP WebSocket server listening on port ${port}`);
        console.info(`MCP WebSocket endpoint: ws://localhost:${port}/operator`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.info('MCP WebSocket server stopped');
          resolve();
        });
      });
    });
  }
}