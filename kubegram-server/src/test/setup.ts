import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';

config({ path: '.env.test' });

import { db, resetDatabase, loadFixtures, closeDatabase } from './helpers/db';
import { clearMocks, setupGlobalMocks } from './mocks';

beforeAll(async () => {
  setupGlobalMocks();
  await resetDatabase();
  await loadFixtures();
});

afterAll(async () => {
  await clearMocks();
  await closeDatabase();
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(async () => {
  vi.resetAllMocks();
});
