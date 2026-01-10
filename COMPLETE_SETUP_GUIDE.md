# Complete Setup Guide - All Improvements

## 🎯 What You Have Now

Your PipelineOS application now includes:

### ✅ **Improvement #1 & #2** - Connection Pool & Circuit Breakers
- Fixed connection pool leak in CronService
- Circuit breakers for Twilio and Claude APIs
- Rate limiting for external services
- Comprehensive error resilience

### ✅ **Improvement #4** - Transactions & Correlation IDs
- ACID transactions for lead creation
- End-to-end request tracing
- Distributed correlation tracking
- Enhanced debugging capabilities

### ✅ **Blueprint Analysis Feature**
- Claude Vision API integration
- Automatic fixture detection and counting
- Dimension lines on blueprints (commercial style)
- Professional legends with totals
- Complete fixture management

---

## 📦 Installation Steps

### 1. Install All Dependencies

```bash
# Install new packages
npm install --save \
  @anthropic-ai/sdk \
  multer \
  canvas \
  uuid \
  pg \
  winston \
  node-cron \
  twilio

# Install dev dependencies
npm install --save-dev \
  jest \
  supertest \
  nodemon
```

### 2. Set Up Environment Variables

Create or update your `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pipelineos

# Redis
REDIS_URL=redis://localhost:6379

# Claude API (required for both lead analysis and blueprints)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Twilio (optional - for SMS notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1##########
YOUR_PHONE_NUMBER=+1##########

# Application
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-very-long-random-secret-here

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# Timezone
TZ=America/Chicago
```

### 3. Create Upload Directory

```bash
mkdir -p uploads/blueprints
chmod 755 uploads/blueprints
```

### 4. Run Database Migrations

```bash
# Transaction support migration
psql $DATABASE_URL < migrations/add_transaction_support.sql

# Blueprint analysis migration
psql $DATABASE_URL < migrations/add_blueprint_analysis.sql

# Verify tables created
psql $DATABASE_URL -c "\dt" | grep -E "(notification_queue|blueprint)"
```

**Expected output:**
```
notification_queue
blueprint_fixtures
blueprint_rooms
blueprints
blueprint_analysis_log
```

### 5. Update Your Express App

Update your main `app.js` or `server.js`:

```javascript
const express = require('express');
const {
  correlationIdMiddleware,
  responseLoggingMiddleware,
  errorHandlingMiddleware
} = require('./src/middleware/correlationId');

const app = express();

// ✅ IMPORTANT: Add correlation ID middleware FIRST
app.use(correlationIdMiddleware({
  headerName: 'x-correlation-id',
  generateIfMissing: true,
  addToResponse: true,
  logRequests: true
}));

// ✅ Add response logging
app.use(responseLoggingMiddleware());

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Your existing routes
app.use('/api/leads', require('./src/routes/leads'));

// ✅ NEW: Blueprint routes
app.use('/api/blueprints', require('./src/routes/blueprints'));

// ✅ IMPORTANT: Error handling middleware LAST
app.use(errorHandlingMiddleware());

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
```

### 6. Start the Application

```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

---

## 🧪 Test Everything

### Test 1: Correlation IDs

```bash
# Send a request
curl -X GET http://localhost:3000/api/health \
  -H "x-correlation-id: test-123"

# Check logs for correlation ID
grep "test-123" logs/combined.log
```

**Expected:** All log entries include `correlationId: "test-123"`

### Test 2: Circuit Breaker

```bash
# Send test SMS (if Twilio configured)
curl -X POST http://localhost:3000/api/test/sms \
  -H "Content-Type: application/json" \
  -d '{"message": "Circuit breaker test"}'

# Check circuit state
curl http://localhost:3000/api/health | jq '.services.notifications.circuitBreaker'
```

**Expected:** Circuit state = CLOSED, request successful

### Test 3: Transaction Handling

```bash
# Create a lead (should use transaction)
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "post_text": "Need plumber in Dallas for water heater",
    "post_url": "https://facebook.com/test",
    "group_name": "Dallas Home Services"
  }'

