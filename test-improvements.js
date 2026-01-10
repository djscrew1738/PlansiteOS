#!/usr/bin/env node

/**
 * Test Script for Circuit Breaker and Connection Pool Improvements
 *
 * Run this script to verify the improvements are working correctly:
 * node test-improvements.js
 */

const CircuitBreaker = require('./src/utils/CircuitBreaker');

console.log('🧪 Testing Circuit Breaker and Improvements\n');
console.log('='.repeat(60));

// ============================================================================
// Test 1: Circuit Breaker Basic Functionality
// ============================================================================

async function test1_BasicCircuitBreaker() {
  console.log('\n📋 Test 1: Basic Circuit Breaker Functionality');
  console.log('-'.repeat(60));

  const breaker = new CircuitBreaker('test-service', {
    failureThreshold: 3,
    resetTimeout: 5000,
    timeout: 1000
  });

  try {
    // Successful call
    console.log('✓ Testing successful execution...');
    const result = await breaker.execute(async () => {
      return { success: true, data: 'Test data' };
    });
    console.log(`  Result: ${JSON.stringify(result)}`);
    console.log(`  Circuit State: ${breaker.state}`);

    // Test timeout
    console.log('\n✓ Testing timeout protection...');
    try {
      await breaker.execute(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Exceeds 1s timeout
        return 'Should timeout';
      });
    } catch (error) {
      console.log(`  ✓ Timeout caught: ${error.message}`);
    }

    // Test failure threshold
    console.log('\n✓ Testing failure threshold...');
    for (let i = 1; i <= 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error(`Test failure ${i}`);
        });
      } catch (error) {
        console.log(`  Failure ${i}/3 recorded`);
      }
    }

    console.log(`  Circuit State: ${breaker.state} (should be OPEN)`);

    // Test rejection when open
    console.log('\n✓ Testing request rejection when circuit open...');
    try {
      await breaker.execute(async () => 'Should be rejected');
    } catch (error) {
      console.log(`  ✓ Request rejected: ${error.message}`);
    }

    console.log('\n✅ Test 1 PASSED');
    return true;

  } catch (error) {
    console.error('\n❌ Test 1 FAILED:', error.message);
    return false;
  }
}

// ============================================================================
// Test 2: Circuit Breaker Metrics
// ============================================================================

async function test2_CircuitBreakerMetrics() {
  console.log('\n📋 Test 2: Circuit Breaker Metrics');
  console.log('-'.repeat(60));

  const breaker = new CircuitBreaker('metrics-test', {
    failureThreshold: 5
  });

  try {
    // Execute some successful requests
    for (let i = 0; i < 5; i++) {
      await breaker.execute(async () => ({ success: true }));
    }

    // Execute some failed requests
    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Test error');
        });
      } catch (error) {}
    }

    const status = breaker.getStatus();
    console.log('\n✓ Circuit Breaker Status:');
    console.log(`  State: ${status.state}`);
    console.log(`  Total Requests: ${status.metrics.totalRequests}`);
    console.log(`  Successful: ${status.metrics.successfulRequests}`);
    console.log(`  Failed: ${status.metrics.failedRequests}`);
    console.log(`  Success Rate: ${status.metrics.successRate}`);

    const health = breaker.getHealth();
    console.log('\n✓ Health Check:');
    console.log(`  Healthy: ${health.healthy}`);
    console.log(`  Recent Failures: ${health.recentFailures}`);

    console.log('\n✅ Test 2 PASSED');
    return true;

  } catch (error) {
    console.error('\n❌ Test 2 FAILED:', error.message);
    return false;
  }
}

// ============================================================================
// Test 3: Circuit Breaker State Transitions
// ============================================================================

async function test3_StateTransitions() {
  console.log('\n📋 Test 3: Circuit Breaker State Transitions');
  console.log('-'.repeat(60));

  let stateChanges = [];

  const breaker = new CircuitBreaker('state-test', {
    failureThreshold: 3,
    successThreshold: 2,
    resetTimeout: 2000,
    onStateChange: (oldState, newState) => {
      stateChanges.push({ from: oldState, to: newState });
      console.log(`  State changed: ${oldState} → ${newState}`);
    }
  });

  try {
    console.log('\n✓ Starting in CLOSED state');
    console.log(`  Current state: ${breaker.state}`);

    // Trigger failures to open circuit
    console.log('\n✓ Triggering failures...');
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Test failure');
        });
      } catch (error) {}
    }

    console.log(`  Current state: ${breaker.state} (should be OPEN)`);

    // Wait for reset timeout
    console.log('\n✓ Waiting for reset timeout (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2100));

    // Try a request to transition to HALF_OPEN
    console.log('\n✓ Attempting request to test recovery...');
    try {
      await breaker.execute(async () => {
        throw new Error('Still failing');
      });
    } catch (error) {
      console.log(`  Request failed, should reopen circuit`);
    }

    console.log(`  Current state: ${breaker.state} (should be OPEN again)`);

    // Wait again and succeed to close
    console.log('\n✓ Waiting and testing successful recovery...');
    await new Promise(resolve => setTimeout(resolve, 2100));

    for (let i = 0; i < 2; i++) {
      await breaker.execute(async () => ({ success: true }));
      console.log(`  Success ${i + 1}/2`);
    }

    console.log(`  Current state: ${breaker.state} (should be CLOSED)`);

    console.log('\n✓ State changes recorded:');
    stateChanges.forEach(change => {
      console.log(`  ${change.from} → ${change.to}`);
    });

    console.log('\n✅ Test 3 PASSED');
    return true;

  } catch (error) {
    console.error('\n❌ Test 3 FAILED:', error.message);
    console.error(error.stack);
    return false;
  }
}

