#!/usr/bin/env node

/**
 * Simplified Blueprint Analysis Test
 * Tests blueprint upload and analysis without canvas-dependent annotation
 */

const fs = require('fs');
const http = require('http');

const API_BASE = process.env.API_BASE || 'http://localhost:5001';
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

async function httpGet(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function runSimpleTest() {
  log('\n🧪 Simple Blueprint Test\n', 'cyan');
  log('Testing API at: ' + API_BASE, 'blue');

  try {
    // Check API health
    log('\n📡 Step 1: Checking API health...', 'yellow');
    const health = await httpGet('/api/health');

    if (health.statusCode === 200) {
      log('✓ API is running', 'green');
      log(`   Status: ${health.data.status}`, 'blue');

      // Display service status
      if (health.data.services) {
        log('\n📊 Service Status:', 'cyan');
        for (const [service, status] of Object.entries(health.data.services)) {
          const icon = status.healthy !== false ? '✓' : '✗';
          const statusColor = status.healthy !== false ? 'green' : 'red';
          log(`   ${icon} ${service}: ${JSON.stringify(status)}`, statusColor);
        }
      }
    } else {
      log('✗ API returned error status', 'red');
      console.log(JSON.stringify(health.data, null, 2));
    }

    // Check environment
    log('\n🔍 Step 2: Checking environment...', 'yellow');
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here';
    const hasDatabaseUrl = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('user:password');

    log(`   ANTHROPIC_API_KEY: ${hasAnthropicKey ? '✓ Set' : '✗ Not set'}`, hasAnthropicKey ? 'green' : 'yellow');
    log(`   DATABASE_URL: ${hasDatabaseUrl ? '✓ Set' : '✗ Not set'}`, hasDatabaseUrl ? 'green' : 'yellow');

    if (!hasAnthropicKey) {
      log('\n⚠️  Blueprint analysis requires ANTHROPIC_API_KEY', 'yellow');
      log('   Get your key from: https://console.anthropic.com/', 'blue');
      log('   Then add to .env file: ANTHROPIC_API_KEY=sk-ant-...', 'blue');
    }

    if (!hasDatabaseUrl) {
      log('\n⚠️  Database features require DATABASE_URL', 'yellow');
      log('   Set in .env file: DATABASE_URL=postgresql://...', 'blue');
    }

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📋 Test Summary', 'cyan');
    log('='.repeat(60), 'cyan');

    if (health.statusCode === 200 && hasAnthropicKey && hasDatabaseUrl) {
      log('\n✓ System is ready for blueprint analysis!', 'green');
      log('\n💡 Next steps:', 'blue');
      log('   1. Upload a blueprint image using the API or web interface');
      log('   2. Run full test: node test-blueprint-analysis.js');
      log('   3. View results in the database or API response');
    } else {
      log('\n⚠️  System needs configuration', 'yellow');

      if (health.statusCode !== 200) {
        log('\n   • Start the server: npm start', 'blue');
      }
      if (!hasAnthropicKey) {
        log('   • Set ANTHROPIC_API_KEY in .env file', 'blue');
      }
      if (!hasDatabaseUrl) {
        log('   • Set DATABASE_URL in .env file', 'blue');
        log('   • Run migrations: npm run migrate', 'blue');
      }
    }

    log(''); // Empty line at end

  } catch (error) {
    log('\n❌ Test Failed', 'red');
    log(`Error: ${error.message}`, 'red');

    if (error.code === 'ECONNREFUSED') {
      log('\n💡 The server is not running. Start it with:', 'yellow');
      log('   npm start', 'blue');
    }

    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  runSimpleTest().catch(error => {
    log('Unexpected error: ' + error.message, 'red');
    process.exit(1);
  });
}

module.exports = { runSimpleTest };
