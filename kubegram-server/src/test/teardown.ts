import { afterAll } from 'vitest';
import { closeDatabase } from './helpers/db';
import { clearMocks } from './mocks';

afterAll(async () => {
  await clearMocks();
  await closeDatabase();
});
