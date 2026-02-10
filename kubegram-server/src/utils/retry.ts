/**
 * Retry Utility Functions
 * 
 * Utility functions for implementing retry logic with exponential backoff.
 */

/**
 * Exponential backoff calculation
 * delay = baseDelay * 2^(attempt - 1)
 * 
 * @param baseDelay - Base delay in milliseconds
 * @param attempt - Current attempt number (1-based)
 * @returns number - Calculated delay in milliseconds
 */
export function exponentialBackoff(baseDelay: number, attempt: number): number {
  return baseDelay * Math.pow(2, attempt - 1);
}

/**
 * Jitter function to avoid thundering herd
 * Adds random variation to delay to prevent synchronized retries
 * 
 * @param delay - Base delay
 * @param jitterFactor - Jitter factor as percentage (default: 0.1 = 10%)
 * @returns number - Delay with jitter applied
 */
export function addJitter(delay: number, jitterFactor: number = 0.1): number {
  const jitter = delay * jitterFactor * Math.random();
  return delay + jitter;
}

/**
 * Calculate if we should retry based on timing
 * 
 * @param startTime - Start time in milliseconds
 * @param maxDuration - Maximum allowed duration in milliseconds
 * @returns boolean - True if within retry window
 */
export function shouldRetryByTime(startTime: number, maxDuration: number = 120000): boolean {
  return Date.now() - startTime < maxDuration; // 2 minutes = 120,000ms
}

/**
 * Create a retryable operation wrapper
 * 
 * @param operation - The operation to make retryable
 * @param options - Retry configuration
 * @returns Promise with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDuration?: number;
    isRetryable?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 2000,
    maxDuration = 120000, // 2 minutes
    isRetryable
  } = options;

  let lastError: any;
  const startTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (isRetryable && !isRetryable(error)) {
        throw error;
      }

      // Check time window
      if (!shouldRetryByTime(startTime, maxDuration)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay and wait
      const delay = addJitter(exponentialBackoff(baseDelay, attempt));
      console.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms:`, (error as Error).message);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Default retryable error checker
 * 
 * @param error - Error to check
 * @returns boolean - True if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Check HTTP status codes
  if (error.response?.status) {
    const status = error.response.status;
    // Retry on 5xx errors and some 4xx errors
    return (
      (status >= 500 && status < 600) ||
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504 // Gateway Timeout
    );
  }

  // Check error message patterns
  const message = error.message || String(error);
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /unavailable/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i
  ];

  return retryablePatterns.some(pattern => pattern.test(message));
}