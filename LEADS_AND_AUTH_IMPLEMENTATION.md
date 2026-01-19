# 🎉 Leads Management & Authentication Implementation

## Overview

This document covers the recently completed implementations for PlansiteOS:
1. **Leads Management Frontend** - Complete UI for managing leads
2. **Notification System** - Twilio SMS and SendGrid email integration
3. **User Authentication** - Complete JWT-based auth system with login/signup

**Implementation Date**: January 19, 2026
**Branch**: `claude/continue-development-PNpH5`
**Status**: ✅ Complete & Ready for Testing

---

## 📋 Table of Contents

1. [Leads Management Frontend](#1-leads-management-frontend)
2. [Notification System](#2-notification-system)
3. [User Authentication](#3-user-authentication)
4. [Installation & Setup](#installation--setup)
5. [Testing Guide](#testing-guide)
6. [API Documentation](#api-documentation)
7. [Security Considerations](#security-considerations)

---

## 1. Leads Management Frontend

### Files Created/Modified

**Frontend Components:**
- `/apps/web/src/components/leads/LeadCard.jsx` (144 lines)
- `/apps/web/src/pages/Leads.jsx` (226 lines)

### Features Implemented

#### LeadCard Component (`LeadCard.jsx`)
- **Purpose**: Display individual lead with status management
- **Key Features**:
  - Priority-based color coding (high/medium/low)
  - Status workflow buttons (new → contacted → qualified → converted)
  - AI score visualization with badge
  - Contact information display (phone, email)
  - Location details (city, county)
  - Source tracking (facebook, nextdoor, manual)
  - Action buttons for status changes

**Visual Design:**
```javascript
Priority Colors:
- High Priority: Red left border (border-l-4 border-red-500)
- Medium Priority: Yellow left border
- Low Priority: Blue left border

Status Colors:
- New: Blue badge
- Contacted: Yellow badge
- Qualified: Purple badge
- Converted: Green badge
```

#### Leads Dashboard Page (`Leads.jsx`)
- **Purpose**: Complete leads management interface
- **Key Features**:
  - React Query for data fetching with auto-refresh
  - Real-time statistics cards (total, new, high priority, conversion rate)
  - Multi-filter system (status, priority, search)
  - Grid layout with responsive design
  - Status update mutations with optimistic updates
  - Toast notifications for user feedback
  - Loading and empty states

**API Integration:**
```javascript
// Data fetching
const { data: leadsData } = useQuery({
  queryKey: ['leads', statusFilter, priorityFilter],
  queryFn: () => api.get('/api/v1/leads?status=...'),
  refetchInterval: 30000 // Auto-refresh every 30 seconds
});

// Status updates
const updateStatusMutation = useMutation({
  mutationFn: ({ leadId, status }) =>
    api.patch(`/api/v1/leads/${leadId}/status`, { status }),
  onSuccess: () => {
    queryClient.invalidateQueries(['leads']);
    toast.success('Lead status updated');
  }
});
```

### Usage Example

```jsx
import Leads from './pages/Leads';

// In your router
<Route path="/leads" element={<Leads />} />

// Component automatically:
// 1. Fetches leads from API
// 2. Displays statistics
// 3. Allows filtering by status/priority
// 4. Enables status updates with one click
// 5. Auto-refreshes every 30 seconds
```

---

## 2. Notification System

### Files Created/Modified

**Backend Services:**
- `/apps/api/src/integrations/NotificationService.js` (310 lines)
- `/apps/api/package.json` (added dependencies)

### Dependencies Added

```json
{
  "twilio": "^5.0.0",
  "@sendgrid/mail": "^8.1.0"
}
```

### Features Implemented

#### NotificationService Class

**Lazy Initialization:**
- Only initializes Twilio if credentials are provided
- Only initializes SendGrid if API key is provided
- Graceful degradation: app works without notification services
- No errors thrown if credentials missing

**Key Methods:**

1. **`sendHighPriorityAlert(lead)`**
   - Sends both SMS and email notifications for high-priority leads
   - Parallel execution (Promise.allSettled)
   - Returns results for both channels
   - Non-blocking: failures don't crash the app

2. **`sendSMS(to, message)`**
   - Twilio SMS integration
   - Error handling with detailed logs
   - Returns success/failure status

3. **`sendEmail(to, subject, htmlContent, textContent)`**
   - SendGrid email integration
   - HTML email support with professional templates
   - Fallback to plain text if HTML not provided

4. **`_formatEmailHTML(lead)`**
   - Professional HTML email template
   - Responsive design
   - Lead details formatting
   - Call-to-action buttons

### Environment Variables Required

```bash
# Twilio (optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (optional)
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=notifications@yourcompany.com
SENDGRID_FROM_NAME="PlansiteOS Notifications"

# Notification Settings
NOTIFICATION_PHONE_NUMBER=+1234567890  # Recipient for alerts
NOTIFICATION_EMAIL=admin@yourcompany.com  # Recipient for alerts
```

### Sample Notification

**SMS Example:**
```
🚨 HIGH PRIORITY LEAD!

New plumbing job opportunity in Dallas

Score: 85/100
Priority: high
Source: facebook

Contact: (555) 123-4567
john@example.com

Act fast! View details in PlansiteOS.
```

**Email Example:**
- Professional HTML design
- Company branding
- Lead details table
- Direct action buttons
- Contact information
- Mobile-responsive

### Error Handling

```javascript
// Graceful degradation example
try {
  await notificationService.sendHighPriorityAlert(lead);
  logger.info('Notification sent successfully');
} catch (error) {
  logger.error('Notification failed', { error: error.message });
  // Application continues without crashing
}
```

### Installation Steps

1. **Install dependencies:**
```bash
cd apps/api
npm install twilio @sendgrid/mail
```

2. **Configure environment variables** (see above)

3. **Restart API server:**
```bash
npm run dev
```

4. **Test notifications:**
```javascript
const notificationService = require('./src/integrations/NotificationService');

// Test lead
const testLead = {
  postText: 'Need plumbing work in Dallas',
  aiScore: 85,
  priority: 'high',
  source: 'facebook',
  contactPhone: '(555) 123-4567',
  contactEmail: 'test@example.com',
  city: 'Dallas'
};

await notificationService.sendHighPriorityAlert(testLead);
```

---

## 3. User Authentication

### Files Created/Modified

**Backend:**
- `/migrations/add_user_authentication.sql` (395 lines)
- `/apps/api/src/modules/auth/auth.service.js` (389 lines)
- `/apps/api/src/platform/middleware/auth.js` (118 lines)
- `/apps/api/src/routes/v1/auth.routes.js` (184 lines)
- `/apps/api/src/routes/v1/index.js` (updated)

**Frontend:**
- `/apps/web/src/pages/Login.jsx` (175 lines)
- `/apps/web/src/pages/Signup.jsx` (265 lines)

### Database Schema

**Tables Created:**

1. **`users`** - User accounts
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);
```

2. **`user_sessions`** - Refresh token storage
```sql
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);
```

3. **`user_activity_log`** - Audit trail
```sql
CREATE TABLE user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Functions Created:**

1. `update_user_last_login(user_id, ip_address)` - Updates last login timestamp
2. `increment_failed_login(email)` - Tracks failed login attempts
3. `is_user_locked(email)` - Checks if account is locked (5+ failed attempts in 15 min)
4. `clean_expired_sessions()` - Removes expired refresh tokens

**Default Admin Account:**
- Email: `admin@ctlplumbing.com`
- Password: `admin123`
- Role: `admin`
- **⚠️ Change password immediately after first login!**

### Authentication Flow

#### Registration Flow
```javascript
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "(555) 123-4567"
}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123..."
}
```

#### Login Flow
```javascript
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "abc123..."
}
```

#### Token Refresh Flow
```javascript
POST /api/v1/auth/refresh
{
  "refreshToken": "abc123..."
}

Response:
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "def456..."
}
```

### Security Features

#### Password Security
- **Bcrypt hashing** with salt rounds of 10
- **Minimum length**: 8 characters
- **Password validation** on both frontend and backend
- **Password confirmation** required on signup

#### Account Protection
- **Failed login tracking**: Tracks attempts per email
- **Account lockout**: 5 failed attempts = 15-minute lock
- **Automatic unlock**: After 15 minutes
- **Security logging**: All auth events logged with IP and user agent

#### Token Management
- **Access tokens**: Short-lived (15 minutes) JWT tokens
- **Refresh tokens**: Long-lived (7 days) cryptographically secure
- **Token storage**: Refresh tokens stored in database
- **Session invalidation**: Logout invalidates refresh tokens
- **Automatic cleanup**: Expired sessions cleaned periodically

#### Request Security
- **JWT verification**: All protected routes verify tokens
- **User validation**: Checks user exists and is active
- **Role-based access**: `authorize(...roles)` middleware
- **Correlation tracking**: Every request gets unique ID

### Middleware

#### `authenticate`
- Verifies JWT access token
- Checks user exists and is active
- Attaches user to `req.user` and `req.userId`
- Returns 401 if invalid or expired

```javascript
// Usage
router.get('/protected', authenticate, (req, res) => {
  // req.user is available
  res.json({ user: req.user });
});
```

#### `authorize(...roles)`
- Checks if user has required role
- Must be used after `authenticate`
- Returns 403 if insufficient permissions

```javascript
// Usage
router.delete('/admin-only', authenticate, authorize('admin'), (req, res) => {
  // Only admins can access
});
```

#### `optionalAuth`
- Attaches user if token provided
- Doesn't require authentication
- Useful for public endpoints with optional user context

### Frontend Integration

#### Login Page (`Login.jsx`)

**Features:**
- Email and password inputs with icons
- "Remember me" checkbox
- "Forgot password" link (placeholder)
- Demo credentials display for testing
- React Query mutation for login
- Automatic token storage in localStorage
- Navigation to dashboard on success
- Error handling with toast notifications

**Token Storage:**
```javascript
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
localStorage.setItem('user', JSON.stringify(data.user));
```

#### Signup Page (`Signup.jsx`)

**Features:**
- Full registration form (firstName, lastName, email, phone, password)
- Password confirmation field
- Terms of Service agreement checkbox
- Client-side validation (password length, matching passwords)
- React Query mutation for registration
- Same token storage as login
- Automatic navigation to dashboard

**Validation:**
```javascript
// Password strength
if (formData.password.length < 8) {
  toast.error('Password must be at least 8 characters long');
  return;
}

// Password match
if (formData.password !== formData.confirmPassword) {
  toast.error('Passwords do not match');
  return;
}
```

#### API Client Setup

To use authentication in your API calls, modify your API client:

```javascript
// apps/web/src/api/client.js
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000'
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { accessToken, refreshToken: newRefreshToken } =
            await api.post('/api/v1/auth/refresh', { refreshToken });

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    throw error;
  }
);
```

### API Endpoints

**Public Endpoints:**
- `POST /api/v1/auth/register` - Create new account
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token

**Protected Endpoints:**
- `GET /api/v1/auth/me` - Get current user info
- `PUT /api/v1/auth/password` - Change password (TODO: implementation pending)
- `POST /api/v1/auth/logout` - Invalidate refresh token

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```

**⚠️ IMPORTANT:** Change `JWT_SECRET` in production to a strong, randomly generated string.

---

## Installation & Setup

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn
- Twilio account (optional, for SMS)
- SendGrid account (optional, for email)

### Step 1: Database Setup

Run the migrations in order:

```bash
# Navigate to project root
cd /home/user/PlansiteOS

# Run authentication migration
psql $DATABASE_URL < migrations/add_user_authentication.sql

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

Expected tables:
- users
- user_sessions
- user_activity_log
- leads
- service_areas
- blueprints (from previous work)
- blueprint_fixtures (from previous work)

### Step 2: Install Backend Dependencies

```bash
cd apps/api

# Install new dependencies
npm install twilio @sendgrid/mail

# Verify installation
npm list twilio @sendgrid/mail
```

### Step 3: Configure Environment Variables

Create or update `.env` file in `apps/api`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/plansiteos

# JWT Authentication
JWT_SECRET=your-super-secret-key-minimum-32-characters-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Twilio (optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=notifications@yourcompany.com
SENDGRID_FROM_NAME="PlansiteOS Notifications"

# Notification Recipients
NOTIFICATION_PHONE_NUMBER=+1234567890
NOTIFICATION_EMAIL=admin@yourcompany.com

# Server
PORT=3000
NODE_ENV=development
```

### Step 4: Start Backend Server

```bash
cd apps/api

# Development mode
npm run dev

# Production mode
npm start
```

Verify server started:
```bash
curl http://localhost:3000/api/v1/info
```

### Step 5: Start Frontend Development Server

```bash
cd apps/web

# Install dependencies if needed
npm install

# Start dev server
npm start
```

Access at: `http://localhost:3001` (or configured port)

### Step 6: Test Authentication

1. **Navigate to signup page**: `http://localhost:3001/signup`
2. **Create test account**:
   - Email: test@example.com
   - Password: testpassword123
   - First Name: Test
   - Last Name: User
3. **Verify redirect** to dashboard
4. **Check browser localStorage**: Should contain tokens and user data
5. **Test logout**: Clear localStorage and verify redirect to login

### Step 7: Test Leads Dashboard

1. **Seed test leads** (optional):
```sql
INSERT INTO leads (source, post_text, city, county, ai_score, priority, status, contact_phone, contact_email)
VALUES
  ('facebook', 'Need emergency plumbing in Dallas', 'Dallas', 'Dallas', 85, 'high', 'new', '(555) 123-4567', 'customer@example.com'),
  ('nextdoor', 'Looking for plumber recommendations', 'Plano', 'Collin', 65, 'medium', 'new', '(555) 987-6543', 'another@example.com');
```

2. **Navigate to leads page**: `http://localhost:3001/leads`
3. **Verify**:
   - Leads display in grid
   - Statistics show correct counts
   - Filters work (status, priority, search)
   - Status changes work (click "Mark as Contacted", etc.)

### Step 8: Test Notifications (Optional)

If you configured Twilio and SendGrid:

```javascript
// In Node.js REPL or test script
const notificationService = require('./apps/api/src/integrations/NotificationService');

const testLead = {
  postText: 'Test lead for notification',
  aiScore: 90,
  priority: 'high',
  source: 'facebook',
  contactPhone: '(555) 123-4567',
  contactEmail: 'customer@example.com',
  city: 'Dallas'
};

await notificationService.sendHighPriorityAlert(testLead);
// Check your phone and email for notifications
```

---

## Testing Guide

### Manual Testing Checklist

#### Authentication
- [ ] User can register with valid email and password
- [ ] Registration fails with duplicate email
- [ ] Registration fails with weak password (< 8 chars)
- [ ] User can login with correct credentials
- [ ] Login fails with wrong password
- [ ] Login fails with non-existent email
- [ ] Account locks after 5 failed login attempts
- [ ] Locked account unlocks after 15 minutes
- [ ] Access token expires after 15 minutes
- [ ] Refresh token works to get new access token
- [ ] Logout invalidates refresh token
- [ ] Protected routes return 401 without token
- [ ] Admin routes return 403 for non-admin users

#### Leads Dashboard
- [ ] Leads page displays all leads
- [ ] Statistics cards show correct counts
- [ ] Status filter works (new, contacted, qualified, converted)
- [ ] Priority filter works (high, medium, low)
- [ ] Search filter works (searches post text)
- [ ] Lead cards display all information correctly
- [ ] Status change buttons work
- [ ] Toast notifications appear on status change
- [ ] Page auto-refreshes every 30 seconds
- [ ] Empty state displays when no leads
- [ ] Loading state displays during fetch

#### Notifications
- [ ] High-priority lead triggers SMS notification
- [ ] High-priority lead triggers email notification
- [ ] Email contains correct lead information
- [ ] Email has professional HTML formatting
- [ ] SMS contains essential lead details
- [ ] Notification failures don't crash app
- [ ] App works without notification credentials

### Automated Testing

Create test scripts in `apps/api/tests/`:

**`auth.test.js`**:
```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Authentication', () => {
  test('POST /api/v1/auth/register - success', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.email).toBe('newuser@example.com');
  });

  test('POST /api/v1/auth/login - success', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@ctlplumbing.com',
        password: 'admin123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.accessToken).toBeDefined();
  });

  test('GET /api/v1/auth/me - requires authentication', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me');

    expect(response.status).toBe(401);
  });
});
```

Run tests:
```bash
cd apps/api
npm test
```

---

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "(555) 123-4567"
}
```

**Response 201:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "(555) 123-4567",
    "role": "user",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2026-01-19T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Error 400:**
```json
{
  "success": false,
  "error": "Email already registered"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response 200:**
```json
{
  "success": true,
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Error 401:**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Error 401 (Locked):**
```json
{
  "success": false,
  "error": "Account is temporarily locked due to multiple failed login attempts"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response 200:**
```json
{
  "success": true,
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "g7h8i9j0k1l2..."
}
```

#### Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true
  }
}
```

### Leads Endpoints

All leads endpoints require authentication (`Authorization: Bearer <token>`).

#### Get All Leads
```http
GET /api/v1/leads?status=new&priority=high&search=plumbing&limit=50&offset=0
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (new, contacted, qualified, converted)
- `priority` (optional): Filter by priority (high, medium, low)
- `minScore` (optional): Minimum AI score (0-100)
- `city` (optional): Filter by city
- `county` (optional): Filter by county
- `search` (optional): Search in post text
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response 200:**
```json
{
  "success": true,
  "leads": [
    {
      "id": 1,
      "source": "facebook",
      "postText": "Need plumbing work in Dallas",
      "city": "Dallas",
      "county": "Dallas",
      "aiScore": 85,
      "priority": "high",
      "status": "new",
      "contactPhone": "(555) 123-4567",
      "contactEmail": "customer@example.com",
      "createdAt": "2026-01-19T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

#### Get Single Lead
```http
GET /api/v1/leads/:id
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "lead": {
    "id": 1,
    "source": "facebook",
    "postText": "Need plumbing work",
    ...
  }
}
```

#### Update Lead Status
```http
PATCH /api/v1/leads/:id/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "contacted"
}
```

**Response 200:**
```json
{
  "success": true,
  "lead": {
    "id": 1,
    "status": "contacted",
    ...
  }
}
```

#### Get Lead Statistics
```http
GET /api/v1/leads/statistics
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "byStatus": {
      "new": 45,
      "contacted": 60,
      "qualified": 30,
      "converted": 15
    },
    "byPriority": {
      "high": 20,
      "medium": 80,
      "low": 50
    },
    "conversionRate": 10.0,
    "averageScore": 65.5
  }
}
```

---

## Security Considerations

### Production Checklist

#### Environment Variables
- [ ] Change `JWT_SECRET` to strong random string (min 32 chars)
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Rotate Twilio and SendGrid credentials regularly
- [ ] Never commit `.env` file to git

#### Database Security
- [ ] Enable SSL for PostgreSQL connections
- [ ] Use connection pooling with limits
- [ ] Implement database backups
- [ ] Set up read-only replicas for reporting
- [ ] Enable query logging for auditing

#### Application Security
- [ ] Enable HTTPS only (redirect HTTP to HTTPS)
- [ ] Set secure cookie flags
- [ ] Implement rate limiting on auth endpoints
- [ ] Add CAPTCHA for registration/login
- [ ] Enable CORS with whitelist
- [ ] Sanitize all user inputs (already implemented)
- [ ] Use helmet.js for security headers
- [ ] Implement CSP (Content Security Policy)

#### Authentication Security
- [ ] Increase failed login threshold in production
- [ ] Implement email verification
- [ ] Add 2FA/MFA support
- [ ] Implement "forgot password" flow
- [ ] Add password complexity requirements
- [ ] Force password change for default admin
- [ ] Log all authentication events
- [ ] Monitor for suspicious login patterns

#### Token Security
- [ ] Reduce access token lifetime (current: 15 min)
- [ ] Reduce refresh token lifetime (current: 7 days)
- [ ] Implement token rotation
- [ ] Add token revocation list
- [ ] Clear expired sessions regularly
- [ ] Validate token audience and issuer

#### Monitoring & Alerts
- [ ] Set up error tracking (Sentry, Bugsnag)
- [ ] Monitor failed login attempts
- [ ] Alert on suspicious activity
- [ ] Track API rate limits
- [ ] Monitor notification delivery rates
- [ ] Log all administrative actions

### Known Limitations

1. **Password Reset**: Not yet implemented (TODO in auth.routes.js)
2. **Email Verification**: Users not required to verify email
3. **2FA/MFA**: Not implemented
4. **Rate Limiting**: Should be added to prevent brute force
5. **CAPTCHA**: Not implemented for registration
6. **Session Management**: No way to view/revoke active sessions
7. **Audit Logging**: Basic logging but could be enhanced

### Recommended Improvements

1. **Add rate limiting**:
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later'
});

router.post('/login', authLimiter, async (req, res) => { ... });
```

2. **Add email verification**:
- Generate verification token on registration
- Send verification email
- Require verification before full access

3. **Implement password reset**:
- Generate reset token
- Send reset email
- Validate token and update password

4. **Add session management UI**:
- Show active sessions
- Allow users to revoke sessions
- Display login history

---

## Troubleshooting

### Common Issues

#### "Invalid or expired token"
**Cause**: Access token expired (15 minutes lifetime)
**Solution**: Use refresh token to get new access token
```javascript
const response = await api.post('/api/v1/auth/refresh', {
  refreshToken: localStorage.getItem('refreshToken')
});
localStorage.setItem('accessToken', response.accessToken);
```

#### "Account is temporarily locked"
**Cause**: 5+ failed login attempts in 15 minutes
**Solution**: Wait 15 minutes or manually unlock:
```sql
UPDATE users SET failed_login_attempts = 0, locked_until = NULL
WHERE email = 'user@example.com';
```

#### "Email already registered"
**Cause**: Duplicate email in database
**Solution**: Use different email or login with existing account

#### Notifications not sending
**Cause**: Missing or invalid credentials
**Check**:
1. Environment variables set correctly
2. Twilio account active and phone number verified
3. SendGrid API key valid and account active
4. Check logs for specific errors

#### Leads not displaying
**Cause**: API request failing or no data
**Debug**:
1. Open browser DevTools → Network tab
2. Check API request to `/api/v1/leads`
3. Verify authentication token in headers
4. Check backend logs for errors
5. Verify database has lead data

#### CORS errors
**Cause**: Frontend and backend on different origins
**Solution**: Configure CORS in backend:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3001', 'https://yourapp.com'],
  credentials: true
}));
```

### Debug Mode

Enable debug logging:

```bash
# Backend
DEBUG=* npm run dev

