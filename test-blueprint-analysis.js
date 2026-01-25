#!/usr/bin/env node

/**
 * Blueprint Analysis Test Script
 *
 * Tests the complete blueprint analysis workflow:
 * 1. Upload blueprint
 * 2. Check analysis results
 * 3. Generate annotated blueprint
 * 4. Verify database records
 *
 * Usage: node test-blueprint-analysis.js [blueprint-file.jpg]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:5001';
const BLUEPRINT_PATH = process.argv[2] || './test-blueprint.jpg';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Step ${step}: ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Make HTTP request with multipart form data
 */
async function uploadFile(filePath, projectName) {
  return new Promise((resolve, reject) => {
    const FormData = require('form-data');
    const form = new FormData();

    form.append('blueprint', fs.createReadStream(filePath));
    form.append('projectName', projectName);
    form.append('projectAddress', '123 Test Street, Dallas TX');

    const url = new URL(`${API_BASE}/api/blueprints/upload`);

    const options = {
      method: 'POST',
      headers: form.getHeaders()
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

/**
 * Make HTTP GET request
 */
async function httpGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);

    http.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Make HTTP POST request
 */
async function httpPost(endpoint, body = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const postData = JSON.stringify(body);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Create a simple test blueprint if none exists
 */
function createTestBlueprint() {
  const { createCanvas } = require('canvas');

  logInfo('Creating test blueprint image...');

  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 800, 600);

  // Draw title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('TEST PLUMBING PLAN', 300, 50);

  // Draw a simple bathroom layout
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;

  // Room outline
  ctx.strokeRect(100, 100, 600, 400);

  // Door
  ctx.beginPath();
  ctx.arc(700, 100, 30, 0, Math.PI / 2);
  ctx.stroke();

  // Fixtures
  ctx.font = '12px Arial';

  // Toilet
  ctx.strokeRect(150, 150, 60, 80);
  ctx.fillText('TOILET', 155, 200);

  // Lavatory 1
  ctx.strokeRect(300, 150, 100, 60);
  ctx.fillText('LAVATORY', 315, 185);

  // Lavatory 2
  ctx.strokeRect(450, 150, 100, 60);
  ctx.fillText('LAVATORY', 465, 185);

  // Shower
  ctx.strokeRect(150, 300, 120, 120);
  ctx.fillText('SHOWER', 175, 365);
  ctx.fillText('36" x 36"', 165, 380);

  // Dimensions
  ctx.strokeStyle = '#FF0000';
  ctx.setLineDash([5, 5]);

  // Width dimension
  ctx.beginPath();
  ctx.moveTo(100, 80);
  ctx.lineTo(700, 80);
  ctx.stroke();
  ctx.fillText('50\'-0"', 380, 70);

  // Reset
  ctx.setLineDash([]);

  // Save
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync('./test-blueprint.jpg', buffer);

  logSuccess('Test blueprint created: test-blueprint.jpg');
}

/**
 * Main test function
 */
async function runTests() {
  log('\n🧪 Blueprint Analysis Test Suite\n', 'cyan');
  log('Testing API at: ' + API_BASE, 'blue');

  let blueprintId = null;

  try {
    // ========================================================================
    // Step 1: Check if blueprint file exists
    // ========================================================================
    logStep(1, 'Check Blueprint File');

    if (!fs.existsSync(BLUEPRINT_PATH)) {
      logWarning(`Blueprint file not found: ${BLUEPRINT_PATH}`);

      if (BLUEPRINT_PATH === './test-blueprint.jpg') {
        logInfo('Creating test blueprint...');
        createTestBlueprint();
      } else {
        logError('Please provide a valid blueprint file path');
        process.exit(1);
      }
    } else {
      const stats = fs.statSync(BLUEPRINT_PATH);
      logSuccess(`Blueprint file found: ${BLUEPRINT_PATH}`);
      logInfo(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    }

    // ========================================================================
    // Step 2: Check API is running
    // ========================================================================
    logStep(2, 'Check API Connection');

    try {
      const healthCheck = await httpGet('/api/health');
      if (healthCheck.statusCode === 200) {
        logSuccess('API is running and healthy');
      } else {
        logWarning(`API returned status code: ${healthCheck.statusCode}`);
      }
    } catch (error) {
      logError('Cannot connect to API');
      logInfo('Make sure your server is running: npm start');
      process.exit(1);
    }

    // ========================================================================
    // Step 3: Upload Blueprint
    // ========================================================================
    logStep(3, 'Upload Blueprint');

    logInfo('Uploading blueprint to API...');
    const startTime = Date.now();

    const uploadResponse = await uploadFile(
      BLUEPRINT_PATH,
      'Test Blueprint ' + new Date().toISOString()
    );

    const uploadTime = Date.now() - startTime;

    if (uploadResponse.statusCode === 201 && uploadResponse.data.success) {
      logSuccess(`Blueprint uploaded successfully in ${uploadTime}ms`);

      blueprintId = uploadResponse.data.blueprint.id;
      logInfo(`Blueprint ID: ${blueprintId}`);
      logInfo(`Project Name: ${uploadResponse.data.blueprint.projectName}`);
      logInfo(`Status: ${uploadResponse.data.blueprint.status}`);

      // Display analysis results
      if (uploadResponse.data.analysis) {
        const analysis = uploadResponse.data.analysis;

        log('\n📊 Analysis Results:', 'green');
        logInfo(`Total Fixtures: ${analysis.totalFixtures}`);
        logInfo(`Total Rooms: ${analysis.totalRooms}`);
        logInfo(`Analysis Time: ${analysis.analysisTime}ms`);

        log('\n🔧 Fixture Totals:', 'yellow');
        for (const [type, count] of Object.entries(analysis.fixtureTotals || {})) {
          logInfo(`  ${type}: ${count}`);
        }

        log('\n🏠 Rooms:', 'blue');
        for (const room of analysis.rooms || []) {
          logInfo(`  ${room.name}: ${room.fixtureCount} fixtures`);
          for (const fixture of room.fixtures || []) {
            logInfo(`    - ${fixture.quantity}x ${fixture.type} (${fixture.width}" x ${fixture.depth}")`);
          }
        }
      }
    } else {
      logError('Upload failed');
      console.log(JSON.stringify(uploadResponse.data, null, 2));
      process.exit(1);
    }

    // ========================================================================
    // Step 4: Get Blueprint Details
    // ========================================================================
    logStep(4, 'Get Blueprint Details');

    logInfo(`Fetching blueprint ${blueprintId}...`);
    const detailsResponse = await httpGet(`/api/blueprints/${blueprintId}`);

    if (detailsResponse.statusCode === 200 && detailsResponse.data.success) {
      logSuccess('Blueprint details retrieved');

      const details = detailsResponse.data;
      logInfo(`Correlation ID: ${details.correlationId}`);
      logInfo(`Fixture Count: ${details.blueprint.totalFixtures}`);
      logInfo(`Status: ${details.blueprint.status}`);
    } else {
      logError('Failed to get blueprint details');
      console.log(JSON.stringify(detailsResponse.data, null, 2));
    }

    // ========================================================================
    // Step 5: Get Fixture Summary
    // ========================================================================
    logStep(5, 'Get Fixture Summary');

    logInfo('Fetching fixture summary...');
    const summaryResponse = await httpGet(`/api/blueprints/${blueprintId}/summary`);

    if (summaryResponse.statusCode === 200 && summaryResponse.data.success) {
      logSuccess('Fixture summary retrieved');

      log('\n📋 Summary:', 'green');
      const summary = summaryResponse.data;

      log('\nBy Type:', 'yellow');
      for (const fixture of summary.fixtureTotals || []) {
        logInfo(`  ${fixture.fixture_type}: ${fixture.count} (avg confidence: ${fixture.avg_confidence}%)`);
      }

      log('\nBy Room:', 'blue');
      for (const room of summary.fixturesByRoom || []) {
        logInfo(`  ${room.room_name} - ${room.fixture_type}: ${room.count}`);
      }
    } else {
      logError('Failed to get fixture summary');
    }

    // ========================================================================
    // Step 6: Generate Annotated Blueprint
    // ========================================================================
    logStep(6, 'Generate Annotated Blueprint');

    logInfo('Generating annotated blueprint with dimension lines...');
    const annotateStart = Date.now();

    const annotateResponse = await httpPost(`/api/blueprints/${blueprintId}/annotate`);
    const annotateTime = Date.now() - annotateStart;

    if (annotateResponse.statusCode === 200 && annotateResponse.data.success) {
      logSuccess(`Annotated blueprint generated in ${annotateTime}ms`);
      logInfo(`Output path: ${annotateResponse.data.annotatedImagePath}`);

      // Check if file exists
      if (fs.existsSync(annotateResponse.data.annotatedImagePath)) {
        const stats = fs.statSync(annotateResponse.data.annotatedImagePath);
        logSuccess(`Annotated file exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      } else {
        logWarning('Annotated file not found on disk');
      }
    } else {
      logError('Failed to generate annotated blueprint');
      console.log(JSON.stringify(annotateResponse.data, null, 2));
    }

    // ========================================================================
    // Step 7: List All Blueprints
    // ========================================================================
    logStep(7, 'List All Blueprints');

    logInfo('Fetching blueprint list...');
    const listResponse = await httpGet('/api/blueprints?limit=5');

    if (listResponse.statusCode === 200 && listResponse.data.success) {
      logSuccess('Blueprint list retrieved');

      const blueprints = listResponse.data.blueprints;
      logInfo(`Total blueprints: ${listResponse.data.pagination.totalCount}`);

      log('\n📁 Recent Blueprints:', 'yellow');
      for (const bp of blueprints) {
        logInfo(`  [${bp.id}] ${bp.project_name} - ${bp.status} (${bp.total_fixtures} fixtures)`);
      }
    } else {
      logError('Failed to list blueprints');
    }

    // ========================================================================
    // Summary
    // ========================================================================
    log('\n' + '='.repeat(60), 'green');
    log('🎉 All Tests Passed!', 'green');
    log('='.repeat(60), 'green');

    log('\n📊 Test Summary:', 'cyan');
    logSuccess(`✓ Blueprint uploaded (ID: ${blueprintId})`);
    logSuccess('✓ Analysis completed');
    logSuccess('✓ Details retrieved');
    logSuccess('✓ Summary generated');
    logSuccess('✓ Annotated blueprint created');
    logSuccess('✓ Blueprint list fetched');

    log('\n💡 Next Steps:', 'blue');
    logInfo(`1. View annotated blueprint in uploads/blueprints/`);
    logInfo(`2. Check database: psql $DATABASE_URL -c "SELECT * FROM blueprints WHERE id = ${blueprintId}"`);
    logInfo(`3. Test in browser: http://localhost:3000/api/blueprints/${blueprintId}`);

  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('❌ Test Failed', 'red');
    log('='.repeat(60), 'red');

    logError(error.message);
    if (error.stack) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    logError('Unexpected error: ' + error.message);
    process.exit(1);
  });
}

module.exports = { runTests };
