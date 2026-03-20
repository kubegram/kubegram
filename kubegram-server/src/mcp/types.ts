import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AuthContext } from '@/middleware/auth';

export type { AuthContext, CallToolResult };

export function mcpJson(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function mcpError(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
