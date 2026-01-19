# Leads Management System Implementation

## Overview

The Leads Management System captures, analyzes, and tracks plumbing leads from Facebook groups using AI-powered analysis. It integrates with the existing PlansiteOS platform to provide automated lead qualification, service area matching, and priority scoring.

## ✅ What Was Implemented

### 1. Database Schema

**Location:** `/migrations/add_leads_support.sql`

#### Tables Created:

**`leads` Table:**
- Source tracking (Facebook, manual, referral, website)
- Contact & location data (city, county, ZIP, contact_info JSONB)
- Job information (type, description, estimated value, urgency)
- AI analysis (score 0-100, analysis JSONB, recommended response)
- Status workflow (new → contacted → quoted → won/lost/spam)
- Priority levels (low, medium, high, urgent)
- Follow-up scheduling & timestamps
- Full audit trail with correlation IDs

**`service_areas` Table:**
- Geographic coverage (city, county, state, ZIP codes)
- Service level tiers (standard, premium, limited)
- Response time targets
- Primary vs. secondary areas
- Active/inactive status

**`notification_queue` Table:** (from add_transaction_support.sql)
- Async notification queue
- Priority-based scheduling
- Retry logic with max attempts
- Status tracking

**`lead_activity` Table:** (from add_transaction_support.sql)
- Complete audit trail
- Activity types (created, contacted, quoted, won, lost)
- User tracking & correlation IDs

#### Views Created:

1. **`lead_pipeline`** - Lead counts by status with 7-day and 30-day metrics
2. **`leads_by_service_area`** - Geographic distribution of leads
3. **`high_priority_leads`** - Active leads with AI score >= 70

#### Functions Created:

1. **`update_lead_status()`** - Status updates with automatic timestamps
2. **`is_in_service_area()`** - Check if location is served
3. **`get_service_area_priority()`** - Priority score for location (0-100)

#### Default Data:

Pre-loaded with **DFW service areas:**
- **Johnson County** (primary): Burleson, Cleburne, Joshua, Alvarado, Godley, Keene
- **Tarrant County**: Fort Worth, Arlington, Mansfield, Crowley, Everman
- **Dallas County**: Dallas, Grand Prairie, Cedar Hill, DeSoto, Duncanville
- **Ellis County**: Midlothian, Waxahachie, Red Oak
- **Hill County**: Hillsboro, Whitney

### 2. Lead Model

**Location:** `/apps/api/src/modules/models/Lead.js`

**Methods:**
- `findByUrl(postUrl)` - Duplicate detection
- `findById(id)` - Get single lead
- `findAll(filters)` - Search with filters (status, priority, score, location)
- `getHighPriority(limit)` - Get leads with score >= 70
- `updateStatus(id, status, notes)` - Update with logging
- `update(id, updates)` - General updates
- `delete(id)` - Remove lead
- `getStatistics()` - Dashboard metrics

**Features:**
- Parameterized queries (SQL injection protection)
- Camelcase JavaScript ↔ snake_case SQL mapping
- Comprehensive error logging
- Optimized queries with proper indexes

### 3. ServiceArea Model

**Location:** `/apps/api/src/modules/models/ServiceArea.js`

**Methods:**
- `matchesServiceArea(city, county)` - Boolean check
- `getPriority(city, county)` - Priority score (0-100)
- `findAll(filters)` - List all areas
- `findById(id)` - Get single area

**Features:**
- Integrates with PostgreSQL functions
- Handles primary vs. secondary areas
- Service level tiers (standard, premium, limited)
- Response time tracking

### 4. Validators Utility

**Location:** `/apps/api/src/modules/utils/validators.js`

**Methods:**
- `isValidUrl(url)` - URL validation
- `sanitizeString(input, maxLength)` - String cleaning
- `isValidEmail(email)` - Email format check
- `isValidPhone(phone)` - Phone validation (10-11 digits)
- `sanitizePhone(phone)` - Strip formatting
- `isPositiveInteger(value)` - Integer check
- `isInRange(value, min, max)` - Range validation
- `sanitizeHtml(html)` - XSS prevention
- `isValidDate(dateStr)` - Date validation
- `sanitizeObject(obj)` - Prototype pollution protection

**Security:**
- XSS prevention
- SQL injection protection (via parameterized queries)
- Prototype pollution prevention
- Null byte removal
- Input length limits

### 5. Lead Processing Service

**Location:** `/apps/api/src/modules/leads/leads.service.js`

**Already Implemented** (just needed models/utils):

**Main Flow:**
1. **Validate Input** - Check required fields, format
2. **Check Duplicates** - Prevent reprocessing same post
3. **Sanitize Inputs** - Clean/escape all data
4. **AI Analysis** - Analyze with Claude (via AIService)
5. **Filter Non-Leads** - Reject low-confidence posts
6. **Service Area Verification** - Adjust score for out-of-area
7. **Create Lead** - Atomic transaction with logging
8. **Send Notifications** - Alert for high-priority (async)

