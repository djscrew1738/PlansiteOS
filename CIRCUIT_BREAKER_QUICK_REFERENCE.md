# Circuit Breaker Quick Reference

## What is a Circuit Breaker?

A design pattern that prevents cascading failures by detecting when an external service is failing and temporarily blocking requests to it.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  CLOSED (Normal) ──[5 failures]──> OPEN        │
│       ↑                              │          │
│       │                              │          │
│  [2 successes]                  [wait 60s]     │
│       │                              │          │
│       └───── HALF_OPEN <─────────────┘          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Quick Usage

### Basic Example

```javascript
const CircuitBreaker = require('./utils/CircuitBreaker');

const breaker = new CircuitBreaker('my-api', {
  failureThreshold: 5,
  resetTimeout: 60000
});

try {
  const result = await breaker.execute(async () => {
    return await externalAPI.call();
  });
} catch (error) {
  if (error.code === 'CIRCUIT_OPEN') {
    // Circuit is open, service is down
    return fallbackResponse();
  }
  throw error;
}
```

---

## Configuration Options

```javascript
new CircuitBreaker('service-name', {
  // Required failures before opening
  failureThreshold: 5,

  // Required successes in HALF_OPEN to close
  successThreshold: 2,

  // Time to wait before trying again (ms)
  resetTimeout: 60000,

  // Request timeout (ms)
  timeout: 30000,

  // Rolling window for counting failures (ms)
  monitoringPeriod: 120000,

  // Callback when state changes
  onStateChange: (oldState, newState, breaker) => {
    console.log(`${oldState} -> ${newState}`);
  },

  // Custom function to determine if error counts as failure
  isFailure: (error) => {
    return error.status >= 500;
  }
});
```

---

## State Transitions

### CLOSED → OPEN
- Happens when failures reach threshold
- All requests immediately rejected
- Fast-fail to prevent resource waste

### OPEN → HALF_OPEN
- Happens after reset timeout expires
- Single request allowed through to test recovery
- If successful, moves toward CLOSED

### HALF_OPEN → CLOSED
- Happens after success threshold reached
- Normal operation resumes
- Failure counters reset

### HALF_OPEN → OPEN
- Any failure in HALF_OPEN reopens circuit
- Protects against premature recovery

---

## Status & Monitoring

### Check Circuit Status

```javascript
const status = breaker.getStatus();
console.log(status);
/*
{
  name: 'twilio-api',
  state: 'CLOSED',
  isOpen: false,
  nextAttemptTime: null,
  recentFailures: 0,
  metrics: {
    totalRequests: 100,
    successfulRequests: 98,
    failedRequests: 2,
    rejectedRequests: 0,
    successRate: '98.00%'
  }
}
*/
```

### Health Check

```javascript
const health = breaker.getHealth();
console.log(health);
/*
{
  healthy: true,
  state: 'CLOSED',
  degraded: false,
  down: false,
  recentFailures: 0
}
*/
```

---

## Common Patterns

### With Fallback

```javascript
async function sendNotification(message) {
  try {
    return await breaker.execute(() => smsService.send(message));
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      // Fallback to email
      return await emailService.send(message);
    }
    throw error;
  }
}
```

### With Retry

```javascript
async function callWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await breaker.execute(fn);
    } catch (error) {
      if (error.code === 'CIRCUIT_OPEN') {
        // Don't retry if circuit is open
        throw error;
      }
      if (i === retries - 1) throw error;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

### With Caching

```javascript
const cache = new Map();

async function fetchWithCache(key) {
  // Check cache first
  if (cache.has(key)) {
    return cache.get(key);
  }

  try {
    const result = await breaker.execute(() => api.fetch(key));
    cache.set(key, result);
    return result;
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      // Return stale cache if available
      return cache.get(key) || null;
    }
    throw error;
  }
}
```

---

## Integration Examples

### Express Middleware

```javascript
function circuitBreakerMiddleware(breaker) {
  return async (req, res, next) => {
    if (breaker.state === 'OPEN') {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        code: 'CIRCUIT_OPEN',
        retry_after: Math.ceil(
          (breaker.nextAttemptTime - Date.now()) / 1000
        )
      });
    }
    next();
  };
}

app.use('/api/external', circuitBreakerMiddleware(externalApiBreaker));
```

### Bull Queue (Job Processing)

```javascript
queue.process(async (job) => {
  try {
    return await breaker.execute(async () => {
      return await processJob(job.data);
    });
  } catch (error) {
    if (error.code === 'CIRCUIT_OPEN') {
      // Reschedule job for later
      throw new Error('Service unavailable, will retry');
    }
    throw error;
  }
});
```

---

## Troubleshooting

### Circuit Opens Too Often

**Problem:** Circuit opens frequently even for transient errors

**Solution:**
```javascript
// Increase threshold
failureThreshold: 10  // was 5

// Increase monitoring period
monitoringPeriod: 300000  // 5 minutes instead of 2

