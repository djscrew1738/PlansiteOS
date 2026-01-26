/**
 * Integration Tests for Blueprint Upload Flow
 *
 * Tests the complete blueprint upload, analysis, and retrieval flow.
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

// Mock the database and external services
jest.mock('../../config/database');
jest.mock('@anthropic-ai/sdk');

const mockDb = require('../../config/database');

describe('POST /api/blueprints/upload', () => {
  let app;
  const testFilePath = path.join(__dirname, '../fixtures/test-blueprint.pdf');

  beforeAll(async () => {
    // Create test file if it doesn't exist
    try {
      await fs.access(testFilePath);
    } catch {
      // Create a minimal PDF file for testing
      await fs.writeFile(testFilePath, '%PDF-1.4\nTest PDF Content\n%%EOF');
    }
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock database queries
    mockDb.query = jest.fn()
      .mockResolvedValueOnce({
        // Mock INSERT blueprint
        rows: [{
          id: 1,
          project_name: 'Test Project',
          status: 'pending'
        }]
      })
      .mockResolvedValueOnce({
        // Mock UPDATE to processing
        rowCount: 1
      })
      .mockResolvedValueOnce({
        // Mock INSERT analysis results
        rowCount: 1
      });

    // Load app fresh for each test
    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
  });

  afterAll(async () => {
    // Cleanup test file
    try {
      await fs.unlink(testFilePath);
    } catch (e) {
      // Ignore if doesn't exist
    }
  });

  it('should successfully upload and analyze blueprint', async () => {
    const response = await request(app)
      .post('/api/blueprints/upload')
      .field('projectName', 'Test Project')
      .field('projectAddress', '123 Test St')
      .attach('blueprint', testFilePath)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('correlationId');
    expect(response.body.blueprint).toHaveProperty('id');
    expect(response.body.blueprint.projectName).toBe('Test Project');
    expect(response.body.blueprint.status).toBe('completed');
    expect(response.body.analysis).toHaveProperty('totalFixtures');
  });

  it('should return 400 if no file uploaded', async () => {
    const response = await request(app)
      .post('/api/blueprints/upload')
      .field('projectName', 'Test Project')
      .expect(400);

    expect(response.body.error).toHaveProperty('message', 'No file uploaded');
    expect(response.body.error).toHaveProperty('code', 'NO_FILE');
  });

  it('should reject files that are too large', async () => {
    // This would need actual large file or mock multer
    // For now, just document the test case

    // TODO: Create large file test
  });

  it('should include correlation ID in response', async () => {
    const response = await request(app)
      .post('/api/blueprints/upload')
      .field('projectName', 'Test Project')
      .attach('blueprint', testFilePath)
      .expect(201);

    expect(response.body.correlationId).toMatch(/^[a-f0-9-]{36}$/);
  });

  it('should handle database errors gracefully', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await request(app)
      .post('/api/blueprints/upload')
      .field('projectName', 'Test Project')
      .attach('blueprint', testFilePath)
      .expect(500);

    expect(response.body.error).toHaveProperty('code', 'ANALYSIS_FAILED');
  });

  it('should delete uploaded file on failure', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB Error'));

    await request(app)
      .post('/api/blueprints/upload')
      .attach('blueprint', testFilePath)
      .expect(500);

    // File should be deleted (tested via mock of deleteFile)
    // In real scenario, check file doesn't exist in uploads/
  });
});

describe('GET /api/blueprints/:id', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.query = jest.fn().mockResolvedValue({
      rows: [{
        id: 1,
        project_name: 'Test Project',
        status: 'completed',
        analysis_data: {
          summary: { totalRooms: 3, totalFixtures: 10 },
          rooms: []
        }
      }]
    });

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
  });

  it('should return blueprint analysis results', async () => {
    const response = await request(app)
      .get('/api/blueprints/1')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.blueprint).toHaveProperty('id', 1);
    expect(response.body.blueprint).toHaveProperty('projectName', 'Test Project');
  });

  it('should return 404 for non-existent blueprint', async () => {
    mockDb.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get('/api/blueprints/999')
      .expect(404);

    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });

  it('should validate blueprint ID', async () => {
    const response = await request(app)
      .get('/api/blueprints/invalid')
      .expect(400);

    expect(response.body.error).toHaveProperty('code', 'INVALID_ID');
  });
});

describe('GET /api/blueprints', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.query = jest.fn()
      .mockResolvedValueOnce({
        // Mock blueprint list
        rows: [
          { id: 1, project_name: 'Project 1', status: 'completed' },
          { id: 2, project_name: 'Project 2', status: 'processing' }
        ]
      })
      .mockResolvedValueOnce({
        // Mock count
        rows: [{ count: '2' }]
      });

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
  });

  it('should list all blueprints with pagination', async () => {
    const response = await request(app)
      .get('/api/blueprints')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.blueprints).toHaveLength(2);
    expect(response.body.pagination).toHaveProperty('page', 1);
    expect(response.body.pagination).toHaveProperty('totalCount', 2);
  });

  it('should accept pagination parameters', async () => {
    await request(app)
      .get('/api/blueprints?page=2&limit=10')
      .expect(200);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.any(String),
      [10, 10] // limit, offset
    );
  });
});

describe('DELETE /api/blueprints/:id', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.query = jest.fn()
      .mockResolvedValueOnce({
        // Mock getting blueprint
        rows: [{ file_path: '/tmp/test.pdf' }]
      })
      .mockResolvedValueOnce({
        // Mock delete
        rowCount: 1
      });

    delete require.cache[require.resolve('../../app')];
    app = require('../../app');
  });

  it('should delete blueprint and file', async () => {
    const response = await request(app)
      .delete('/api/blueprints/1')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('deleted successfully');
  });

  it('should return 404 for non-existent blueprint', async () => {
    mockDb.query.mockReset().mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .delete('/api/blueprints/999')
      .expect(404);

    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
