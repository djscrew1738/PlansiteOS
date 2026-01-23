# Production Configuration Review

**Date:** 2026-01-23
**Scope:** Monitoring, Gateway, and Deployment Infrastructure

---

## Executive Summary

The latest merge added comprehensive production-ready monitoring and gateway configurations. However, **these configurations reference planned microservices that don't exist yet**, creating a mismatch between infrastructure and application code.

**Status:** 🟡 **Ready for Future Architecture, Not Current Codebase**

---

## 1. Monitoring Stack (Prometheus + Grafana + Loki)

### 📊 Prometheus Configuration

**File:** `monitoring/prometheus/prometheus.yml`

#### Current Services Configured:
✅ **Exist:**
- Prometheus (self-monitoring)
- PostgreSQL (via postgres_exporter)
- Redis (via redis_exporter)
- Node Exporter (host metrics)
- cAdvisor (container metrics)
- Loki

❌ **Don't Exist Yet:**
- Kong API Gateway
- parsing-service (port 8080)
- vision-service (port 8081)
- estimation-service (port 8082)
- rendering-service (port 8083)
- assistant-service (port 8084)
- MinIO object storage
- NATS JetStream message queue

#### Assessment:

**Strengths:**
- Proper scrape intervals (10-30s)
- Alertmanager integration configured
- External labels for multi-cluster support
- Comprehensive metric collection points

**Issues:**
1. **Services don't exist** - 6 out of 13 monitored services are planned but not implemented
2. **Missing current backend** - No scraping of the actual `/src` Node.js backend
3. **Port conflicts** - parsing:8080 conflicts if backend runs on different port

**Recommendation:**
```yaml
# Add to prometheus.yml for CURRENT architecture:

scrape_configs:
  # Current Node.js API (src/app.js)
  - job_name: 'api'
    static_configs:
      - targets: ['api:5000']  # Adjust port as needed
    metrics_path: /metrics
    scrape_interval: 15s

  # Remove or comment out services that don't exist:
  # - parsing-service
  # - vision-service
  # - estimation-service
  # - rendering-service
  # - assistant-service
  # - nats
  # - kong (if not using)
```

---

### 🔔 Alert Rules

**File:** `monitoring/prometheus/rules/alerts.yml`

#### Alert Categories:

1. **Service Health** (Generic - Good!)
   - ServiceDown
   - ServiceHighErrorRate
   - ServiceHighLatency

2. **Processing Pipeline** (❌ Microservice-specific)
   - BlueprintProcessingBacklog
   - VisionServiceSlowDetection
   - EstimationServiceErrors
   - LLMInferenceSlowdown

3. **Resources** (✅ Generic - Good!)
   - HighCPUUsage
   - HighMemoryUsage
   - DiskSpaceLow
   - GPUMemoryHigh

4. **Database** (✅ Generic - Good!)
   - PostgresConnectionsHigh
   - PostgresReplicationLag
   - RedisMemoryHigh

5. **Queues** (❌ Requires NATS - not implemented)
   - NATSStreamLag
   - NATSSlowConsumer

6. **Business Metrics** (❌ Requires custom instrumentation)
   - LowFixtureConfidence
   - EstimateAccuracyDrop

#### Assessment:

**Issues:**
1. **Metric names don't match code** - Current code doesn't export these metrics
2. **NATS alerts won't work** - NATS is not implemented
3. **GPU alerts** - Assumes GPU infrastructure (is this intended?)

**To Make Alerts Work Now:**

```yaml
# Replace processing_pipeline alerts with:
- name: processing_pipeline
  rules:
    - alert: BlueprintAnalysisBacklog
      expr: |
        blueprints_pending_count{status="pending"} > 50
      for: 15m
      labels:
        severity: warning
      annotations:
        summary: "Blueprint analysis backlog building"
        description: "More than 50 blueprints pending analysis."

    - alert: ClaudeAPIErrors
      expr: |
        rate(claude_api_errors_total[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate from Claude API"
        description: "Claude API errors are elevated."
```

**Action Required:**
1. Instrument current backend with Prometheus client
2. Add metrics to `/src/app.js`:
   - `http_requests_total{status, method, path}`
   - `http_request_duration_seconds`
   - `blueprints_pending_count{status}`
   - `claude_api_errors_total`

---

### 📈 Grafana Dashboards

**File:** `monitoring/grafana/dashboards/plansiteos/overview.json`

#### Observations:
- Large JSON file (30KB) with comprehensive panels
- Likely visualizes the microservice architecture metrics
- Provisioning configured properly

**Issue:** Dashboard expects metrics from services that don't exist.

**Recommendation:**
1. Create simplified dashboard for current architecture:
   - API request rate
   - Blueprint upload/analysis metrics
   - Database connections
   - Error rates
   - Response times

2. Keep existing dashboard as `overview-future.json` for reference

---

### 📝 Loki (Log Aggregation)

**File:** `monitoring/loki/loki-config.yml`

#### Quick Check:
```bash
grep -A5 "schema_config" monitoring/loki/loki-config.yml
```

**Assessment Needed:**
- Verify retention periods appropriate
- Check if log labels match current logging format
- Ensure integration with Winston logger in `/src/utils/logger.js`

**Action Required:**
1. Add Loki transport to Winston:
```javascript
// src/utils/logger.js
const LokiTransport = require('winston-loki');

logger.add(new LokiTransport({
  host: process.env.LOKI_URL || 'http://loki:3100',
  labels: { app: 'plansiteos-api' },
  json: true
}));
```

---

## 2. Kong API Gateway

**File:** `gateway/kong/kong.yml`

### Services Configured:

