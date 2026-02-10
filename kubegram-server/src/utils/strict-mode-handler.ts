/**
 * Strict Mode Error Handler Utility
 * 
 * Handles strict mode violations and provides meaningful error messages
 */

export function isStrictModeError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  const strictModePatterns = [
    /arguments.*callee.*cannot be accessed/i,
    /caller.*callee.*arguments.*properties.*may not be accessed/i,
    /restricted.*function.*properties/i,
    /strict.*mode/i
  ];
  
  return strictModePatterns.some(pattern => pattern.test(errorMessage));
}

export function handleStrictModeError(error: any, context: string = 'unknown'): Error {
  if (isStrictModeError(error)) {
    console.error(`Strict mode error in ${context}:`, error);
    return new Error(
      `Strict mode violation in ${context}. This is likely caused by a library incompatibility. ` +
      `Try updating your database libraries or using the alternative database configuration.`
    );
  }
  
  return error;
}

export function wrapWithErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw handleStrictModeError(error, context);
    }
  };
}
