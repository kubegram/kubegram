/**
 * Pure utility for classifying user-provided context strings into buckets.
 * Extracted from SystemPromptBuilder.processUserContext() in system.ts.
 * No LLM I/O — keyword-prefix classification only.
 */

import type { ProcessedContext } from '../workflows/types.js';

export { ProcessedContext };

/**
 * Classifies context messages by keyword prefix into three buckets:
 * - systemMessages: correction/retry/error context
 * - planningContext: architectural/strategy intent
 * - userRequirements: all other feature requirements
 */
export function processUserContext(context: string[]): ProcessedContext {
  const result: ProcessedContext = {
    systemMessages: [],
    userRequirements: [],
    planningContext: [],
  };

  for (const message of context) {
    const lowerMessage = message.toLowerCase();

    if (
      lowerMessage.includes('system:') ||
      lowerMessage.includes('retry:') ||
      lowerMessage.includes('error:') ||
      lowerMessage.includes('fix:') ||
      lowerMessage.includes('correction:')
    ) {
      result.systemMessages.push(message);
    } else if (
      lowerMessage.includes('plan:') ||
      lowerMessage.includes('strategy:') ||
      lowerMessage.includes('approach:') ||
      lowerMessage.includes('architecture:')
    ) {
      result.planningContext.push(message);
    } else {
      result.userRequirements.push(message);
    }
  }

  return result;
}
