# PlansiteOS Test Suite

This directory contains automated tests for the PlansiteOS backend.

## Test Structure

```
__tests__/
├── setup.js              # Test environment configuration
├── unit/                 # Unit tests (isolated components)
│   ├── CircuitBreaker.test.js
│   ├── BlueprintService.test.js
│   └── ...
├── integration/          # Integration tests (full flow)
│   ├── blueprint-upload.test.js
│   └── ...
└── fixtures/             # Test data and files
    ├── test-blueprint.pdf
    └── mock-data.json
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (Re-run on changes)
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

### Single Test File
```bash
npm test -- CircuitBreaker
```

## Writing Tests

### Unit Tests

Unit tests should test individual functions or classes in isolation.

```javascript
const MyClass = require('../../utils/MyClass');

describe('MyClass', () => {
  it('should do something', () => {
    const instance = new MyClass();
    expect(instance.method()).toBe(expectedValue);
  });
});
```

### Integration Tests

Integration tests should test complete API endpoints.

```javascript
const request = require('supertest');
const app = require('../../app');

describe('POST /api/endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Mocking

### Database
```javascript
jest.mock('../../config/database');
const mockDb = require('../../config/database');

mockDb.query = jest.fn().mockResolvedValue({ rows: [] });
```

### External APIs
```javascript
jest.mock('@anthropic-ai/sdk');
// Mock implementation in setup.js
```

## Test Coverage Goals

- **Lines:** 70%+
- **Functions:** 70%+
- **Branches:** 70%+
- **Statements:** 70%+

## Best Practices

1. **Arrange-Act-Assert:** Structure tests clearly
   ```javascript
   // Arrange
   const input = 'test';

   // Act
   const result = function(input);

   // Assert
   expect(result).toBe('expected');
   ```

2. **Use beforeEach/afterEach:** Clean up between tests
   ```javascript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Test edge cases:** Don't just test the happy path
   ```javascript
   it('should handle null input', () => {
     expect(() => function(null)).toThrow();
   });
   ```

4. **Keep tests isolated:** Each test should be independent
   - Don't rely on test execution order
   - Clean up after yourself
   - Use fresh data for each test

5. **Use descriptive names:** Test names should explain what they test
   ```javascript
   // Good
   it('should return 404 when blueprint does not exist', () => {});

   // Bad
   it('test1', () => {});
   ```

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every push to main/develop
- Before deployment

### CI Pipeline
1. Lint code
2. Run unit tests
3. Run integration tests
4. Generate coverage report
5. Fail if coverage < 70%

## Debugging Tests

### Run in debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### View verbose output
```bash
npm test -- --verbose
```

### Run specific test
```bash
npm test -- -t "should successfully upload"
```

## Common Issues

### Database connection errors
- Ensure test database is running
- Check `TEST_DATABASE_URL` in .env
- Use mocks for unit tests

### Timeout errors
```javascript
jest.setTimeout(10000); // Increase timeout
```

### Async issues
```javascript
// Use async/await
it('should handle async', async () => {
  await asyncFunction();
  expect(result).toBe(value);
});
```

## Adding New Tests

1. Create test file in appropriate directory
2. Follow naming convention: `*.test.js`
3. Import required modules
4. Write describe/it blocks
5. Run tests locally
6. Verify coverage hasn't decreased
7. Commit with tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
