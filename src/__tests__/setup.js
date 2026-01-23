/**
 * Jest Test Setup
 *
 * This file runs before all tests and sets up the test environment.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ||
  'postgresql://plansite:plansite@localhost:5432/plansite_test';

// Suppress console output in tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test timeout
jest.setTimeout(10000);

// Mock external API calls by default
jest.mock('@anthropic-ai/sdk', () => {
  return {
    Anthropic: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: '```json\n{"summary": {"totalRooms": 2}}\n```'
          }]
        })
      }
    }))
  };
});

// Global afterAll - cleanup
afterAll(async () => {
  // Close database connections, etc.
  // await db.end();
});
