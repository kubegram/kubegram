export default {
    // Use the ESM preset for ts-jest
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',

    // Extensions to treat as ESM
    extensionsToTreatAsEsm: ['.ts'],

    // Module name mapping
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '\\.(graphql|gql)$': 'jest-transform-graphql',
    },

    // Transform settings
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
    },

    // Test patterns
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.ts',
        '<rootDir>/src/**/__tests__/**/*.test.js'
    ],

    // Coverage
    collectCoverage: true,
    coverageDirectory: 'coverage',

    // Misc
    verbose: true,
    testTimeout: 10000,
    rootDir: '.',
};
