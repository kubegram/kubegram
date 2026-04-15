import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { getTestClient, type ApiResponse } from './request';
// @ts-expect-error - Test helpers
import { createAuthHeaders, createAdminHeaders } from './request';
// @ts-expect-error - Mock type
import type { MockRAGClient } from '../mocks/rag-client';
import { createMockRAGClient } from '../mocks/rag-client';
import { getTestDbClient, resetDatabase, loadFixtures } from './db';

export interface TestContext {
  db: ReturnType<typeof getTestDbClient>;
  client: ReturnType<typeof getTestClient>;
  mockRAG: MockRAGClient;
}

export interface AuthTestCases {
  unauthenticated?: boolean;
  adminOnly?: boolean;
  roles?: Array<'admin' | 'manager' | 'team_member'>;
}

export interface CrudTestOptions<T> {
  singular: string;
  plural: string;
  createData: Partial<T>;
  updateData: Partial<T>;
  getId?: (item: T) => string | number;
}

export function createApiTestContext(): TestContext {
  return {
    db: getTestDbClient(),
    client: getTestClient(),
    mockRAG: createMockRAGClient(),
  };
}

export async function setupApiTests(context: TestContext) {
  await context.client.init();
  await resetDatabase();
  await loadFixtures();
}

export async function cleanupApiTests() {
  await resetDatabase();
}

export function describeAuthScenarios(
  name: string,
  testFn: (user: 'admin' | 'manager' | 'member1' | 'noAuth') => void
) {
  describe(`${name} - Auth Scenarios`, () => {
    it('admin should have access', () => testFn('admin'));
    it('manager should have access', () => testFn('manager'));
    it('team_member should have access', () => testFn('member1'));
  });

  describe(`${name} - Unauthenticated`, () => {
    it('should reject unauthenticated requests', () => testFn('noAuth'));
  });
}

export function describeAdminOnly(name: string, testFn: (user: 'admin') => void) {
  describe(`${name} - Admin Only`, () => {
    it('admin should have access', () => testFn('admin'));

    it('manager should be denied', async () => {
      const client = getTestClient();
      await client.init();
      await expectUNAUTHORIZED(client.get(name));
    });

    it('team_member should be denied', async () => {
      const client = getTestClient();
      await client.init();
      await expectUNAUTHORIZED(client.get(name, { headers: createAuthHeaders('member1') }));
    });

    it('should reject unauthenticated', async () => {
      const client = getTestClient();
      await client.init();
      await expectUNAUTHORIZED(client.get(name));
    });
  });
}

export async function expectOK<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.ok).toBe(true);
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  return response.body;
}

export async function expectCREATED<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(201);
  return response.body;
}

export async function expectNOCONTENT(response: ApiResponse): Promise<void> {
  expect(response.status).toBe(204);
}

export async function expectBADREQUEST<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(400);
  return response.body;
}

export async function expectUNAUTHORIZED<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(401);
  return response.body;
}

export async function expectFORBIDDEN<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(403);
  return response.body;
}

export async function expectNOTFOUND<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(404);
  return response.body;
}

export async function expectCONFLICT<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(409);
  return response.body;
}

export async function expectINTERNALSERVERERROR<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(500);
  return response.body;
}

export async function expectVALIDATIONERROR<T>(response: ApiResponse<T>): Promise<T> {
  expect(response.status).toBe(422);
  return response.body;
}

export async function expectPAGINATED<T>(
  response: ApiResponse<T>,
  expectedKeys: string[] = ['data', 'total', 'page', 'limit']
): Promise<T> {
  expect(response.ok).toBe(true);
  const body = response.body as Record<string, unknown>;
  expectedKeys.forEach((key) => {
    expect(body).toHaveProperty(key);
  });
  return response.body;
}

