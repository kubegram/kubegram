/**
 * MCP Service
 * Integrates connection registry, workflow, and tool handlers
 * Main service for MCP WebSocket endpoint
 */

import { WebSocket } from 'ws';
import { mcpConnectionRegistry } from './connection-registry';
import { MCPWorkflow } from './workflow';
import { MCPMessageParser, MCPMessage } from './types';
import { mcpCheckpointer } from './checkpointer';
import { codegenPubSub } from '../state/pubsub';
import type { WorkflowContext } from '../types/workflow';
import { mcpTools } from './tool-registry';

export class MCPService {
  private workflow: MCPWorkflow;
  private toolHandlers: Map<string, Function> = new Map();

  constructor() {
    // Initialize workflow with Redis checkpointer and pubsub
    this.workflow = new MCPWorkflow(mcpCheckpointer, codegenPubSub);
    
    // Register basic tool handlers
    this.registerBasicTools();
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(websocket: WebSocket): Promise<void> {
    const connectionId = mcpConnectionRegistry.register(websocket);
    
    console.info(`MCP Server connected: ${connectionId}`);
    
    // Set up WebSocket event handlers
    websocket.on('message', async (data: Buffer) => {
      await this.handleMessage(connectionId, data.toString());
    });

    websocket.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    websocket.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });

    // Initialize the workflow with empty message to trigger handshake
    try {
      const initialContext: WorkflowContext = {
        threadId: connectionId,
        jobId: connectionId,
        userId: 'system',
        companyId: 'kubegram',
      };

      const initialMessages = await this.workflow.processMessage(connectionId, {
        type: 'notification',
        method: 'ping',
        timestamp: new Date().toISOString(),
      });

      // Send any initial messages
      for (const message of initialMessages) {
        await this.sendMessage(websocket, message);
      }
    } catch (error) {
      console.error(`Failed to initialize MCP workflow for ${connectionId}:`, error);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(connectionId: string, data: string): Promise<void> {
    const connection = mcpConnectionRegistry.getConnection(connectionId);
    if (!connection) {
      console.error(`Connection not found: ${connectionId}`);
      return;
    }

    try {
      console.debug(`Received from operator: ${data}`);
      
      // Parse the incoming message
      const message = MCPMessageParser.parse(data);
      
      // Process message through workflow
      const outgoingMessages = await this.workflow.processMessage(connectionId, message);
      
      // Send responses
      for (const outgoingMessage of outgoingMessages) {
        console.debug(`Sending to operator: ${MCPMessageParser.stringify(outgoingMessage)}`);
        await this.sendMessage(connection.websocket, outgoingMessage);
      }
      
    } catch (error) {
      console.error(`Error processing message from ${connectionId}:`, error);
      
      // Send error response
      const errorResponse = MCPMessageParser.createError(
        null,
        -32603, // Internal error
        error instanceof Error ? error.message : String(error)
      );
      
      await this.sendMessage(connection.websocket, errorResponse);
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(connectionId: string): void {
    console.info(`MCP Server disconnected: ${connectionId}`);
    mcpConnectionRegistry.deregister(connectionId);
  }

  /**
   * Send message through WebSocket
   */
  private async sendMessage(websocket: WebSocket, message: MCPMessage): Promise<void> {
    try {
      const messageString = MCPMessageParser.stringify(message);
      websocket.send(messageString);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Register a tool handler
   */
  registerTool(name: string, description: string, inputSchema: any, handler: Function): void {
    this.toolHandlers.set(name, handler);
    this.workflow.registerTool(name, description, inputSchema, handler as any);
  }

  /**
   * Get workflow instance for advanced usage
   */
  getWorkflow(): MCPWorkflow {
    return this.workflow;
  }

  /**
   * Register all MCP tools from the tool registry
   */
  private registerBasicTools(): void {
    // Register all tools from the tool registry
    for (const tool of mcpTools) {
      this.registerTool(tool.name, tool.description, tool.inputSchema, tool.handler);
    }
  }
}

// Export singleton instance
export const mcpService = new MCPService();