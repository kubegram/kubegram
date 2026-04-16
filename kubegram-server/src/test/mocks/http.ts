import { vi } from 'vitest';

export interface MockedRoute {
  method: string;
  path: string;
  status: number;
  body?: unknown;
  headers?: Record<string, string>;
  delay?: number;
}

export function createMockHttpClient(routes: MockedRoute[] = []) {
  const routeMap = new Map<string, MockedRoute>();

  routes.forEach((route) => {
    const key = `${route.method.toUpperCase()}:${route.path}`;
    routeMap.set(key, route);
  });

  const mockFetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
    const method = (options?.method || 'GET').toUpperCase();
    const key = `${method}:${new URL(url).pathname}`;

    const route = routeMap.get(key);

    if (!route) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (route.delay) {
      await new Promise((resolve) => setTimeout(resolve, route.delay));
    }

    return new Response(
      route.body ? JSON.stringify(route.body) : undefined,
      {
        status: route.status,
        headers: {
          'Content-Type': 'application/json',
          ...route.headers,
        },
      }
    );
  });

  return {
    fetch: mockFetch,
    addRoute: (route: MockedRoute) => {
      const key = `${route.method.toUpperCase()}:${route.path}`;
      routeMap.set(key, route);
    },
    removeRoute: (method: string, path: string) => {
      const key = `${method.toUpperCase()}:${path}`;
      routeMap.delete(key);
    },
    clearRoutes: () => {
      routeMap.clear();
    },
    getRoutes: () => Array.from(routeMap.values()),
  };
}

export function createMockKuberagClient(overrides?: {
  codegenJobId?: string;
  planJobId?: string;
  validationJobId?: string;
}) {
  const { codegenJobId = 'mock-codegen-job-001' } = overrides || {};

  return createMockHttpClient([
    {
      method: 'POST',
      path: '/graphql',
      status: 200,
      body: {
        data: {
          initializeCodeGen: {
            jobId: codegenJobId,
            status: 'pending',
          },
        },
      },
    },
  ]);
}

export function createMockExternalService(serviceName: string, routes: MockedRoute[]) {
  const mockClient = createMockHttpClient(routes);

  vi.stubGlobal('fetch', mockClient.fetch);

  return {
    ...mockClient,
    restore: () => {
      vi.unstubAllGlobals();
    },
  };
}

export function createMockOAuthProvider(provider: string, userInfo: {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}) {
  return createMockHttpClient([
    {
      method: 'GET',
      path: `/oauth/${provider}/authorize`,
      status: 302,
      headers: {
        Location: `http://localhost:8090/oauth/${provider}/callback?code=mock_auth_code`,
      },
    },
    {
      method: 'POST',
      path: `/oauth/${provider}/token`,
      status: 200,
      body: {
        access_token: 'mock_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
      },
    },
    {
      method: 'GET',
      path: `/oauth/${provider}/userinfo`,
      status: 200,
      body: userInfo,
    },
  ]);
}

export function createMockArgoCDClient() {
  return createMockHttpClient([
    {
      method: 'POST',
      path: '/api/v1/applications',
      status: 200,
      body: {
        metadata: {
          name: 'mock-app',
          namespace: 'argocd',
        },
        status: {
          health: { status: 'Healthy' },
          sync: { status: 'Synced' },
        },
      },
    },
    {
      method: 'GET',
      path: '/api/v1/applications/mock-app',
      status: 200,
      body: {
        metadata: { name: 'mock-app' },
        status: {
          health: { status: 'Healthy' },
          sync: { status: 'Synced' },
        },
      },
    },
    {
      method: 'POST',
      path: '/api/v1/applications/mock-app/sync',
      status: 200,
      body: {
        status: 'Success',
      },
    },
  ]);
}

export function createMockGitHubClient() {
  return createMockHttpClient([
    {
      method: 'POST',
      path: '/repos/owner/repo/pulls',
      status: 201,
      body: {
        number: 123,
        html_url: 'https://github.com/owner/repo/pull/123',
        title: 'Add Kubernetes manifests',
        state: 'open',
      },
    },
    {
      method: 'GET',
      path: '/repos/owner/repo/pulls/123',
      status: 200,
      body: {
        number: 123,
        html_url: 'https://github.com/owner/repo/pull/123',
        title: 'Add Kubernetes manifests',
        state: 'open',
        merged: false,
      },
    },
    {
      method: 'POST',
      path: '/repos/owner/repo/contents',
      status: 200,
      body: {
        content: 'mock file content',
        sha: 'mock_sha',
      },
    },
  ]);
}

export function createTimeoutMock(delayMs: number = 5000) {
  return vi.fn().mockImplementation(() => 
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), delayMs)
    )
  );
}

export function createErrorMock(status: number, message: string) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

export function createRateLimitMock(retryAfter: number = 60) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    })
  );
}