**Features:**
- Full transaction support (ACID guarantees)
- Correlation ID tracking
- Circuit breaker protection
- Metrics tracking
- Error handling with fallbacks
- Async notifications (non-blocking)

### 6. Notification Service

**Location:** `/apps/api/src/integrations/NotificationService.js`

**Current Implementation:**
- High-priority alert logging
- Placeholder for SMS (Twilio)
- Placeholder for Email (SendGrid)

**TODO:**
- Implement Twilio SMS integration
- Implement SendGrid email integration
- Add push notifications
- Add Slack/Discord webhooks

### 7. AI Service

**Location:** `/apps/api/src/modules/leads/AIService.js`

**Already Implemented:**
- Claude integration for post analysis
- Extracts: job type, location, contact info, urgency
- Confidence scoring
- Recommended response generation

### 8. API Routes

**Location:** `/apps/api/src/routes/v1/leads.routes.js`

**Endpoints:**

```
GET    /api/v1/leads                    - List leads (with filters)
GET    /api/v1/leads/:id                - Get single lead
GET    /api/v1/leads/high-priority      - Get high-priority leads
GET    /api/v1/leads/statistics         - Get lead statistics
POST   /api/v1/leads                    - Process incoming lead
PATCH  /api/v1/leads/:id                - Update lead
PATCH  /api/v1/leads/:id/status         - Update status
DELETE /api/v1/leads/:id                - Delete lead
GET    /api/v1/leads/service-areas/all  - List service areas
GET    /api/v1/leads/metrics/processing - Processing metrics
```

**Features:**
- RESTful design
- Correlation ID tracking
- Comprehensive error handling
- Query parameter validation
- Proper HTTP status codes

### 9. Constants Configuration

**Location:** `/apps/api/src/platform/config/constants.js`

**Added:**
```javascript
AI.HIGH_PRIORITY_THRESHOLD = 70
```

Used for determining when to send high-priority alerts.

## 📊 API Examples

### Create Lead from Facebook Post

**POST /api/v1/leads**
```json
{
  "post_text": "Need a plumber in Burleson ASAP! Water heater leaking bad. Anyone available?",
  "post_url": "https://facebook.com/groups/123/posts/456",
  "author": "John Smith",
  "group_name": "Burleson Community",
  "timestamp": "2026-01-19T10:30:00Z"
}
```

**Response (High Priority):**
```json
{
  "success": true,
  "lead_id": 42,
  "is_priority": true,
  "score": 85,
  "job_type": "water_heater_repair",
  "city": "Burleson",
  "duration": 1250,
  "correlationId": "abc123"
}
```

**Response (Duplicate):**
```json
{
  "success": true,
  "duplicate": true,
  "lead_id": 38,
  "message": "Duplicate lead detected"
}
```

**Response (Filtered):**
```json
{
  "success": true,
  "filtered": true,
  "reason": "AI determined this is not a relevant lead",
  "confidence": 25
}
```

### Get High Priority Leads

**GET /api/v1/leads/high-priority?limit=10**
```json
{
  "success": true,
  "leads": [
    {
      "id": 42,
      "city": "Burleson",
      "county": "Johnson",
      "jobType": "water_heater_repair",
      "aiScore": 85,
      "urgency": "high",
      "status": "new",
      "createdAt": "2026-01-19T10:30:00Z",
      "inPrimaryServiceArea": true,
      "ageHours": 2.5
    }
  ],
  "count": 1
}
```

### Get Lead Statistics

**GET /api/v1/leads/statistics**
```json
{
  "success": true,
  "statistics": {
    "total": 156,
    "byStatus": {
      "new": 12,
      "contacted": 8,
      "quoted": 5,
      "won": 98,
      "lost": 33
    },
    "avgScore": 67.5,
    "highConfidence": 45,
    "last7Days": 23,
    "last30Days": 89
  }
}
```

## 🚀 Setup Instructions

### 1. Run Database Migrations

```bash
# Make sure PostgreSQL is running
psql $DATABASE_URL < migrations/add_transaction_support.sql
psql $DATABASE_URL < migrations/add_leads_support.sql
```

Verify tables:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('leads', 'service_areas', 'notification_queue', 'lead_activity');
```

### 2. Configure Environment

Add to `.env`:
```bash
# Database (already configured)
DATABASE_URL=postgresql://user:pass@localhost:5432/plansiteos

# Anthropic API for AI analysis
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Notifications (optional - for future use)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
ALERT_PHONE_NUMBER=+1234567890

