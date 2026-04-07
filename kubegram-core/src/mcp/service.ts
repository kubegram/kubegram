/**
 * MCP Service
 * Integrates connection registry, workflow, and tool handlers
 * Main service for MCP WebSocket endpoint
 */

import { WebSocket } from "ws";
import { EventBus, EventCache } from "@kubegram/events";
import { mcpConnectionRegistry } from "./connection-registry";
import { MCPMessageParser, MCPMessage } from "./types";
import type { WorkflowContext } from "../types/workflow";
import { mcpTools, type MCPToolServiceContext } from "./tool-registry";
import { MCPWorkflow } from "../workflows/mcp-workflow";
import type { CodegenWorkflow } from "../workflows/codegen-workflow.js";
import type { PlanWorkflow } from "../workflows/plan-workflow.js";

export class MCPService implements MCPToolServiceContext {
  private workflow: MCPWorkflow;
  private toolHandlers: Map<
    string,
    (params: unknown, context: WorkflowContext) => Promise<unknown>
  > = new Map();

  readonly codegenWorkflow?: CodegenWorkflow;
  readonly planWorkflow?: PlanWorkflow;

  constructor(
    eventCache?: EventCache,
    eventBus?: EventBus,
    workflows?: {
      codegenWorkflow?: CodegenWorkflow;
      planWorkflow?: PlanWorkflow;
    },
  ) {
    const cache =
      eventCache ?? new EventCache({ maxSize: 1000, ttl: 3_600_000 });
    const bus = eventBus ?? new EventBus({ enableCache: false });
    this.workflow = new MCPWorkflow(cache, bus);
    this.codegenWorkflow = workflows?.codegenWorkflow;
    this.planWorkflow = workflows?.planWorkflow;

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
    websocket.on("message", async (data: Buffer) => {
      await this.handleMessage(connectionId, data.toString());
    });

    websocket.on("close", () => {
      this.handleDisconnection(connectionId);
    });

    websocket.on("error", (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error);
      this.handleDisconnection(connectionId);
    });

    // Initialize the workflow with empty message to trigger handshake
    try {
      const initialMessages = await this.workflow.processMessage(connectionId, {
        type: "notification",
        method: "ping",
        timestamp: new Date().toISOString(),
      });

      // Send any initial messages
      for (const message of initialMessages) {
        await this.sendMessage(websocket, message);
      }
    } catch (error) {
      console.error(
        `Failed to initialize MCP workflow for ${connectionId}:`,
        error,
      );
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(
    connectionId: string,
    data: string,
  ): Promise<void> {
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
      const outgoingMessages = await this.workflow.processMessage(
        connectionId,
        message,
      );

      // Send responses
      for (const outgoingMessage of outgoingMessages) {
        console.debug(
          `Sending to operator: ${MCPMessageParser.stringify(outgoingMessage)}`,
        );
        await this.sendMessage(connection.websocket, outgoingMessage);
      }
    } catch (error) {
      console.error(`Error processing message from ${connectionId}:`, error);

      // Send error response
      const errorResponse = MCPMessageParser.createError(
        null,
        -32603, // Internal error
        error instanceof Error ? error.message : String(error),
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
  private async sendMessage(
    websocket: WebSocket,
    message: MCPMessage,
  ): Promise<void> {
    try {
      const messageString = MCPMessageParser.stringify(message);
      websocket.send(messageString);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  /**
   * Register a tool handler
   */
  registerTool(
    name: string,
    description: string,
    inputSchema: Record<string, unknown>,
    handler: (params: unknown, context: WorkflowContext) => Promise<unknown>,
  ): void {
    this.toolHandlers.set(name, handler);
    this.workflow.registerTool(
      name,
      description,
      inputSchema,
      handler as (
        params: unknown,
        context: WorkflowContext,
      ) => Promise<unknown>,
    );
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
    for (const tool of mcpTools) {
      this.registerTool(
        tool.name,
        tool.description,
        tool.inputSchema,
        (params: unknown, context: WorkflowContext) =>
          tool.handler(this, params as Record<string, unknown>, context),
      );
    }
  }
}

// Export singleton instance
export const mcpService = new MCPService();
