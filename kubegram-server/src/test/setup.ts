import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Note: vitest loads .env.test automatically via vitest config

import { resetDatabase, loadFixtures, closeDatabase } from './helpers/db';
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

beforeEach(function () {
  vi.clearAllMocks();
});

afterEach(async function () {
  vi.resetAllMocks();
});