SENDGRID_API_KEY=your_key
ALERT_EMAIL=alerts@ctlplumbing.com
```

### 3. Start the API Server

```bash
cd /home/user/PlansiteOS/apps/api
npm start
```

Server runs on: `http://localhost:5000`

### 4. Test the Leads API

```bash
# Check API info
curl http://localhost:5000/api/v1

# Get lead statistics
curl http://localhost:5000/api/v1/leads/statistics

# Get service areas
curl http://localhost:5000/api/v1/leads/service-areas/all

# Submit test lead
curl -X POST http://localhost:5000/api/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "post_text": "Looking for plumber in Fort Worth for kitchen sink install",
    "post_url": "https://facebook.com/test/123",
    "author": "Test User",
    "group_name": "Fort Worth Homeowners"
  }'
```

## 📁 File Structure

```
PlansiteOS/
├── apps/api/src/
│   ├── modules/
│   │   ├── analytics/
│   │   │   └── analytics.service.js       # ✅ Analytics metrics
│   │   ├── leads/
│   │   │   ├── AIService.js               # ✅ Claude integration
│   │   │   └── leads.service.js           # ✅ Lead processing logic
│   │   ├── models/
│   │   │   ├── Lead.js                    # ✅ Lead database model
│   │   │   └── ServiceArea.js             # ✅ Service area model
│   │   └── utils/
│   │       └── validators.js              # ✅ Input validation
│   ├── routes/v1/
│   │   ├── analytics.routes.js            # ✅ Analytics endpoints
│   │   ├── leads.routes.js                # ✅ Leads endpoints
│   │   └── index.js                       # ✅ Route registration
│   ├── integrations/
│   │   └── NotificationService.js         # ✅ Notification handler
│   ├── platform/
│   │   └── config/
│   │       ├── constants.js               # ✅ AI threshold config
│   │       ├── database.js                # Database pool
│   │       └── TransactionManager.js      # Transaction handling
│   └── server.js                          # Server entry point
├── migrations/
│   ├── add_leads_support.sql              # ✅ Leads schema
│   └── add_transaction_support.sql        # Correlation & queues
├── ANALYTICS_IMPLEMENTATION.md            # ✅ Analytics docs
└── LEADS_IMPLEMENTATION.md                # ✅ This file
```

## 🔧 Troubleshooting

### Database Errors

**Problem:** `relation "leads" does not exist`

**Solution:**
```bash
psql $DATABASE_URL < migrations/add_leads_support.sql
```

### Duplicate Key Errors

**Problem:** Service areas already exist

**Solution:** The migration uses `ON CONFLICT DO NOTHING`, so this is safe to ignore.

### AI Analysis Fails

**Problem:** AI service times out or fails

**Solution:** The service includes fallback logic that creates leads with low confidence when AI fails, so leads are never lost.

### Import Errors

**Problem:** `Cannot find module '../models/Lead'`

**Solution:** All models have been created. Restart the server:
```bash
cd apps/api
npm start
```

## 🎯 Next Steps

### Immediate:
1. **Frontend Integration** - Connect React dashboard to leads API
2. **Testing** - Write unit/integration tests
3. **WebhookConfiguration** - Set up Facebook webhook for auto-capture

### Short Term:
4. **Notifications** - Implement Twilio SMS and SendGrid email
5. **Authentication** - Add user auth to protect endpoints
6. **Lead Assignment** - Auto-assign leads to team members
7. **Follow-up Scheduling** - Automated reminders

### Long Term:
8. **Machine Learning** - Improve AI scoring with historical data
9. **Multi-Channel** - Add Nextdoor, Angi, Thumbtack integrations
10. **Mobile App** - Lead management on the go
11. **Reporting** - Advanced analytics and conversion tracking

## 💡 Usage Examples

### Webhook Integration

For automated lead capture from Facebook:

```javascript
// Facebook webhook handler
app.post('/webhooks/facebook', async (req, res) => {
  const { entry } = req.body;

  for (const item of entry) {
    for (const change of item.changes) {
      if (change.field === 'feed') {
        const post = change.value;

        await axios.post('http://localhost:5000/api/v1/leads', {
          post_text: post.message,
          post_url: post.permalink_url,
          author: post.from.name,
          group_name: item.id,
          timestamp: new Date(post.created_time * 1000).toISOString()
        });
      }
    }
  }

  res.sendStatus(200);
});
```

### Manual Lead Entry

```javascript
// Frontend: Manual lead creation
const createLead = async (leadData) => {
  const response = await api.post('/api/v1/leads', {
    post_text: leadData.description,
    post_url: 'manual-entry',
    author: leadData.customerName,
    group_name: 'Manual Entry',
    timestamp: new Date().toISOString()
  });

  return response;
};
```

---

**Implementation Date:** 2026-01-19
**Status:** ✅ Complete and Ready for Testing
**Next Feature:** Frontend Integration & Notification Implementation
