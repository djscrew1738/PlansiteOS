const fs = require('fs/promises');
const path = require('path');

describe('repo configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('knexfile loads the repo .env', async () => {
    const knexfilePath = path.resolve(process.cwd(), '../../packages_temp/db/knexfile.js');
    const contents = await fs.readFile(knexfilePath, 'utf8');

    expect(contents).toContain("path.resolve(__dirname, '../../.env')");
  });

  test('frontend base URL fallback targets port 5001', async () => {
    const baseUrlPath = path.resolve(process.cwd(), '../../apps/web/src/api/baseUrl.js');
    const contents = await fs.readFile(baseUrlPath, 'utf8');

    expect(contents).toContain("VITE_API_URL || 'http://localhost:5001'");
  });

  test('frontend defaults no longer reference port 5000', async () => {
    const filesToCheck = [
      '../../apps/web/src/components/blueprints/BlueprintUpload.jsx',
      '../../apps/web/src/components/blueprints/BlueprintUpload.improved.jsx',
      '../../apps/web/src/pages/BlueprintDetail.jsx',
      '../../apps/web/src/pages/BlueprintDetail.improved.jsx',
      '../../apps/web/vite.config.js',
    ];

    await Promise.all(
      filesToCheck.map(async relativePath => {
        const filePath = path.resolve(process.cwd(), relativePath);
        const contents = await fs.readFile(filePath, 'utf8');
        expect(contents).not.toContain('localhost:5000');
      })
    );
  });

  test('uuid dependency stays on CommonJS-compatible major', async () => {
    const packagePath = path.resolve(process.cwd(), 'package.json');
    const contents = await fs.readFile(packagePath, 'utf8');
    const pkg = JSON.parse(contents);

    expect(pkg.dependencies.uuid).toMatch(/^(\^|~)?9\./);
  });
});
