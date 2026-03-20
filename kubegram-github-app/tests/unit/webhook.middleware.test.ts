import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { webhookMiddleware } from '../middleware/webhook.middleware';

describe('webhookMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      rawBody: Buffer.from('test payload'),
    };
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  it('should call next() for valid webhook signature', () => {
    // Mock valid signature
    mockRequest.headers = {
      'x-hub-signature-256': 'sha256=validsignature',
    };
    (mockRequest as any).rawBody = Buffer.from('test payload');

    // Mock crypto timingSafeEqual to return true
    const mockTimingSafeEqual = vi.fn().mockReturnValue(true);
    const mockCreateHmac = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('validsignature'),
    });

    vi.mock('crypto', () => ({
      createHmac: mockCreateHmac,
      timingSafeEqual: mockTimingSafeEqual,
    }));

    webhookMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 401 for missing signature', () => {
    mockRequest.headers = {};

    webhookMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Missing signature' });
  });

  it('should return 400 for missing payload', () => {
    mockRequest.headers = {
      'x-hub-signature-256': 'sha256=somesignature',
    };
    (mockRequest as any).rawBody = undefined;

    webhookMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Missing payload' });
  });

  it('should return 401 for invalid signature', () => {
    mockRequest.headers = {
      'x-hub-signature-256': 'sha256=invalidsignature',
    };
    (mockRequest as any).rawBody = Buffer.from('test payload');

    // Mock crypto timingSafeEqual to return false
    const mockTimingSafeEqual = vi.fn().mockReturnValue(false);
    const mockCreateHmac = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('validsignature'),
    });

    vi.mock('crypto', () => ({
      createHmac: mockCreateHmac,
      timingSafeEqual: mockTimingSafeEqual,
    }));

    webhookMiddleware(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
  });
});