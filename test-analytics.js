#!/usr/bin/env node

/**
 * Analytics API Test Script
 * Tests the analytics endpoints to ensure they work correctly
 */

const http = require('http');

const API_BASE = process.env.API_URL || 'http://localhost:5000';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': `test-${Date.now()}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoint(name, path, validate) {
  try {
    log(`\n📝 Testing: ${name}`, 'blue');
    log(`   Endpoint: ${path}`, 'yellow');

    const response = await makeRequest(path);

    if (response.status !== 200) {
      log(`   ❌ Failed: HTTP ${response.status}`, 'red');
      console.log('   Response:', response.data);
      return false;
    }

    if (validate) {
      const validation = validate(response.data);
      if (!validation.valid) {
        log(`   ❌ Validation failed: ${validation.error}`, 'red');
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        return false;
      }
    }

    log(`   ✅ Success`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🚀 Starting Analytics API Tests\n', 'blue');
  log('='.repeat(60), 'blue');

  const tests = [
    {
      name: 'API Health Check',
      path: '/api/health',
      validate: (data) => {
        if (!data.status || data.status !== 'ok') {
          return { valid: false, error: 'Status is not ok' };
        }
        return { valid: true };
      }
    },
    {
      name: 'API V1 Info',
      path: '/api/v1',
      validate: (data) => {
        if (!data.endpoints || !data.endpoints.analytics) {
          return { valid: false, error: 'Analytics endpoint not listed' };
        }
        return { valid: true };
      }
    },
    {
      name: 'Analytics Dashboard Stats (last30days)',
      path: '/api/v1/analytics/stats?dateRange=last30days',
      validate: (data) => {
        const required = ['blueprints', 'analysis', 'fixtures', 'recentBlueprints'];
        for (const field of required) {
          if (!data[field]) {
            return { valid: false, error: `Missing field: ${field}` };
          }
        }

        if (typeof data.blueprints.total !== 'number') {
          return { valid: false, error: 'blueprints.total must be a number' };
        }

        if (typeof data.analysis.averageTime !== 'number') {
          return { valid: false, error: 'analysis.averageTime must be a number' };
        }

        if (typeof data.analysis.successRate !== 'number') {
          return { valid: false, error: 'analysis.successRate must be a number' };
        }

        if (!Array.isArray(data.recentBlueprints)) {
          return { valid: false, error: 'recentBlueprints must be an array' };
        }

        return { valid: true };
      }
    },
    {
      name: 'Analytics Dashboard Stats (last7days)',
      path: '/api/v1/analytics/stats?dateRange=last7days',
      validate: (data) => {
        if (!data.blueprints || !data.analysis || !data.fixtures) {
          return { valid: false, error: 'Missing required fields' };
        }
        return { valid: true };
      }
    },
    {
      name: 'Fixture Breakdown',
      path: '/api/v1/analytics/fixtures?dateRange=last30days',
      validate: (data) => {
        if (!data.fixtures || !Array.isArray(data.fixtures)) {
          return { valid: false, error: 'fixtures must be an array' };
        }
        if (typeof data.total !== 'number') {
          return { valid: false, error: 'total must be a number' };
        }
        return { valid: true };
      }
    },
    {
      name: 'Performance Metrics',
      path: '/api/v1/analytics/performance?dateRange=last30days',
      validate: (data) => {
        const required = ['totalAnalyses', 'successful', 'failed', 'successRate'];
        for (const field of required) {
          if (typeof data[field] !== 'number') {
            return { valid: false, error: `${field} must be a number` };
          }
        }
        return { valid: true };
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.path, test.validate);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 Test Summary:', 'blue');
  log(`   Total:  ${passed + failed}`, 'yellow');
  log(`   Passed: ${passed}`, 'green');
  log(`   Failed: ${failed}`, failed > 0 ? 'red' : 'yellow');

  if (failed === 0) {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Check the errors above.', 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