# Verify transaction in database
psql $DATABASE_URL -c "
  SELECT l.id, l.city, la.activity_type, nq.type
  FROM leads l
  LEFT JOIN lead_activity la ON la.lead_id = l.id
  LEFT JOIN notification_queue nq ON nq.lead_id = l.id
  WHERE l.id = (SELECT MAX(id) FROM leads);
"
```

**Expected:** Lead, activity, and notification all created atomically

### Test 4: Blueprint Analysis

```bash
# Upload a blueprint
curl -X POST http://localhost:3000/api/blueprints/upload \
  -F "blueprint=@test-blueprint.jpg" \
  -F "projectName=Test Project"

# Response should include:
# - Blueprint ID
# - Fixture counts
# - Room breakdown
# - Measurements

# Generate annotated blueprint
curl -X POST http://localhost:3000/api/blueprints/1/annotate

# Check output file
ls -lh uploads/blueprints/*-annotated.png
```

**Expected:** Annotated image with dimension lines and legend

---

## 📊 Monitoring

### Health Check Endpoint

Add this to your routes:

```javascript
// src/routes/health.js
const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const AIService = require('../services/AIService');
const BlueprintService = require('../services/BlueprintService');
const db = require('../config/database');
const redis = require('../config/redis');

router.get('/', async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: await db.healthCheck(),
        redis: await redis.healthCheck(),
        notifications: NotificationService.getHealth(),
        ai: AIService.getHealth(),
        blueprints: BlueprintService.getHealth()
      }
    };

    // Determine overall status
    const allHealthy = Object.values(health.services).every(service => {
      return service.healthy || service.initialized || service.enabled || service.testMode;
    });

    health.status = allHealthy ? 'healthy' : 'degraded';

    res.status(allHealthy ? 200 : 503).json(health);

  } catch (error) {
    res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
```

### Monitor Logs

```bash
# Watch all logs
tail -f logs/combined.log

# Watch circuit breaker activity
tail -f logs/combined.log | grep "circuit breaker"

# Watch blueprint analysis
tail -f logs/combined.log | grep "blueprint"

# Watch correlation IDs
tail -f logs/combined.log | grep "correlationId"
```

### Database Monitoring

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();

-- Long-running transactions
SELECT pid, now() - xact_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND xact_start IS NOT NULL
ORDER BY duration DESC;

-- Blueprint analysis stats
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'processing') as in_progress
FROM blueprints;

-- Recent correlation trace
SELECT * FROM get_request_trace('your-correlation-id-here');
```

---

## 🐛 Common Issues & Solutions

### Issue: "Circuit breaker is OPEN"

**Cause:** Too many failures to external service

**Solution:**
```javascript
// Check circuit status
const NotificationService = require('./src/services/NotificationService');
console.log(NotificationService.circuitBreaker.getStatus());

// Manually reset (emergency only)
NotificationService.circuitBreaker.reset();
```

### Issue: "Transaction failed" errors

**Cause:** Database connection issues or deadlock

**Solution:**
```bash
# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity"

# Check for deadlocks
psql $DATABASE_URL -c "
  SELECT * FROM pg_stat_activity
  WHERE wait_event_type = 'Lock';
"

# Restart application
npm restart
```

### Issue: Blueprint analysis returns no fixtures

**Cause:** Blueprint image unclear or unsupported format

**Solution:**
```bash
# Check image quality
identify blueprint.jpg

# Enhance contrast
convert blueprint.jpg -normalize -enhance blueprint-enhanced.jpg

# Try again with enhanced image
curl -X POST http://localhost:3000/api/blueprints/upload \
  -F "blueprint=@blueprint-enhanced.jpg"
```

### Issue: "ANTHROPIC_API_KEY not set"

**Cause:** Missing or incorrect API key

**Solution:**
```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Test API key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

---

## 📈 Performance Optimization

### 1. Add Indexes

```sql
-- Improve query performance
CREATE INDEX CONCURRENTLY idx_leads_correlation_id ON leads(correlation_id);
CREATE INDEX CONCURRENTLY idx_blueprints_status ON blueprints(status);
CREATE INDEX CONCURRENTLY idx_blueprint_fixtures_type ON blueprint_fixtures(fixture_type);
```

### 2. Enable Connection Pooling

```javascript
// config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                          // Increase pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  statement_timeout: 30000          // 30 second query timeout
});

module.exports = pool;
```

### 3. Implement Caching

```javascript
// Use Redis for caching analysis results
const redis = require('../config/redis');

async function getCachedAnalysis(blueprintId) {
  const cached = await redis.get(`blueprint:${blueprintId}`);
  if (cached) return JSON.parse(cached);

  const analysis = await BlueprintService.getAnalysisResults(blueprintId);

  // Cache for 1 hour
  await redis.setex(`blueprint:${blueprintId}`, 3600, JSON.stringify(analysis));

  return analysis;
}
```

### 4. Optimize Images

```bash
# Set up automatic image optimization
npm install --save sharp

# In fileUpload.js
const sharp = require('sharp');

async function optimizeImage(filePath) {
  const optimized = filePath.replace('.jpg', '-optimized.jpg');

  await sharp(filePath)
    .resize(3000, 3000, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(optimized);

  return optimized;
}
```

---

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Upload directories created with correct permissions
- [ ] Disk space monitoring set up
- [ ] Log rotation configured
- [ ] Health check endpoint working
- [ ] Circuit breakers tested
- [ ] Correlation IDs appearing in logs
- [ ] Transaction handling tested
- [ ] Blueprint analysis tested with sample images
- [ ] Error handling tested
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured

---

## 📚 Documentation Quick Links

- [Circuit Breaker Quick Reference](./CIRCUIT_BREAKER_QUICK_REFERENCE.md)
- [Improvements Summary](./IMPROVEMENTS_SUMMARY.md)
- [Transactions & Correlation Guide](./TRANSACTIONS_CORRELATION_GUIDE.md)
- [Blueprint Analysis Guide](./BLUEPRINT_ANALYSIS_GUIDE.md)
- [README Improvements](./README_IMPROVEMENTS.md)

---

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Your Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Express Middleware Layer                                   │  │
│  │  • Correlation ID Injection                               │  │
│  │  • Request Logging                                        │  │
│  │  • Error Handling                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │ Services Layer                                            │  │
│  │  ┌─────────────────┐  ┌──────────────────┐              │  │
│  │  │ LeadProcessing  │  │ BlueprintService │              │  │
│  │  │   • Validation  │  │  • Vision API    │              │  │
│  │  │   • AI Analysis │  │  • Analysis      │              │  │
│  │  │   • Transactions│  │  • Visualization │              │  │
│  │  └────────┬────────┘  └────────┬─────────┘              │  │
│  │           │                     │                         │  │
│  │  ┌────────┴─────────────────────┴──────────┐            │  │
│  │  │ Utility Layer                            │            │  │
│  │  │  • Circuit Breakers                      │            │  │
│  │  │  • Transaction Manager                   │            │  │
│  │  │  • Correlation ID Manager                │            │  │
│  │  └────────────────┬─────────────────────────┘            │  │
│  └───────────────────┼──────────────────────────────────────┘  │
│                      │                                          │
│  ┌───────────────────┴──────────────────────────────────────┐  │
│  │ External Services                                         │  │
│  │  • Claude API (Circuit Protected)                        │  │
│  │  • Twilio API (Circuit Protected)                        │  │
│  │  • PostgreSQL (Transaction Managed)                      │  │
│  │  • Redis (Connection Pooled)                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎉 You're Ready!

Your application now has:
- ✅ Production-grade error handling
- ✅ Distributed tracing with correlation IDs
- ✅ ACID transactions for data integrity
- ✅ Circuit breakers for resilience
- ✅ Advanced blueprint analysis with Claude Vision
- ✅ Commercial-style dimension lines and legends
- ✅ Comprehensive monitoring and logging

**Start building amazing features on this solid foundation!**

Need help? Check the documentation files or review the inline code comments.

---

**Setup Guide Version**: 1.0.0
**Date**: January 2026
**Status**: ✅ Complete
