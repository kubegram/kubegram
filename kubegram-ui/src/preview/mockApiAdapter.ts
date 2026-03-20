import type { InternalAxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';
import {
  MOCK_CODEGEN_RESULTS,
  MOCK_PLAN_RESULT,
  MOCK_TEAM,
  MOCK_ORGANIZATION,
  MOCK_COMPANY,
  MOCK_LLM_CONFIGS,
} from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function mockResponse<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {} as AxiosHeaders,
    config,
  };
}

export function createMockAdapter() {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();

    // Simulate network latency
    await delay(150);

    // --- Code Generation ---
    if (url.includes('/graph/codegen') && method === 'post') {
      return mockResponse(config, { jobId: 'preview-job-1' });
    }
    if (url.includes('/graph/codegen') && url.includes('/status') && method === 'get') {
      return mockResponse(config, { jobId: 'preview-job-1', status: 'COMPLETED' });
    }
    if (url.includes('/graph/codegen') && url.includes('/results') && method === 'get') {
      return mockResponse(config, MOCK_CODEGEN_RESULTS);
    }

    // --- Planning ---
    if (url.includes('/graph/plan') && method === 'post') {
      return mockResponse(config, { jobId: 'preview-plan-1', status: 'COMPLETED' });
    }
    if (url.includes('/graph/plan') && url.includes('/status') && method === 'get') {
      return mockResponse(config, { jobId: 'preview-plan-1', status: 'COMPLETED' });
    }
    if (url.includes('/graph/plan') && url.includes('/results') && method === 'get') {
      return mockResponse(config, MOCK_PLAN_RESULT);
    }

    // --- Context (team, org, company) ---
    if (url.includes('/teams')) {
      return mockResponse(config, MOCK_TEAM);
    }
    if (url.includes('/organizations')) {
      return mockResponse(config, MOCK_ORGANIZATION);
    }
    if (url.includes('/companies')) {
      return mockResponse(config, MOCK_COMPANY);
    }

    // --- Projects ---
    if (url.includes('/projects') && method === 'get') {
      return mockResponse(config, []);
    }
    if (url.includes('/projects') && method === 'post') {
      return mockResponse(config, { id: 'preview-project-1', name: 'Preview Project' });
    }

    // --- LLM Configs ---
    if (url.includes('/llm-config') || url.includes('/llm')) {
      return mockResponse(config, MOCK_LLM_CONFIGS);
    }

    // --- Auth ---
    if (url.includes('/auth/')) {
      return mockResponse(config, { user: { id: 'preview-user-1' }, accessToken: 'preview-token' });
    }

    // --- Health ---
    if (url.includes('/healthz')) {
      return mockResponse(config, { status: 'ok' });
    }

    // --- Users ---
    if (url.includes('/users')) {
      return mockResponse(config, { id: 'preview-user-1', name: 'Preview User', email: 'preview@kubegram.com' });
    }

    // --- Fallback ---
    console.log(`[Preview Mock] Unhandled request: ${method.toUpperCase()} ${url}`);
    return mockResponse(config, {});
  };
}