export function createCrudTests<T extends { id: string | number }>(
  options: CrudTestOptions<T>,
  createHeaders: () => Record<string, string>,
  getEntityPath: (id: string | number) => string,
  getListPath: () => string
) {
  const { singular, plural, createData, updateData, getId = (item: T) => item.id } = options;

  describe(`CRUD: ${plural}`, () => {
    let createdItem: T;

    describe('Create', () => {
      it('should create a new ' + singular, async () => {
        const client = getTestClient();
        await client.init();
        const response = await client.post(getListPath(), {
          headers: createHeaders(),
          body: createData,
        });
        const result = await expectCREATED(response);
        expect(result).toBeDefined();
        expect(getId(result as T)).toBeDefined();
        createdItem = result as T;
      });

      it('should reject invalid data', async () => {
        const client = getTestClient();
        await client.init();
        const response = await client.post(getListPath(), {
          headers: createHeaders(),
          body: { invalid: 'data' },
        });
        await expectBADREQUEST(response);
      });

      it('should reject without auth', async () => {
        const client = getTestClient();
        await client.init();
        const response = await client.post(getListPath(), {
          body: createData,
        });
        await expectUNAUTHORIZED(response);
      });
    });

    describe('Read', () => {
      it('should list all ' + plural, async () => {
        const client = getTestClient();
        await client.init();
        const response = await client.get(getListPath());
        await expectOK(response);
        const body = response.body as { items?: T[]; data?: T[]; companies?: T[] };
        expect(Array.isArray(body.items || body.data || body.companies)).toBe(true);
      });

      it('should get a single ' + singular, async () => {
        const client = getTestClient();
        await client.init();
        if (!createdItem) {
          createdItem = (await client.post(getListPath(), {
            headers: createHeaders(),
            body: createData,
          })).body as T;
        }
        const id = getId(createdItem);
        const response = await client.get(getEntityPath(id));
        await expectOK(response);
      });

      it('should return 404 for non-existent ' + singular, async () => {
        const client = getTestClient();
        await client.init();
        const response = await client.get(getEntityPath('non-existent-id'));
        await expectNOTFOUND(response);
      });
    });

    describe('Update', () => {
      it('should update a ' + singular, async () => {
        const client = getTestClient();
        await client.init();
        if (!createdItem) {
          createdItem = (await client.post(getListPath(), {
            headers: createHeaders(),
            body: createData,
          })).body as T;
        }
        const id = getId(createdItem);
        const response = await client.put(getEntityPath(id), {
          headers: createHeaders(),
          body: updateData,
        });
        await expectOK(response);
      });

      it('should reject update without auth', async () => {
        const client = getTestClient();
        await client.init();
        if (!createdItem) return;
        const id = getId(createdItem);
        const response = await client.put(getEntityPath(id), {
          body: updateData,
        });
        await expectUNAUTHORIZED(response);
      });
    });

    describe('Delete', () => {
      it('should delete a ' + singular, async () => {
        const client = getTestClient();
        await client.init();
        if (!createdItem) {
          createdItem = (await client.post(getListPath(), {
            headers: createHeaders(),
            body: createData,
          })).body as T;
        }
        const id = getId(createdItem);
        const response = await client.delete(getEntityPath(id), {
          headers: createHeaders(),
        });
        await expectOK(response);

        const getResponse = await client.get(getEntityPath(id));
        await expectNOTFOUND(getResponse);
      });

      it('should reject delete without auth', async () => {
        const client = getTestClient();
        await client.init();
        if (!createdItem) return;
        const id = getId(createdItem);
        const response = await client.delete(getEntityPath(id));
        await expectUNAUTHORIZED(response);
      });
    });
  });
}

export function createPaginationTests(
  getListPath: () => string,
  createHeaders: () => Record<string, string> = createAdminHeaders
) {
  describe('Pagination', () => {
    it('should return paginated results with default pagination', async () => {
      const client = getTestClient();
      await client.init();
      const response = await client.get(getListPath(), { headers: createHeaders() });
      await expectOK(response);
    });

    it('should accept limit parameter', async () => {
      const client = getTestClient();
      await client.init();
      const response = await client.get(getListPath(), {
        headers: createHeaders(),
        query: { limit: '10' },
      });
      await expectOK(response);
    });

    it('should accept offset parameter', async () => {
      const client = getTestClient();
      await client.init();
      const response = await client.get(getListPath(), {
        headers: createHeaders(),
        query: { offset: '0' },
      });
      await expectOK(response);
    });

    it('should accept page parameter', async () => {
      const client = getTestClient();
      await client.init();
      const response = await client.get(getListPath(), {
        headers: createHeaders(),
        query: { page: '1' },
      });
      await expectOK(response);
    });
  });
}

export function createSortingTests(
  getListPath: () => string,
  createHeaders: () => Record<string, string> = createAdminHeaders
) {
  describe('Sorting', () => {
    it('should accept sort parameter', async () => {
      const client = getTestClient();
      await client.init();
      const response = await client.get(getListPath(), {
        headers: createHeaders(),
        query: { sort: 'createdAt' },
      });
      await expectOK(response);
    });

    it('should accept order parameter (asc/desc)', async () => {
      const client = getTestClient();
      await client.init();
      const response = await client.get(getListPath(), {
        headers: createHeaders(),
        query: { order: 'desc' },
      });
      await expectOK(response);
    });
  });
}

export function createFilteringTests(
  getListPath: () => string,
  filterableFields: string[],
  createHeaders: () => Record<string, string> = createAdminHeaders
) {
  describe('Filtering', () => {
    filterableFields.forEach((field) => {
      it(`should filter by ${field}`, async () => {
        const client = getTestClient();
        await client.init();
        const response = await client.get(getListPath(), {
          headers: createHeaders(),
          query: { [field]: 'test-value' },
        });
        await expectOK(response);
      });
    });
  });
}
