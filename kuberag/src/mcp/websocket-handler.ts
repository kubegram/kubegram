/**
 * WebSocket handler for MCP integration
 * Provides WebSocket upgrade functionality for the /operator endpoint
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { mcpService } from './service';

/**
 * Create WebSocket server for MCP connections
 */
export function createMCPServer(): WebSocketServer {
  const wss = new WebSocketServer({
    noServer: true,
    path: '/operator',
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.info(`WebSocket connection established from ${req.socket.remoteAddress}`);
    mcpService.handleConnection(ws);
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  return wss;
}

/**
 * Handle WebSocket upgrade for HTTP server
 */
export function handleUpgrade(wss: WebSocketServer, req: any, socket: any, head: Buffer): void {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
}