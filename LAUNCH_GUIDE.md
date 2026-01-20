# 🚀 PlansiteOS Launch Guide

Complete step-by-step guide to launch your PlansiteOS application.

---

## Quick Launch (TL;DR)

```bash
# 1. Setup environment
cd /home/user/PlansiteOS
cp .env.example apps/api/.env  # Edit with your values
cp .env.example apps/web/.env  # Edit with your values

# 2. Install dependencies
cd apps/api && npm install
cd ../web && npm install

# 3. Setup database
psql $DATABASE_URL -f ../../migrations/add_leads_support.sql
psql $DATABASE_URL -f ../../migrations/add_user_authentication.sql
psql $DATABASE_URL -f ../../migrations/add_blueprint_analysis.sql

# 4. Start services (in separate terminals)
# Terminal 1 - Backend
cd apps/api && npm run dev

# Terminal 2 - Frontend
cd apps/web && npm run dev

# 5. Open browser
# http://localhost:3000 (or port shown in terminal)
```

---

## Detailed Launch Instructions

### Step 1: Configure Environment Variables

#### Backend Configuration

Create `/home/user/PlansiteOS/apps/api/.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/plansiteos

# Server
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Anthropic API (for Blueprint Analysis)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Twilio (optional - for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (optional - for email notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=notifications@yourcompany.com
SENDGRID_FROM_NAME="PlansiteOS Notifications"

# Notification Recipients
NOTIFICATION_PHONE_NUMBER=+1234567890
NOTIFICATION_EMAIL=admin@yourcompany.com

# File Uploads
UPLOAD_DIR=./uploads/blueprints
MAX_FILE_SIZE_MB=50
```

**Quick Create Command:**
```bash
cat > apps/api/.env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/plansiteos
PORT=5000
NODE_ENV=development
JWT_SECRET=change-this-to-a-random-32-character-string-for-production-use
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your-key-here
UPLOAD_DIR=./uploads/blueprints
MAX_FILE_SIZE_MB=50
EOF
```

#### Frontend Configuration

Create `/home/user/PlansiteOS/apps/web/.env`:

```bash
VITE_API_URL=http://localhost:5000
```

**Quick Create Command:**
```bash
cat > apps/web/.env << 'EOF'
VITE_API_URL=http://localhost:5000
EOF
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd /home/user/PlansiteOS/apps/api
npm install

# Install frontend dependencies
cd /home/user/PlansiteOS/apps/web
npm install
```

**Expected packages:**
- Backend: express, pg, bcrypt, jsonwebtoken, @anthropic-ai/sdk, twilio, @sendgrid/mail, multer, winston, etc.
- Frontend: react, react-router-dom, @tanstack/react-query, axios, react-hot-toast, lucide-react, etc.

### Step 3: Setup Database

#### Option A: Fresh Database Setup

```bash
# Create database
createdb plansiteos

# Or with psql
psql -U postgres -c "CREATE DATABASE plansiteos;"

# Run migrations in order
cd /home/user/PlansiteOS
psql $DATABASE_URL -f migrations/add_leads_support.sql
psql $DATABASE_URL -f migrations/add_user_authentication.sql
psql $DATABASE_URL -f migrations/add_blueprint_analysis.sql
```

#### Option B: If Database Exists

```bash
# Check existing tables
psql $DATABASE_URL -c "\dt"

# Run missing migrations only
# Check which tables exist and run only missing migrations
```

#### Verify Database Setup

```bash
# Check all tables were created
psql $DATABASE_URL << 'EOF'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
EOF
```

**Expected tables:**
- users
- user_sessions
- user_activity_log
- leads
- service_areas
- blueprints
- blueprint_fixtures

### Step 4: Create Upload Directory

```bash
cd /home/user/PlansiteOS/apps/api
mkdir -p uploads/blueprints
chmod 755 uploads/blueprints
```

### Step 5: Launch Backend Server