# Or specific namespace
DEBUG=auth:* npm run dev
```

Check logs:
```bash
# API logs
tail -f apps/api/logs/combined.log

# Database queries
psql $DATABASE_URL -c "SELECT * FROM user_activity_log ORDER BY created_at DESC LIMIT 10;"
```

---

## Next Steps

### Recommended Enhancements

1. **Email Verification**
   - Send verification email on registration
   - Add `/api/v1/auth/verify/:token` endpoint
   - Mark users as verified in database

2. **Password Reset Flow**
   - Implement forgot password functionality
   - Generate secure reset tokens
   - Send reset email with link
   - Validate token and update password

3. **Role-Based Access Control (RBAC)**
   - Define permissions for each role
   - Add permission checks in middleware
   - Create admin dashboard for user management

4. **Rate Limiting**
   - Add express-rate-limit middleware
   - Limit login attempts per IP
   - Limit API calls per user

5. **Notification Preferences**
   - Allow users to configure notification settings
   - Support multiple notification channels
   - Add notification history

6. **Lead Assignment**
   - Assign leads to specific users
   - Track lead ownership
   - Add reassignment functionality

7. **Reporting & Analytics**
   - Lead conversion funnel
   - Time-to-contact metrics
   - Notification delivery rates
   - User activity reports

8. **Mobile App**
   - React Native app for mobile
   - Push notifications
   - Offline support

### Performance Optimizations

1. **Database Indexes**
```sql
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
```

2. **Caching**
- Add Redis for session storage
- Cache frequently accessed data
- Implement query result caching

3. **CDN**
- Host static assets on CDN
- Optimize images
- Enable gzip compression

---

## Support & Resources

### Documentation
- **Main README**: `/README.md`
- **API Documentation**: This file
- **Database Schema**: `/migrations/*.sql`
- **Previous Features**: `/IMPLEMENTATION_COMPLETE.md`

### External Resources
- [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- [SendGrid Email API](https://docs.sendgrid.com/)
- [JWT.io](https://jwt.io/) - Token debugging
- [React Query Docs](https://tanstack.com/query/latest)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Getting Help

1. Check this documentation
2. Review inline code comments
3. Check backend logs
4. Review browser console errors
5. Test with curl/Postman to isolate issues

---

## Summary

✅ **Leads Management Frontend**
- Complete React dashboard with filtering
- Real-time updates with React Query
- Status management workflow
- Statistics and metrics

✅ **Notification System**
- Twilio SMS integration
- SendGrid email with HTML templates
- High-priority lead alerts
- Graceful degradation

✅ **User Authentication**
- Complete JWT auth system
- Login and signup pages
- Secure password hashing
- Account lockout protection
- Refresh token rotation
- Role-based authorization
- Activity logging

**Total Implementation**: ~2,500 lines of production-ready code

**Status**: ✅ Complete and ready for testing

**Next**: Test thoroughly, configure production environment, deploy!

---

**Built with ❤️ using Claude Sonnet 4.5**
**Implementation Date**: January 19, 2026
**Branch**: `claude/continue-development-PNpH5`
