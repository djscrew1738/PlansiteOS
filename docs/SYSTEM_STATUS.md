# System Status Monitoring

Comprehensive health monitoring and status reporting for PlansiteOS.

## Overview

The System Status feature provides real-time monitoring of all critical services:
- **API Server** - Core service health and uptime
- **Database** - PostgreSQL connection and statistics
- **AI Service** - Claude API configuration and availability
- **Blueprints** - Analysis engine and processing queue

## Architecture

```
SystemStatusService
├── Periodic Health Checks (every 30s)
├── Status Caching
└── Individual Service Monitors
    ├── API Server (uptime, memory)
    ├── Database (connection, pool stats)
    ├── AI Service (API key validation)
    └── Blueprints (queue statistics)
```

## API Endpoints

### 1. Health Check (Simple)

**GET** `/api/health`

Quick health check for load balancers and monitoring systems.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "uptime": "2h 15m 30s",
  "services": {
    "database": "healthy",
    "ai": "healthy",
    "blueprints": "healthy"
  }
}
```

**Status Codes:**
- `200` - System is healthy
- `503` - System is unhealthy

---

### 2. Full System Status

**GET** `/api/status`

Comprehensive system status with detailed metrics.

**Response:**
```json
{
  "success": true,
  "correlationId": "a1b2c3d4-...",
  "overall": "healthy",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "services": {
    "api": {
      "status": "healthy",
      "name": "API Server",
      "description": "Core service",
      "uptime": 8130,
      "uptimeHuman": "2h 15m 30s",
      "memory": {
        "rss": 145,
        "heapUsed": 89,
        "heapTotal": 120
      },
      "nodeVersion": "v18.19.0",
      "lastCheck": "2026-01-23T10:30:00.000Z"
    },
    "database": {
      "status": "healthy",
      "name": "PostgreSQL",
      "description": "Database",
      "responseTime": "12ms",
      "connection": "connected",
      "pool": {
        "totalCount": 10,
        "idleCount": 8,
        "waitingCount": 0
      },
      "database": {
        "size": "45 MB",
        "tables": {
          "blueprints": 23,
          "rooms": 145,
          "fixtures": 487
        }
      },
      "lastCheck": "2026-01-23T10:30:00.000Z"
    },
    "ai": {
      "status": "healthy",
      "name": "Claude Vision",
      "description": "AI Service",
      "configured": true,
      "model": "claude-3-5-sonnet-20241022",
      "circuitBreaker": {
        "state": "CLOSED",
        "failures": 0,
        "successCount": 42,
        "failureCount": 2
      },
      "lastCheck": "2026-01-23T10:30:00.000Z"
    },
    "blueprints": {
      "status": "healthy",
      "name": "Blueprints",
      "description": "Analysis engine",
      "initialized": true,
      "statistics": {
        "total": 23,
        "pending": 2,
        "processing": 1,
        "completed": 18,
        "failed": 2
      },
      "backlog": "Normal",
      "lastCheck": "2026-01-23T10:30:00.000Z"
    }
  }
}
```

**Status Values:**
- `healthy` - Service operating normally
- `degraded` - Service operational but with issues
- `warning` - Service has non-critical issues
- `unhealthy` - Service is down or critically impaired
- `not_configured` - Service not configured (AI only)
- `error` - Service error occurred

---

### 3. Quick Status (Cached)

**GET** `/api/status/quick`

Returns cached status without performing checks. Fast response.

**Use Case:** Frequent polling without impacting performance

**Response:** Same as `/api/status` but from cache

---

### 4. Database Status

**GET** `/api/status/database`

Detailed database health and statistics.

**Response:**
```json
{
  "success": true,
  "correlationId": "...",
  "status": "healthy",
  "name": "PostgreSQL",
  "description": "Database",
  "responseTime": "12ms",
  "connection": "connected",
  "pool": {
    "totalCount": 10,
    "idleCount": 8,
    "waitingCount": 0
  },
  "database": {
    "size": "45 MB",
    "tables": {
      "blueprints": 23,
      "rooms": 145,
      "fixtures": 487
    }
  },
  "lastCheck": "2026-01-23T10:30:00.000Z"
}
```

---

### 5. AI Service Status

**GET** `/api/status/ai`

Claude API configuration and health.

**Response:**
```json
{
  "success": true,
  "correlationId": "...",
  "status": "healthy",
  "name": "Claude Vision",
  "description": "AI Service",
  "configured": true,
  "model": "claude-3-5-sonnet-20241022",
  "circuitBreaker": {
    "state": "CLOSED",
    "failures": 0,
    "successCount": 42,
    "failureCount": 2
  },
  "lastCheck": "2026-01-23T10:30:00.000Z"
}
```

**Possible Statuses:**
- `not_configured` - ANTHROPIC_API_KEY not set
- `error` - Invalid API key format
- `healthy` - API key configured and valid format

---

### 6. Blueprints Engine Status

**GET** `/api/status/blueprints`

Analysis engine health and queue statistics.

**Response:**
```json
{
  "success": true,
  "correlationId": "...",
  "status": "healthy",
  "name": "Blueprints",
  "description": "Analysis engine",
  "initialized": true,
  "statistics": {
    "total": 23,
    "pending": 2,
    "processing": 1,
    "completed": 18,
    "failed": 2
  },
  "backlog": "Normal",
  "lastCheck": "2026-01-23T10:30:00.000Z"
}
```

**Backlog Threshold:** Status becomes `warning` if pending > 50

---

### 7. Prometheus Metrics

**GET** `/api/status/metrics`

Prometheus-compatible metrics for monitoring systems.

**Response:** (text/plain)
```
# HELP plansiteos_uptime_seconds System uptime in seconds
# TYPE plansiteos_uptime_seconds gauge
plansiteos_uptime_seconds 8130

