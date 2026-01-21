# Analytics Dashboard Implementation

## Overview

The Analytics Dashboard provides comprehensive insights into blueprint analysis performance, fixture detection statistics, and system metrics. This implementation connects the existing frontend UI with a fully functional backend service.

## ✅ What Was Implemented

### 1. Backend Analytics Service

**Location:** `/apps/api/src/modules/analytics/analytics.service.js`

A comprehensive service that provides:

#### Dashboard Statistics (`getDashboardStats`)
- **Blueprint Metrics:**
  - Total blueprints processed
  - Trend analysis (comparison with previous period)
  - Percent change calculations

- **Analysis Performance:**
  - Average analysis time (in seconds)
  - Success rate percentage
  - Total and successful analysis counts
  - Performance trends

- **Fixture Statistics:**
  - Total fixtures detected across all blueprints
  - Breakdown by fixture type (top 10)
  - Average fixtures per blueprint
  - Confidence scores

- **Recent Activity:**
  - Last 10 processed blueprints
  - Status, fixture count, and analysis time

- **Activity Data:**
  - Daily breakdown of uploads, completions, and failures
  - Perfect for time-series charts

- **Status Distribution:**
  - Count of blueprints by status (completed, processing, failed, pending)
  - Color-coded for UI visualization

#### Fixture Breakdown (`getFixtureBreakdown`)
- Detailed fixture counts by type
- Average confidence scores
- Blueprint count per fixture type
- Configurable limit

#### Performance Metrics (`getPerformanceMetrics`)
- Total analysis count
- Success/failure breakdown
- Average, median, and P95 analysis times
- Success rate percentage

### 2. API Routes

**Location:** `/apps/api/src/routes/v1/analytics.routes.js`

Three REST endpoints:

```
GET /api/v1/analytics/stats?dateRange=last30days
GET /api/v1/analytics/fixtures?dateRange=last30days&limit=20
GET /api/v1/analytics/performance?dateRange=last30days
```

**Supported Date Ranges:**
- `today` - Today only
- `last7days` - Last 7 days
- `last30days` - Last 30 days (default)
- `thismonth` - Current month
- `lastmonth` - Previous month
- `thisyear` - Current year

### 3. Route Integration

**Updated:** `/apps/api/src/routes/v1/index.js`

- Uncommented analytics routes
- Wired to main API router
- Added to API info endpoint

### 4. Frontend Integration

**Existing:** `/apps/web/src/pages/Analytics.improved.jsx`

The frontend was already implemented and now connects to the real backend API:

- Dashboard with key metrics cards
- Area chart showing blueprint activity over time
- Pie chart for status distribution
- Fixture breakdown display
- Recent blueprints table
- Date range filtering

## 📊 Database Queries

The service uses optimized PostgreSQL queries with:

- **Parallel execution** for multiple metrics (using `Promise.all`)
- **Aggregations** for counting and averaging
- **Window functions** for percentile calculations (median, P95)
- **CTEs and filters** for date range filtering
- **Indexed queries** on `created_at`, `status`, and foreign keys

### Key Tables Used:
- `blueprints` - Main blueprint table with status and timestamps
- `blueprint_fixtures` - Individual fixture detections with confidence scores
- `blueprint_analysis_log` - Analysis performance logs (if available)

## 🚀 Setup Instructions

### 1. Database Requirements

The analytics feature requires the blueprint analysis tables. Run the migration:

```bash
psql $DATABASE_URL < /home/user/PlansiteOS/migrations/add_blueprint_analysis.sql
```

### 2. Environment Configuration

Create or update `.env` file in project root:

```bash
# Database connection (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/plansiteos

# API Server
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# Optional
DATABASE_SSL=false
```

### 3. Install Dependencies

If not already done:

```bash
cd /home/user/PlansiteOS/apps/api
npm install
```

Required packages (already in package.json):
- `express` - Web framework
- `pg` - PostgreSQL client
- `winston` - Logging
- `dotenv` - Environment variables

### 4. Start the API Server

