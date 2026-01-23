const fs = require('fs/promises');
const os = require('os');
const path = require('path');

jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

jest.mock('../../observability/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const waitForPath = async (targetPath, retries = 20, delayMs = 25) => {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      await fs.access(targetPath);
      return;
    } catch (_error) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Timed out waiting for ${targetPath}`);
};

describe('fileUpload initialization', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'upload-test-'));
    process.env.UPLOAD_PATH = tempDir;
    jest.resetModules();
  });

  afterEach(async () => {
    delete process.env.UPLOAD_PATH;
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test('creates upload directories under UPLOAD_PATH', async () => {
    require('../fileUpload');

    const blueprintsDir = path.join(tempDir, 'blueprints');
    await waitForPath(blueprintsDir);

    const stats = await fs.stat(blueprintsDir);
    expect(stats.isDirectory()).toBe(true);
  });
});