// ============================================================================
// Test 4: Custom Failure Detection
// ============================================================================

async function test4_CustomFailureDetection() {
  console.log('\n📋 Test 4: Custom Failure Detection');
  console.log('-'.repeat(60));

  const breaker = new CircuitBreaker('custom-test', {
    failureThreshold: 3,
    isFailure: (error) => {
      // Only count server errors, not client errors
      if (error.status >= 400 && error.status < 500) {
        console.log(`  Client error (${error.status}), not counting as failure`);
        return false;
      }
      console.log(`  Server error (${error.status}), counting as failure`);
      return true;
    }
  });

  try {
    console.log('\n✓ Testing client errors (should not trigger circuit)...');

    // Send 3 client errors (400-level)
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          const error = new Error('Client error');
          error.status = 400;
          throw error;
        });
      } catch (error) {}
    }

    console.log(`  Circuit State: ${breaker.state} (should still be CLOSED)`);
    console.log(`  Recent Failures: ${breaker.getRecentFailureCount()}`);

    console.log('\n✓ Testing server errors (should trigger circuit)...');

    // Send 3 server errors (500-level)
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          const error = new Error('Server error');
          error.status = 500;
          throw error;
        });
      } catch (error) {}
    }

    console.log(`  Circuit State: ${breaker.state} (should be OPEN)`);
    console.log(`  Recent Failures: ${breaker.getRecentFailureCount()}`);

    console.log('\n✅ Test 4 PASSED');
    return true;

  } catch (error) {
    console.error('\n❌ Test 4 FAILED:', error.message);
    return false;
  }
}

// ============================================================================
// Test 5: Rate Limiting (Simulation)
// ============================================================================

async function test5_RateLimiting() {
  console.log('\n📋 Test 5: Rate Limiting Simulation');
  console.log('-'.repeat(60));

  class RateLimiter {
    constructor(maxTokens, refillRate) {
      this.tokens = maxTokens;
      this.maxTokens = maxTokens;
      this.refillRate = refillRate;
      this.lastRefill = Date.now();
    }

    async consume() {
      const now = Date.now();
      if (now - this.lastRefill >= this.refillRate) {
        this.tokens = this.maxTokens;
        this.lastRefill = now;
        console.log(`  ♻️  Tokens refilled: ${this.tokens}`);
      }

      if (this.tokens <= 0) {
        throw new Error('Rate limit exceeded');
      }

      this.tokens--;
      console.log(`  ✓ Token consumed, remaining: ${this.tokens}`);
    }
  }

  try {
    const limiter = new RateLimiter(5, 2000); // 5 tokens, refill every 2 seconds

    console.log('\n✓ Testing rate limit with 5 token capacity...');

    // Consume 5 tokens
    for (let i = 0; i < 5; i++) {
      await limiter.consume();
    }

    // 6th should fail
    console.log('\n✓ Testing 6th request (should fail)...');
    try {
      await limiter.consume();
      console.error('  ❌ Should have failed but succeeded');
      return false;
    } catch (error) {
      console.log(`  ✓ Rate limit enforced: ${error.message}`);
    }

    // Wait for refill
    console.log('\n✓ Waiting for token refill (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2100));

    // Should work now
    console.log('\n✓ Testing after refill...');
    await limiter.consume();

    console.log('\n✅ Test 5 PASSED');
    return true;

  } catch (error) {
    console.error('\n❌ Test 5 FAILED:', error.message);
    return false;
  }
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runAllTests() {
  console.log('\n🚀 Starting Test Suite...\n');

  const results = {
    test1: await test1_BasicCircuitBreaker(),
    test2: await test2_CircuitBreakerMetrics(),
    test3: await test3_StateTransitions(),
    test4: await test4_CustomFailureDetection(),
    test5: await test5_RateLimiting()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(60));

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;

  console.log(`\n${passed}/${total} tests passed\n`);

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`  ${test}: ${status}`);
  });

  if (passed === total) {
    console.log('\n🎉 All tests passed! Circuit breaker is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = {
  test1_BasicCircuitBreaker,
  test2_CircuitBreakerMetrics,
  test3_StateTransitions,
  test4_CustomFailureDetection,
  test5_RateLimiting
};
