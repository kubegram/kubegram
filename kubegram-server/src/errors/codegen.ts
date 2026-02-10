/**
 * Code Generation Error Class
 * 
 * Custom error class for code generation failures with retry logic.
 * Supports exponential backoff retry for server-side errors.
 */

import type { Graph } from '@/clients/rag-client';
import { exponentialBackoff } from '@/utils/retry';

export class CodegenError extends Error {
  public readonly graph: Graph;
  public readonly isServerError: boolean;
  public readonly retryable: boolean;
  public readonly attempt: number;

  constructor(
    message: string,
    graph: Graph,
    options: {
      isServerError?: boolean;
      retryable?: boolean;
      attempt?: number;
    } = {}
  ) {
    super(message);
    this.name = 'CodegenError';
    this.graph = graph;
    this.isServerError = options.isServerError ?? false;
    this.retryable = options.retryable ?? false;
    this.attempt = options.attempt ?? 1;
  }

  /**
   * Execute operation with retry logic for server-side errors
   * 
   * @param operation - The async operation to execute
   * @param graph - Graph object for error context
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param baseDelay - Base delay in milliseconds (default: 2000)
   * @returns Promise<T> - Result of the operation
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    graph: Graph,
    maxRetries: number = 3,
    baseDelay: number = 2000 // 2 minute window: 2^3 * baseDelay = 16000ms average
  ): Promise<T> {
    let lastError: CodegenError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        // Check if it's a server-side error
        const isServerError = this.isServerError(error);

        if (!isServerError || attempt === maxRetries) {
          // Not retryable or max retries reached
          throw error instanceof CodegenError
            ? error
            : new CodegenError(
              error instanceof Error ? error.message : String(error),
              graph,
              {
                isServerError,
                retryable: isServerError && attempt < maxRetries,
                attempt
              }
            );
        }

        lastError = new CodegenError(
          error instanceof Error ? error.message : String(error),
          graph,
          {
            isServerError: true,
            retryable: true,
            attempt
          }
        );

        // Calculate delay using exponential backoff
        const delay = exponentialBackoff(baseDelay, attempt);

        console.warn(`Code generation attempt ${attempt} failed, retrying in ${delay}ms:`, (error as Error).message);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached due to loop logic above
    throw lastError!;
  }

  /**
   * Determine if error is server-side based on error characteristics
   * 
   * @param error - The error to analyze
   * @returns boolean - True if this is a server-side error
   */
  private static isServerError(error: any): boolean {
    if (error instanceof CodegenError) {
      return error.isServerError;
    }

    // Check HTTP status codes if available
    if (error.response?.status) {
      const status = error.response.status;
      // 5xx errors are retryable server errors
      return status >= 500 && status < 600;
    }

    // Check error message patterns
    const message = error.message || String(error);
    const serverErrorPatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /unavailable/i,
      /internal error/i,
      /server error/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i
    ];

    return serverErrorPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Get error details for logging/monitoring
   * 
   * @returns Object - Error details object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      graphId: this.graph.id,
      graphName: this.graph.name,
      isServerError: this.isServerError,
      retryable: this.retryable,
      attempt: this.attempt,
      timestamp: new Date().toISOString()
    };
  }
}