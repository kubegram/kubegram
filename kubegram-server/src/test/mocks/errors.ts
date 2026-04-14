import { vi } from 'vitest';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ValidationError extends HttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(422, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends HttpError {
  constructor(message = 'Authentication required') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends HttpError {
  constructor(message = 'Insufficient permissions') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends HttpError {
  constructor(message = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR');
    this.name = 'InternalServerError';
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = 'Service temporarily unavailable') {
    super(503, message, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Too many requests') {
    super(429, message, 'TOO_MANY_REQUESTS');
    this.name = 'TooManyRequestsError';
  }
}

export function createMockErrorHandler() {
  return vi.fn().mockImplementation((error: Error) => {
    if (error instanceof HttpError) {
      return new Response(JSON.stringify({
        error: error.message,
        code: error.code,
        details: error.details,
      }), {
        status: error.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

export function createMockErrorResponse(status: number, message: string, code?: string) {
  return new Response(JSON.stringify({
    error: message,
    code: code || `HTTP_${status}`,
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const MOCK_ERROR_RESPONSES = {
  badRequest: createMockErrorResponse(400, 'Bad request', 'BAD_REQUEST'),
  unauthorized: createMockErrorResponse(401, 'Authentication required', 'AUTHENTICATION_ERROR'),
  forbidden: createMockErrorResponse(403, 'Insufficient permissions', 'AUTHORIZATION_ERROR'),
  notFound: createMockErrorResponse(404, 'Resource not found', 'NOT_FOUND'),
  conflict: createMockErrorResponse(409, 'Resource already exists', 'CONFLICT'),
  validationError: createMockErrorResponse(422, 'Validation failed', 'VALIDATION_ERROR'),
  tooManyRequests: createMockErrorResponse(429, 'Too many requests', 'TOO_MANY_REQUESTS'),
  internalError: createMockErrorResponse(500, 'Internal server error', 'INTERNAL_ERROR'),
  serviceUnavailable: createMockErrorResponse(503, 'Service temporarily unavailable', 'SERVICE_UNAVAILABLE'),
};

export function mockThrowUnauthorized(message?: string) {
  throw new AuthenticationError(message);
}

export function mockThrowForbidden(message?: string) {
  throw new AuthorizationError(message);
}

export function mockThrowNotFound(resource: string) {
  throw new NotFoundError(resource);
}

export function mockThrowValidation(message: string, details?: Record<string, unknown>) {
  throw new ValidationError(message, details);
}

export function mockThrowConflict(message: string) {
  throw new ConflictError(message);
}

export function mockThrowInternal(message?: string) {
  throw new InternalServerError(message);
}

export function mockThrowServiceUnavailable() {
  throw new ServiceUnavailableError();
}

export function mockThrowTooManyRequests() {
  throw new TooManyRequestsError();
}

export function createErrorHandler(error: unknown) {
  if (error instanceof HttpError) {
    return error;
  }
  if (error instanceof Error) {
    return new InternalServerError(error.message);
  }
  return new InternalServerError();
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function isClientError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 400 && error.status < 500;
  }
  return false;
}

export function isServerError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status >= 500;
  }
  return false;
}
