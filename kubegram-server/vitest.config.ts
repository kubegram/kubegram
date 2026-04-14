import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [path.resolve(__dirname, 'src/test/setup.ts')],
    teardownTimeout: 30_000,
    include: ['src/__tests__/**/*.test.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/__tests__/**',
        'src/test/**',
        'e2e/**',
        '*.config.ts',
      ],
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