```bash
cd /home/user/PlansiteOS/apps/api

# Development mode (with hot reload)
npm run dev

# Or production mode
npm start
```

**Expected output:**
```
🚀 Server running on port 5000
✅ Database connected
📁 Upload directory ready
```

**Troubleshooting:**
- If port 5000 is taken, change PORT in .env
- If database connection fails, check DATABASE_URL
- If module errors occur, run `npm install` again

### Step 6: Launch Frontend Server

**In a new terminal:**

```bash
cd /home/user/PlansiteOS/apps/web

# Development mode
npm run dev

# Or production build
npm run build && npm run preview
```

**Expected output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Step 7: Access Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000 (or port shown in terminal)
- **Backend API**: http://localhost:5000/api/v1

### Step 8: Login

**Default Admin Account:**
- Email: `admin@ctlplumbing.com`
- Password: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

---

## Available Pages

Once logged in, you can access:

- **Dashboard**: `/` - Overview and statistics
- **Blueprints**: `/blueprints` - Upload and manage blueprints
- **Leads**: `/leads` - Manage leads and contacts
- **Bids**: `/bids` - Bidding management
- **Analytics**: `/analytics` - Analytics dashboard
- **Settings**: `/settings` - Application settings

---

## Testing the Features

### Test Authentication

1. Navigate to `/login`
2. Login with admin credentials
3. Verify redirect to dashboard
4. Check localStorage for tokens

### Test Leads Management

1. Navigate to `/leads`
2. View existing leads
3. Try filtering and searching
4. Update lead status

### Test Blueprint Upload

1. Navigate to `/blueprints`
2. Click "Upload Blueprint" button
3. Upload a test image (PNG, JPG, or PDF)
4. Enter project name
5. Click "Upload & Analyze"
6. Wait for processing
7. View analysis results

**Note**: Blueprint analysis requires valid ANTHROPIC_API_KEY in .env

---

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Cause**: PostgreSQL not running or wrong DATABASE_URL

**Solution:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Find process using port
lsof -ti:5000

# Kill process
kill -9 $(lsof -ti:5000)

# Or change PORT in apps/api/.env
```

### Issue: "Module not found"

**Solution:**
```bash
# Clear node_modules and reinstall
cd apps/api
rm -rf node_modules package-lock.json
npm install

cd ../web
rm -rf node_modules package-lock.json
npm install
```

### Issue: "ANTHROPIC_API_KEY not set"

**Solution:**
```bash
# Add to apps/api/.env
echo "ANTHROPIC_API_KEY=sk-ant-your-key" >> apps/api/.env

# Restart backend server
```

### Issue: "CORS errors in browser"

**Cause**: Frontend and backend on different origins

**Solution:**
Make sure VITE_API_URL in frontend .env matches backend URL:
```bash
# In apps/web/.env
VITE_API_URL=http://localhost:5000
```

### Issue: "Unauthorized (401)" errors

**Cause**: Expired or invalid token

**Solution:**
1. Clear browser localStorage
2. Re-login
3. Or use refresh token endpoint

---

## Development Workflow

### Running Both Services Simultaneously

**Option 1: Using tmux or screen**
```bash
# Install tmux
sudo apt install tmux

# Start tmux session
tmux new -s plansiteos

# Split window (Ctrl+B, then ")
# In first pane: cd apps/api && npm run dev
# In second pane: cd apps/web && npm run dev
```

**Option 2: Using PM2**
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'plansiteos-api',
      cwd: './apps/api',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'plansiteos-web',
      cwd: './apps/web',
      script: 'npm',
      args: 'run dev'
    }
  ]
};
EOF

# Start both services
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Stop all
pm2 stop all
```

**Option 3: Simple Shell Script**
```bash
# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
cd apps/api && npm run dev &
cd apps/web && npm run dev &
wait
EOF

chmod +x start.sh
./start.sh
```

### Watching Logs

