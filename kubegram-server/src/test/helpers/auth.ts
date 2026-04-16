import { vi } from 'vitest';
import type { Context } from 'hono';

type Variables = { auth: MockAuthContext };

export interface MockAuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: string;
    teamId?: number;
  };
  sessionId: string;
}

export const TEST_USERS = {
  admin: {
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    avatarUrl: 'https://example.com/avatar1.png',
    role: 'admin',
    teamId: 1,
  },
  manager: {
    id: '2',
    email: 'manager@test.com',
    name: 'Manager User',
    avatarUrl: 'https://example.com/avatar2.png',
    role: 'manager',
    teamId: 1,
  },
  member1: {
    id: '3',
    email: 'member1@test.com',
    name: 'Team Member One',
    avatarUrl: 'https://example.com/avatar3.png',
    role: 'team_member',
    teamId: 2,
  },
  member2: {
    id: '4',
    email: 'member2@test.com',
    name: 'Team Member Two',
    avatarUrl: 'https://example.com/avatar4.png',
    role: 'team_member',
    teamId: 3,
  },
  demo: {
    id: '5',
    email: 'demo@test.com',
    name: 'Demo User',
    avatarUrl: 'https://example.com/avatar5.png',
    role: 'team_member',
    teamId: 4,
  },
} as const;

export const TEST_SESSIONS = {
  admin: 'session-admin-001',
  manager: 'session-manager-001',
  member1: 'session-member1-001',
  member2: 'session-member2-001',
  demo: 'session-demo-001',
} as const;

export const TEST_TOKENS = {
  admin: 'bearer-token-admin-001',
  manager: 'bearer-token-manager-001',
  member1: 'bearer-token-member1-001',
  demo: 'bearer-token-demo-001',
} as const;

export function createMockAuthContext(user: keyof typeof TEST_USERS): MockAuthContext {
  return {
    user: TEST_USERS[user],
    sessionId: TEST_SESSIONS[user],
  };
}

export function createSessionCookie(user: keyof typeof TEST_SESSIONS): string {
  return `session=${TEST_SESSIONS[user]}`;
}

export function createBearerToken(token: keyof typeof TEST_TOKENS): string {
  return `Bearer ${TEST_TOKENS[token]}`;
}

export function createAuthHeaders(user: keyof typeof TEST_USERS): Record<string, string> {
  return {
    Cookie: createSessionCookie(user),
  };
}

export function createBearerHeaders(token: keyof typeof TEST_TOKENS): Record<string, string> {
  return {
    Authorization: createBearerToken(token),
  };
}

export function createAdminHeaders(): Record<string, string> {
  return createAuthHeaders('admin');
}

export function createManagerHeaders(): Record<string, string> {
  return createAuthHeaders('manager');
}

export function createMemberHeaders(user: 'member1' | 'member2' | 'demo' = 'member1'): Record<string, string> {
  return createAuthHeaders(user);
}

export function createNoAuthHeaders(): Record<string, string> {
  return {};
}

export function mockRequireAuth(user: keyof typeof TEST_USERS = 'admin') {
  return vi.fn().mockResolvedValue(createMockAuthContext(user));
}

export function mockOptionalAuth(user?: keyof typeof TEST_USERS) {
  return vi.fn().mockResolvedValue(user ? createMockAuthContext(user) : null);
}

export function mockRequireRole(role: string) {
  return vi.fn().mockImplementation(async (c: Context<{ Variables: Variables }>, next: () => Promise<void>) => {
    c.set('auth', createMockAuthContext(role === 'admin' ? 'admin' : 'member1'));
    await next();
  });
}

export function mockRequireAnyRole(_roles: string[]) {
  return vi.fn().mockImplementation(async (c: Context<{ Variables: Variables }>, next: () => Promise<void>) => {
    c.set('auth', createMockAuthContext('manager'));
    await next();
  });
}

export function createMockContext(
  user: keyof typeof TEST_USERS = 'admin',
  options: { params?: Record<string, string>; query?: Record<string, string>; body?: unknown } = {}
) {
  const auth = createMockAuthContext(user);
  
  return {
    set: vi.fn((key: string, value: unknown) => {
      if (key === 'auth') {
        (auth as any) = value;
      }
    }),
    get: vi.fn((key: string) => {
      if (key === 'auth') return auth;
      return undefined;
    }),
    req: {
      valid(): boolean {
        return true;
      },
    },
    param: vi.fn((key?: string) => {
      if (key) return options.params?.[key];
      return options.params || {};
    }),
    query: vi.fn((key?: string) => {
      if (key) return options.query?.[key];
      return options.query || {};
    }),
    json: vi.fn((data: unknown, status?: number) => {
      return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
    text: vi.fn((data: string, status?: number) => {
      return new Response(data, {
        status: status || 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }),
    body: vi.fn(() => {
      return new Response(JSON.stringify(options.body || {}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
    var: {
      auth,
    },
  } as unknown as Context<{ Variables: Variables }>;
}
