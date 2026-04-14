import { Hono } from 'hono';
import { createHonoApp } from '../../index';

export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | undefined>;
  body?: unknown;
  contentType?: string;
}

export interface ApiResponse<T = unknown> {
  status: number;
  headers: Headers;
  body: T;
  ok: boolean;
}

export class TestClient {
  private app: Hono | null = null;
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:8090') {
    this.baseUrl = baseUrl;
  }

  async init(): Promise<void> {
    if (!this.app) {
      this.app = await createHonoApp();
    }
  }

  private buildUrl(path: string, query?: Record<string, string | undefined>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, value);
        }
      });
    }
    return url.toString();
  }

  private buildRequestInit(options: RequestOptions): RequestInit {
    const headers: Record<string, string> = {
      ...options.headers,
    };

    if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    } else if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const init: RequestInit = {
      method: options.body ? 'POST' : 'GET',
      headers,
    };

    if (options.body) {
      init.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    return init;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options.query);
    const requestInit = this.buildRequestInit({
      ...options,
      method,
    });

    const response = await fetch(url, requestInit);
    const contentType = response.headers.get('content-type');
    let body: T;

    if (contentType?.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text() as unknown as T;
    }

    return {
      status: response.status,
      headers: response.headers,
      body,
      ok: response.ok,
    };
  }

  async get<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, options);
  }

  async post<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, options);
  }

  async put<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, options);
  }

  async patch<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, options);
  }

  async delete<T = unknown>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, options);
  }
}

let testClient: TestClient | null = null;

export function getTestClient(): TestClient {
  if (!testClient) {
    testClient = new TestClient();
  }
  return testClient;
}

export function resetTestClient(): void {
  testClient = null;
}

export async function createAuthenticatedRequest(user: keyof typeof import('./auth').TEST_USERS = 'admin') {
  const client = getTestClient();
  await client.init();
  return client;
}

export function createRequestWithSession(session: string) {
  const client = getTestClient();
  return client;
}

export function createRequestWithBearer(token: string) {
  const client = getTestClient();
  return client;
}

export function assertResponseOk(response: ApiResponse): void {
  if (!response.ok) {
    throw new Error(`Expected response to be OK, got ${response.status}: ${JSON.stringify(response.body)}`);
  }
}

export function assertResponseStatus(response: ApiResponse, status: number): void {
  if (response.status !== status) {
    throw new Error(`Expected status ${status}, got ${response.status}: ${JSON.stringify(response.body)}`);
  }
}

export function assertResponseBody<T>(response: ApiResponse<T>, expected: Partial<T>): void {
  const body = response.body as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    if (body[key] !== value) {
      throw new Error(`Expected body.${key} to be ${JSON.stringify(value)}, got ${JSON.stringify(body[key])}`);
    }
  }
}