```bash
# Backend logs
tail -f apps/api/logs/combined.log

# Database queries
psql $DATABASE_URL -c "SELECT * FROM user_activity_log ORDER BY created_at DESC LIMIT 10;"
```

---

## Production Deployment

### Build for Production

```bash
# Build frontend
cd apps/web
npm run build

# Output: apps/web/dist

# Backend (no build needed, but set NODE_ENV)
cd apps/api
export NODE_ENV=production
```

### Environment Variables for Production

**Update apps/api/.env:**
```bash
NODE_ENV=production
JWT_SECRET=<generate-strong-random-32+-char-string>
DATABASE_URL=<production-database-url>
ANTHROPIC_API_KEY=<production-api-key>
```

### Security Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET to strong random string
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable database SSL
- [ ] Set secure cookie flags
- [ ] Configure environment-specific .env files
- [ ] Remove .env from git (check .gitignore)

---

## Health Checks

### Backend Health

```bash
# Check API is running
curl http://localhost:5000/api/v1

# Expected response:
{
  "version": "1.0.0",
  "name": "PipelineOS API",
  "endpoints": {
    "auth": "/api/v1/auth",
    "blueprints": "/api/v1/blueprints",
    "bids": "/api/v1/bids",
    "analytics": "/api/v1/analytics",
    "leads": "/api/v1/leads"
  }
}
```

### Database Health

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check tables
psql $DATABASE_URL -c "\dt"

# Check user count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Frontend Health

```bash
# Open in browser
open http://localhost:3000

# Or check with curl
curl -I http://localhost:3000
```

---

## Useful Commands

### Database Management

```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup_20260119.sql

# Reset database (⚠️ DESTRUCTIVE)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
# Then re-run migrations
```

### User Management

```bash
# Create new user via SQL
psql $DATABASE_URL << 'EOF'
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('newuser@example.com', '$2b$10$...', 'New', 'User', 'user');
EOF

# Or use API endpoint
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "New",
    "lastName": "User"
  }'
```

---

## Performance Monitoring

### Check Resource Usage

```bash
# Node.js processes
ps aux | grep node

# Memory usage
free -h

# Disk space
df -h
```

### Database Performance

```bash
# Active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Long-running queries
psql $DATABASE_URL -c "
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '1 minute';
"
```

---

## Quick Reference

### Essential URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application UI |
| Backend API | http://localhost:5000/api/v1 | REST API |
| Login | http://localhost:3000/login | Authentication |
| Blueprints | http://localhost:3000/blueprints | Blueprint management |
| Leads | http://localhost:3000/leads | Lead management |

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ctlplumbing.com | admin123 |

### File Locations

| Purpose | Path |
|---------|------|
| Backend code | /home/user/PlansiteOS/apps/api |
| Frontend code | /home/user/PlansiteOS/apps/web |
| Migrations | /home/user/PlansiteOS/migrations |
| Uploads | /home/user/PlansiteOS/apps/api/uploads/blueprints |
| Backend .env | /home/user/PlansiteOS/apps/api/.env |
| Frontend .env | /home/user/PlansiteOS/apps/web/.env |

---

## Getting Help

1. **Check logs**: Look in terminal output or log files
2. **Review documentation**: Check README and feature guides
3. **Database issues**: Query database directly to debug
4. **API issues**: Use curl or Postman to test endpoints
5. **Frontend issues**: Check browser console for errors

---

## Summary

✅ **You're ready to launch!**

**Minimum requirements:**
1. Environment files configured (.env)
2. Dependencies installed (npm install)
3. Database migrations run
4. Upload directory created
5. Both servers running (backend + frontend)

**Optional for full features:**
- Anthropic API key (for blueprint analysis)
- Twilio credentials (for SMS notifications)
- SendGrid API key (for email notifications)

🚀 **Start developing!**

---

**Last Updated**: January 19, 2026
**PlansiteOS Version**: 1.0.0