```bash
cd /home/user/PlansiteOS/apps/api
npm start
# or for development with auto-reload
npm run dev
```

The server will start on port 5000 by default.

### 5. Start the Frontend

In a separate terminal:

```bash
cd /home/user/PlansiteOS/apps/web
npm run dev
```

The frontend will typically run on port 5173 (Vite default).

### 6. Test the Analytics API

Run the test script:

```bash
cd /home/user/PlansiteOS
node test-analytics.js
```

Expected output:
```
🚀 Starting Analytics API Tests
============================================================
📝 Testing: API Health Check
   Endpoint: /api/health
   ✅ Success

📝 Testing: Analytics Dashboard Stats (last30days)
   Endpoint: /api/v1/analytics/stats?dateRange=last30days
   ✅ Success
...
✅ All tests passed!
```

## 📡 API Response Examples

### GET /api/v1/analytics/stats

```json
{
  "blueprints": {
    "total": 42,
    "trend": "up",
    "percentChange": 15,
    "current": 42,
    "previous": 36
  },
  "analysis": {
    "averageTime": 12.5,
    "trend": "down",
    "percentChange": 8,
    "successRate": 95,
    "totalAnalyses": 42,
    "successfulAnalyses": 40
  },
  "fixtures": {
    "total": 384,
    "average": 9.14,
    "byType": [
      {
        "name": "Lavatories",
        "type": "lavatory",
        "count": 120,
        "avgConfidence": 92.5
      },
      {
        "name": "Toilets",
        "type": "toilet",
        "count": 90,
        "avgConfidence": 95.2
      }
    ]
  },
  "recentBlueprints": [
    {
      "id": 123,
      "projectName": "123 Main St Renovation",
      "status": "completed",
      "totalFixtures": 12,
      "createdAt": "2026-01-19T10:30:00Z",
      "analysisTime": 14.2
    }
  ],
  "activityData": [
    {
      "date": "2026-01-15",
      "uploaded": 5,
      "completed": 4,
      "failed": 1
    }
  ],
  "statusDistribution": [
    {
      "name": "Completed",
      "value": 70,
      "color": "#10B981"
    },
    {
      "name": "Processing",
      "value": 20,
      "color": "#F59E0B"
    }
  ]
}
```

### GET /api/v1/analytics/fixtures

```json
{
  "fixtures": [
    {
      "name": "Lavatories",
      "type": "lavatory",
      "count": 120,
      "avgConfidence": 92.5,
      "blueprintCount": 35
    }
  ],
  "total": 384
}
```

### GET /api/v1/analytics/performance

```json
{
  "totalAnalyses": 42,
  "successful": 40,
  "failed": 2,
  "successRate": 95,
  "avgTime": 12.5,
  "medianTime": 11.2,
  "p95Time": 18.7
}
```

## 🔧 Troubleshooting

### Database Connection Errors

**Problem:** `Database connection failed`

**Solution:**
1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check DATABASE_URL in .env file
3. Ensure database exists: `psql -l | grep plansiteos`
4. Run migrations if tables don't exist

### Empty Analytics Data

**Problem:** All metrics show 0

**Solution:**
- This is normal if no blueprints have been processed yet
- Upload some test blueprints through the upload interface
- Or insert test data:
  ```sql
  INSERT INTO blueprints (project_name, file_name, file_path, status, total_fixtures, created_at)
  VALUES ('Test Project', 'test.pdf', '/uploads/test.pdf', 'completed', 10, NOW());
  ```

### CORS Errors in Browser

**Problem:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
The API is configured to allow:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000`
- `http://localhost:5000`

If your frontend runs on a different port, update `apps/api/src/app.js`:
```javascript
const allowedOrigins = [
  'http://localhost:YOUR_PORT',
  // ... other origins
];
```

### Slow Query Performance

**Problem:** Analytics endpoint takes >5 seconds

**Solution:**
1. Ensure indexes exist (they should from migration):
   ```sql
   CREATE INDEX IF NOT EXISTS idx_blueprints_created_at ON blueprints(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_blueprints_status ON blueprints(status);
   ```