# HELP plansiteos_service_status Service health status (1=healthy, 0=unhealthy)
# TYPE plansiteos_service_status gauge
plansiteos_service_status{service="api"} 1
plansiteos_service_status{service="database"} 1
plansiteos_service_status{service="ai"} 1
plansiteos_service_status{service="blueprints"} 1

# HELP plansiteos_blueprints_total Total blueprints by status
# TYPE plansiteos_blueprints_total gauge
plansiteos_blueprints_total{status="pending"} 2
plansiteos_blueprints_total{status="processing"} 1
plansiteos_blueprints_total{status="completed"} 18
plansiteos_blueprints_total{status="failed"} 2

# HELP plansiteos_memory_usage_bytes Memory usage in bytes
# TYPE plansiteos_memory_usage_bytes gauge
plansiteos_memory_usage_bytes{type="rss"} 152043520
plansiteos_memory_usage_bytes{type="heap_used"} 93323264
plansiteos_memory_usage_bytes{type="heap_total"} 125829120
```

---

## Frontend Component

A React component is provided for displaying system status.

### Usage

```tsx
import SystemStatus from './components/SystemStatus';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <SystemStatus />
    </div>
  );
}
```

### Features

- **Auto-refresh:** Updates every 30 seconds
- **Visual indicators:** Color-coded status (green/yellow/red)
- **Detailed metrics:** Per-service statistics
- **Manual refresh:** Click refresh button
- **Error handling:** Graceful degradation

---

## Monitoring Setup

### Configure Prometheus

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'plansiteos-api'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: /api/status/metrics
    scrape_interval: 30s
```

### Alert Rules

Example Prometheus alerts:

```yaml
groups:
  - name: plansiteos
    rules:
      - alert: PlansiteOSServiceDown
        expr: plansiteos_service_status == 0
        for: 2m
        annotations:
          summary: "PlansiteOS service {{ $labels.service }} is down"

      - alert: PlansiteOSHighBacklog
        expr: plansiteos_blueprints_total{status="pending"} > 50
        for: 15m
        annotations:
          summary: "PlansiteOS has high blueprint backlog"
```

---

## Testing

### Manual Testing

```bash
# Test all endpoints
./test-status-locally.sh

# Test specific endpoint
curl http://localhost:5000/api/status | jq '.'

# Test health check
curl http://localhost:5000/api/health
```

### Expected Results

All services should report `healthy` status when:
- ✅ PostgreSQL is running and connected
- ✅ ANTHROPIC_API_KEY is configured
- ✅ Database tables exist
- ✅ No processing backlog

---

## Configuration

### Environment Variables

```bash
# Database (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/plansite

# AI Service (required for AI status)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Status check interval (default: 30000ms)
STATUS_CHECK_INTERVAL=30000
```

### Monitoring Interval

Change monitoring interval in `src/app.js`:

```javascript
// Check every 60 seconds instead of 30
systemStatus.startMonitoring(60000);
```

---

## Troubleshooting

### Issue: All Services Show "Unknown"

**Cause:** Status monitoring not started

**Fix:**
```bash
# Check server logs
docker logs plansite-api

# Should see: "Starting system status monitoring"
```

---

### Issue: Database Shows "Unhealthy"

**Possible Causes:**
1. PostgreSQL not running
2. Wrong DATABASE_URL
3. Network connectivity issue

**Fix:**
```bash
# Check database
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check logs
docker logs plansite-postgres
```

---

### Issue: AI Service Shows "Not Configured"

**Cause:** ANTHROPIC_API_KEY not set or invalid

**Fix:**
```bash
# Check environment variable
echo $ANTHROPIC_API_KEY

# Update .env
ANTHROPIC_API_KEY=sk-ant-your-actual-key
```

---

### Issue: Blueprints Shows "Warning" (High Backlog)

**Cause:** More than 50 blueprints pending analysis

**Solutions:**
1. **Scale workers:** Add more processing capacity
2. **Check errors:** Review failed blueprints
3. **AI service:** Verify Claude API is working

```bash
# Check pending blueprints
psql $DATABASE_URL -c "SELECT COUNT(*) FROM blueprints WHERE status='pending'"

# Check failed blueprints
psql $DATABASE_URL -c "SELECT id, error_message FROM blueprints WHERE status='failed'"
```

---

## Performance Impact

### Monitoring Overhead

- **CPU:** < 1% additional usage
- **Memory:** ~5MB for status cache
- **Network:** Minimal (local DB queries)
- **Database:** 1 query every 30 seconds

### Optimization Tips

1. **Increase interval** for low-traffic systems:
   ```javascript
   systemStatus.startMonitoring(60000); // 60s instead of 30s
   ```

2. **Use quick endpoint** for frequent polling:
   ```bash
   # Cached, no DB queries
   curl /api/status/quick
   ```

3. **Cache in frontend:**
   ```tsx
   // Refresh every 60s instead of 30s
   setInterval(fetchStatus, 60000);
   ```

---

## Integration Examples

### Load Balancer Health Check

```nginx
# Nginx upstream health check
upstream plansiteos {
  server localhost:5000;
}

location /health {
  proxy_pass http://plansiteos/api/health;
  access_log off;
}
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1
```

### Kubernetes Liveness/Readiness

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/status/quick
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## API Changes & Versioning

This is v1 of the Status API. Changes will be:
- **Backward compatible** additions
- **Deprecated** fields marked before removal
- **Version bumps** for breaking changes

---

## Support

- **Documentation:** This file
- **API Spec:** `docs/api/openapi.yaml`
- **Issues:** GitHub issues
- **Logs:** Check `docker logs plansite-api`