// Customize failure detection
isFailure: (error) => {
  // Don't count client errors (4xx)
  if (error.status >= 400 && error.status < 500) {
    return false;
  }
  // Only count server errors (5xx) and network issues
  return error.status >= 500 ||
         error.code === 'ETIMEDOUT' ||
         error.code === 'ECONNREFUSED';
}
```

### Circuit Stays Open Too Long

**Problem:** Service recovered but circuit still open

**Solution:**
```javascript
// Reduce reset timeout
resetTimeout: 30000  // 30 seconds instead of 60

// Reduce success threshold
successThreshold: 1  // Close after 1 success instead of 2
```

### Not Enough Failures Trigger Circuit

**Problem:** Service degraded but circuit doesn't open

**Solution:**
```javascript
// Decrease threshold
failureThreshold: 3  // was 5

// Decrease monitoring period
monitoringPeriod: 60000  // 1 minute instead of 2

// Adjust timeout to catch slow responses
timeout: 10000  // 10 seconds instead of 30
```

---

## Best Practices

### ✅ DO

- Use circuit breakers for **all external services** (APIs, databases, message queues)
- Set **reasonable thresholds** based on service SLA
- Implement **fallback strategies** when circuit opens
- **Monitor circuit states** and alert on opens
- **Log state transitions** for debugging
- Use **different breakers** for different services
- **Test circuit breaker behavior** in staging

### ❌ DON'T

- Don't use circuit breakers for **internal function calls**
- Don't set thresholds **too low** (causes false positives)
- Don't **ignore CIRCUIT_OPEN errors** without handling
- Don't use **same circuit breaker** for different services
- Don't **manually open/close** circuits in production (except emergencies)
- Don't forget to **exclude client errors** from failure count

---

## Metrics to Track

### Key Metrics

```javascript
// Track in monitoring system (Prometheus, Datadog, etc.)
{
  // State tracking
  'circuit.state': 'closed|open|half_open',
  'circuit.is_open': 0|1,

  // Request metrics
  'circuit.requests.total': counter,
  'circuit.requests.successful': counter,
  'circuit.requests.failed': counter,
  'circuit.requests.rejected': counter,

  // Rates
  'circuit.success_rate': gauge,
  'circuit.failure_rate': gauge,
  'circuit.rejection_rate': gauge,

  // State changes
  'circuit.state_changes.total': counter,
  'circuit.opens.total': counter,
  'circuit.closes.total': counter,

  // Failures
  'circuit.recent_failures': gauge,
  'circuit.failure_threshold': gauge
}
```

### Alerting Rules

```yaml
# Alert when circuit opens
- alert: CircuitBreakerOpen
  expr: circuit_is_open == 1
  for: 1m
  severity: critical
  annotations:
    summary: "Circuit breaker {{ $labels.name }} is OPEN"

# Alert on high rejection rate
- alert: HighCircuitRejectionRate
  expr: rate(circuit_requests_rejected[5m]) > 0.5
  for: 2m
  severity: warning
  annotations:
    summary: "Circuit {{ $labels.name }} rejecting > 50% of requests"

# Alert on frequent state changes
- alert: CircuitBreakerFlapping
  expr: rate(circuit_state_changes_total[5m]) > 0.1
  for: 5m
  severity: warning
  annotations:
    summary: "Circuit {{ $labels.name }} changing state frequently"
```

---

## Testing

### Unit Test

```javascript
describe('CircuitBreaker', () => {
  it('opens after threshold failures', async () => {
    const breaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      resetTimeout: 1000
    });

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Service error');
        });
      } catch (error) {}
    }

    // Should be open
    expect(breaker.state).toBe('OPEN');

    // Next request should be rejected
    await expect(
      breaker.execute(async () => 'test')
    ).rejects.toThrow('Circuit breaker is OPEN');
  });
});
```

### Integration Test

```javascript
describe('NotificationService with Circuit Breaker', () => {
  it('handles Twilio outage gracefully', async () => {
    // Mock Twilio to fail
    twilioMock.messages.create.mockRejectedValue(
      new Error('Service unavailable')
    );

    // Try sending 5 messages
    for (let i = 0; i < 5; i++) {
      try {
        await NotificationService.sendSMS('test');
      } catch (error) {}
    }

    // Circuit should be open
    const health = NotificationService.getHealth();
    expect(health.circuitBreaker.state).toBe('OPEN');

    // Next send should fail fast
    const start = Date.now();
    try {
      await NotificationService.sendSMS('test');
    } catch (error) {
      expect(error.code).toBe('CIRCUIT_OPEN');
    }
    const duration = Date.now() - start;

    // Should fail in < 10ms (fast-fail)
    expect(duration).toBeLessThan(10);
  });
});
```

---

## Resources

- [Martin Fowler - Circuit Breaker](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Netflix Hystrix Documentation](https://github.com/Netflix/Hystrix/wiki)
- [Release It! by Michael Nygard](https://pragprog.com/titles/mnee2/release-it-second-edition/)

---

## Quick Commands

```bash
# Check circuit breaker status
curl http://localhost:3000/health | jq '.services[].circuitState'

# Monitor circuit breaker in logs
tail -f logs/combined.log | grep "circuit breaker"

# Reset circuit breaker (emergency only)
curl -X POST http://localhost:3000/admin/circuit/reset \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"service": "twilio-api"}'

# Get metrics
curl http://localhost:3000/metrics | grep circuit_
```