2. For large datasets, consider adding composite indexes:
   ```sql
   CREATE INDEX idx_blueprints_status_created ON blueprints(status, created_at DESC);
   ```

3. Check query execution with EXPLAIN:
   ```sql
   EXPLAIN ANALYZE SELECT COUNT(*) FROM blueprints WHERE created_at >= NOW() - INTERVAL '30 days';
   ```

## 🎯 Next Steps

### Recommended Enhancements:

1. **Caching Layer**
   - Add Redis caching for frequently accessed metrics
   - Cache TTL: 5-15 minutes
   - Invalidate on new blueprint completion

2. **Real-time Updates**
   - WebSocket connection for live metrics
   - Push updates when blueprints complete
   - Live activity feed

3. **Advanced Filters**
   - Filter by user
   - Filter by project type
   - Filter by fixture type
   - Custom date range picker

4. **Export Functionality**
   - CSV export of raw data
   - PDF reports generation
   - Scheduled email reports

5. **Comparison Views**
   - Compare time periods
   - Compare user performance
   - Benchmark metrics

6. **Alerts & Notifications**
   - Alert when success rate drops below threshold
   - Notify on slow analysis times
   - Daily/weekly summary emails

## 📁 File Structure

```
PlansiteOS/
├── apps/api/src/
│   ├── modules/analytics/
│   │   └── analytics.service.js          # ✅ New - Analytics business logic
│   ├── routes/v1/
│   │   ├── analytics.routes.js           # ✅ New - API endpoints
│   │   └── index.js                      # ✅ Updated - Wired analytics routes
│   ├── platform/
│   │   ├── config/database.js            # Database connection pool
│   │   └── observability/logger.js       # Winston logger
│   ├── app.js                            # Express app configuration
│   └── server.js                         # Server startup
├── apps/web/src/
│   ├── pages/
│   │   └── Analytics.improved.jsx        # Frontend dashboard
│   └── api/
│       └── client.js                     # API client (axios)
├── migrations/
│   └── add_blueprint_analysis.sql        # Database schema
├── test-analytics.js                     # ✅ New - Test script
└── ANALYTICS_IMPLEMENTATION.md           # ✅ New - This file
```

## 🎉 Testing Checklist

- [x] Database connection works
- [x] Analytics service queries execute without errors
- [x] API routes return correct status codes
- [x] Response structure matches frontend expectations
- [x] Date range filtering works correctly
- [x] Trend calculations are accurate
- [ ] Frontend displays real data (requires database with sample data)
- [ ] Date range selector updates charts
- [ ] Recent blueprints table shows correct data
- [ ] Fixture breakdown displays properly

## 💡 Usage Examples

### Fetch Stats with Different Date Ranges

```javascript
// Frontend usage with react-query
const { data: stats } = useQuery({
  queryKey: ['analytics-stats', dateRange],
  queryFn: () => api.get(`/api/v1/analytics/stats?dateRange=${dateRange}`)
});
```

### Direct API Calls

```bash
# Get last 30 days stats
curl http://localhost:5000/api/v1/analytics/stats?dateRange=last30days

# Get fixture breakdown
curl http://localhost:5000/api/v1/analytics/fixtures?limit=10

# Get performance metrics
curl http://localhost:5000/api/v1/analytics/performance?dateRange=thismonth
```

## 📝 Notes

- All timestamps are stored in UTC in the database
- Percentages are rounded to whole numbers for UI display
- Confidence scores are stored as decimals (0-100)
- Analysis time is measured in seconds with 2 decimal places
- Trend calculations compare current period with previous period of equal length
- Empty/null values default to 0 for counts and metrics

## 🔒 Security Considerations

- No authentication implemented yet (on roadmap)
- CORS configured for specific origins
- Query parameters validated implicitly
- SQL injection protected by parameterized queries
- Consider rate limiting for production use

---

**Implementation Date:** 2026-01-19
**Status:** ✅ Complete and Ready for Testing
**Next Feature:** Leads Management System
