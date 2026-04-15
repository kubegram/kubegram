import type { Hono } from 'hono';
// @ts-expect-error - Test helper needs app export
import { createHonoApp } from '../../../index';
import { vi } from 'vitest';

let testApp: Hono | null = null;

export async function createTestApp(): Promise<Hono> {
  if (testApp) {
    return testApp;
  }
  
  vi.mock('../../../src/clients/rag-client', () => ({
    createRAGClient: vi.fn().mockReturnValue({
      initializeCodeGen: vi.fn().mockResolvedValue({
        jobId: 'test-job-id',
        status: 'pending',
      }),
      getCodeGenStatus: vi.fn().mockResolvedValue({
        status: 'completed',
        progress: 100,
      }),
      getCodeGenResults: vi.fn().mockResolvedValue({
        artifacts: [],
      }),
      initializePlan: vi.fn().mockResolvedValue({
        jobId: 'test-plan-job-id',
        status: 'pending',
      }),
      getPlanStatus: vi.fn().mockResolvedValue({
        status: 'completed',
      }),
      getPlanResults: vi.fn().mockResolvedValue({
        plan: {},
      }),
      initializeValidation: vi.fn().mockResolvedValue({
        jobId: 'test-validation-job-id',
        status: 'pending',
      }),
      getValidationStatus: vi.fn().mockResolvedValue({
        status: 'completed',
      }),
      getValidationResults: vi.fn().mockResolvedValue({
        results: [],
      }),
    }),
  }));
  
  // @ts-expect-error - App initialization
  testApp = await createHonoApp();
  return testApp!;
}

export function resetTestApp(): void {
  testApp = null;
}
