/**
 * Jest Configuration for PlansiteOS Backend
 *
 * This configuration supports:
 * - Unit tests: src/__tests__/unit/
 * - Integration tests: src/__tests__/integration/
 * - Coverage reporting
 * - ES6 module support
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage thresholds (enforce minimum coverage)
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/__tests__/**',
    '!src/app.js', // Entry point - tested via integration
  ],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (ms)
  testTimeout: 10000,

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  // Transform (if using ES6 modules in future)
  // transform: {
  //   '^.+\\.js$': 'babel-jest',
  // },
};