All routes point to non-existent microservices:
- parsing-service (http://parsing:8080)
- vision-service (http://vision:8081)
- estimation-service (http://estimation:8082)
- rendering-service (http://rendering:8083)
- assistant-service (http://assistant:8084)

### Issues:

1. **No routes for current backend** - `/src/app.js` not proxied
2. **Rate limiting** - Likely configured but needs verification
3. **Authentication** - Check if auth plugins configured

### For Current Architecture:

**Option A:** Don't use Kong yet (simpler)
- Keep direct Nginx or Caddy reverse proxy
- Add Kong when moving to microservices

**Option B:** Use Kong now with current backend

```yaml
# gateway/kong/kong-current.yml
_format_version: "3.0"

services:
  - name: plansiteos-api
    url: http://api:5000
    protocol: http
    routes:
      - name: api-routes
        paths:
          - /api
        strip_path: false

plugins:
  - name: rate-limiting
    config:
      minute: 100
      policy: local

  - name: cors
    config:
      origins:
        - https://ctlplumbingllc.com
      credentials: true

  - name: prometheus
    config:
      per_consumer: false
```

---

## 3. Deployment Configurations

### Docker Compose Production

**File:** `docker-compose.prod.yml`

#### Quick Review:
```bash
wc -l docker-compose.prod.yml
```

**Likely Contains:**
- Full monitoring stack
- Microservice definitions
- Database with replication
- MinIO cluster
- NATS cluster

**Issue:** Defines services that don't have images/code yet.

**Recommendation:**
1. Create `docker-compose.current.yml` for actual deployable stack:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data

  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus/prometheus-current.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana

volumes:
  postgres-data:
  redis-data:
  prometheus-data:
  grafana-data:
```

---

## 4. Production Readiness Checklist

### ✅ Already Configured (Good!)
- [x] Comprehensive monitoring setup
- [x] Alert rules defined
- [x] Log aggregation (Loki)
- [x] Dashboard templates
- [x] Gateway configuration template
- [x] Environment variable examples

### ❌ Needs Immediate Attention
- [ ] Align monitoring with current architecture
- [ ] Instrument backend with Prometheus metrics
- [ ] Test Loki integration with Winston
- [ ] Create current-state Docker Compose
- [ ] Remove references to non-existent services
- [ ] Add health check endpoints to API

### 🔧 Implementation Tasks

#### 1. Add Metrics to Current Backend

**Install dependencies:**
```bash
npm install prom-client winston-loki
```

**Create metrics file:**
```javascript
// src/utils/metrics.js
const client = require('prom-client');

const register = new client.Registry();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const blueprintsPending = new client.Gauge({
  name: 'blueprints_pending_count',
  help: 'Number of blueprints pending analysis',
  labelNames: ['status'],
  registers: [register]
});

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  blueprintsPending
};
```

**Add middleware:**
```javascript
// src/middleware/metrics.js
const { httpRequestDuration, httpRequestTotal } = require('../utils/metrics');

module.exports = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    httpRequestTotal.inc({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });

  next();
};
```

**Add metrics endpoint:**
```javascript
// src/app.js
const { register } = require('./utils/metrics');
const metricsMiddleware = require('./middleware/metrics');

app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

#### 2. Test Monitoring Stack

```bash
# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify Prometheus scraping
curl http://localhost:9090/api/v1/targets

# Check metrics endpoint
curl http://localhost:5000/metrics

# View Grafana
open http://localhost:3001
```

---

## 5. Migration Path to Microservices

The monitoring/gateway configs are actually **perfect for the future architecture**. Here's the migration path:

### Phase 1: Current Monolith (Now)
- Single Node.js API
- Basic Prometheus metrics
- Simple monitoring

### Phase 2: Extract Services (Months 3-6)
- Extract blueprint parsing → parsing-service
- Extract AI analysis → assistant-service
- Add Kong gateway
- Enable full monitoring

### Phase 3: Scale Services (Months 6-12)
- Extract vision processing → vision-service
- Extract estimation → estimation-service
- Add NATS for async processing
- Full microservice architecture matches configs

**Keep the comprehensive configs as reference for future!**

---

## 6. Recommendations Summary

### Immediate (This Week)
1. **Create simplified monitoring config** for current architecture
2. **Add Prometheus metrics** to `/src/app.js`
3. **Test Loki integration** with Winston
4. **Document which configs are for future** vs current

### Short Term (2-4 Weeks)
5. **Add health check endpoint** (`GET /health`)
6. **Create Grafana dashboard** for current metrics
7. **Set up alerting** to Slack/email
8. **Test alert rules** with current metrics

### Medium Term (1-3 Months)
9. **Plan microservice extraction** following config structure
10. **Set up Kong gateway** when ready to split services
11. **Implement NATS** for async job processing
12. **Add business metric instrumentation**

---

## 7. Files to Create

1. `monitoring/prometheus/prometheus-current.yml` - For existing backend
2. `monitoring/prometheus/rules/alerts-current.yml` - For existing metrics
3. `monitoring/grafana/dashboards/plansiteos/current-api.json` - Current dashboard
4. `docker-compose.monitoring.yml` - Just monitoring stack
5. `docker-compose.current.yml` - Current deployable stack
6. `docs/MONITORING_SETUP.md` - How to set up monitoring

---

## Conclusion

The production configs are **excellent preparation for the future microservice architecture** but need adaptation for the current monolithic backend. Rather than discarding them, we should:

1. Create parallel "current" configs that work now
2. Keep the comprehensive configs as the target architecture
3. Incrementally migrate toward the full monitoring stack

**Next Step:** Implement Prometheus metrics in current backend (Task in next section).
