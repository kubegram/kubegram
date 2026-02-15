/**
 * MCP-specific checkpointer for workflow state persistence
 */

import { RedisCheckpointer } from '../state/checkpointer';
import { MCPWorkflowState } from './workflow';

// Create a dedicated checkpointer for MCP workflow state
export const mcpCheckpointer = new RedisCheckpointer<MCPWorkflowState>('mcp:workflow:');