export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',

  // Extensions to treat as ESM
  extensionsToTreatAsEsm: ['.ts'],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform settings
  transform: {
    '^.+\.tsx?$': ['ts-jest', { useESM: true }],
  },

  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    '<rootDir>/src/**/__tests__/**/*.test.js',
  ],

  // Coverage
  collectCoverageFrom: ['src/__tests__'],
  coverageDirectory: 'coverage',

  // Misc
  verbose: true,
  testTimeout: 10000,
  rootDir: '.',
};
