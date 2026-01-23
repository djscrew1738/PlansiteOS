# PlansiteOS Quick Start Guide

This guide will help you access and run PlansiteOS locally.

## Current Status

⚠️ **Important:** The app is not currently running. Follow the steps below to get it started.

---

## Prerequisites

- **Node.js** >= 18.0.0 (check: `node --version`)
- **npm** >= 9.0.0 (check: `npm --version`)
- **PostgreSQL** database (via Docker or local install)
- **Anthropic API Key** (get from https://console.anthropic.com/)

---

## Option 1: Quick Start with Docker (Recommended)

This is the fastest way to get everything running.

### Step 1: Create .env File

```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

### Step 2: Start with Docker Compose

```bash
# Start database and services
docker-compose up -d postgres redis

# Wait 5 seconds for database to be ready
sleep 5

# Run database migrations
docker-compose exec postgres psql -U plansite -d plansite -f /docker-entrypoint-initdb.d/migrations.sql
# (This may error if migrations aren't mounted - that's OK for now)
```

### Step 3: Install Dependencies & Start Backend

```bash
# Install backend dependencies (for /src - the actual backend)
npm install express dotenv pg winston cors multer @anthropic-ai/sdk

# Start the backend API
node src/app.js
```

You should see:
```
PlansiteOS API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Server running on port 5000
✓ Database connected
✓ AI service: configured
```

### Step 4: Start Frontend (In a new terminal)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

You should see:
```
VITE ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 5: Access the App

**Frontend:** http://localhost:5173/
**API:** http://localhost:5000/
**Health Check:** http://localhost:5000/health

---

## Option 2: Manual Setup (Without Docker)

### Step 1: Install PostgreSQL Locally

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE plansite;
CREATE USER plansite WITH PASSWORD 'plansite';
GRANT ALL PRIVILEGES ON DATABASE plansite TO plansite;
\q
```

### Step 3: Run Migrations

```bash
# Run migration files
psql -U plansite -d plansite -f database/migrations/001_init.sql
psql -U plansite -d plansite -f database/migrations/002_vector_store.sql
psql -U plansite -d plansite -f database/migrations/003_materialized_views.sql
```

### Step 4: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://plansite:plansite@localhost:5432/plansite
REDIS_URL=redis://localhost:6379/0
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Step 5: Install & Start Backend

```bash
# Install dependencies
npm install express dotenv pg winston cors multer @anthropic-ai/sdk

# Start backend
node src/app.js
```

### Step 6: Install & Start Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Option 3: Using the Configured Scripts (Needs Fix)

⚠️ **Note:** The package.json scripts currently reference `/backend` (Python) which isn't the active backend. Once we consolidate the architecture, this will work:

```bash
# After architecture consolidation:
npm run dev
```

---

## Accessing Different Parts

### Frontend (React)
- **URL:** http://localhost:5173
- **Features:**
  - Blueprint upload interface
  - Analysis results display
  - Fixture visualization

### Backend API (Node.js)
- **URL:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **API Docs:** See `docs/api/openapi.yaml`

### Key Endpoints
- `POST /api/blueprints/upload` - Upload blueprint
- `GET /api/blueprints` - List all blueprints
- `GET /api/blueprints/:id` - Get blueprint details
- `DELETE /api/blueprints/:id` - Delete blueprint
- `GET /api/blueprints/:id/summary` - Get fixture summary
- `POST /api/blueprints/:id/annotate` - Generate annotated blueprint

---

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:5000/health

# Upload a blueprint (replace with actual PDF path)
curl -X POST http://localhost:5000/api/blueprints/upload \
  -F "blueprint=@/path/to/blueprint.pdf" \
  -F "projectName=Test Project" \
  -F "projectAddress=123 Main St"

# List blueprints
curl http://localhost:5000/api/blueprints
```

### Using the Frontend

1. Open http://localhost:5173
2. Navigate to the upload page
3. Select a blueprint PDF file
4. Fill in project details
5. Click upload
6. View analysis results

---

## Troubleshooting

### "Cannot find module 'express'"
```bash
# Install dependencies
npm install express dotenv pg winston cors multer @anthropic-ai/sdk
```

### "Connection refused" on database
```bash
# Start PostgreSQL
docker-compose up -d postgres
# OR
brew services start postgresql@15
```

### "ANTHROPIC_API_KEY is not set"
```bash
# Edit .env file
nano .env
# Add: ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### "Port 5000 already in use"
```bash
# Change port in .env
PORT=5001

# Or kill existing process
lsof -ti:5000 | xargs kill -9
```

### Frontend can't connect to API
```bash
# Check API is running
curl http://localhost:5000/health

# Check CORS settings in .env
CORS_ORIGIN=http://localhost:5173
```

---

## Development Workflow

### 1. Make Code Changes

**Backend:** Edit files in `/src`
**Frontend:** Edit files in `/frontend/src`

### 2. Auto-Reload

**Backend:** Use nodemon for auto-restart
```bash
npm install -g nodemon
nodemon src/app.js
```

**Frontend:** Vite auto-reloads automatically

### 3. View Logs

**Backend:**
- Check terminal where `node src/app.js` is running
- Logs saved to `./logs/` directory

**Frontend:**
- Check browser console (F12)
- Check terminal where `npm run dev` is running

---

## Next Steps

Once you have the app running:

1. **Upload a test blueprint** - Use any plumbing blueprint PDF
2. **Check the analysis results** - See fixture detection in action
3. **Review the API docs** - `docs/api/openapi.yaml`
4. **Run tests** - `npm install --save-dev jest supertest && npm test`
5. **Read architecture docs** - `docs/ARCHITECTURE_ANALYSIS.md`

---

## Production Deployment

For production deployment, see:
- `docker-compose.prod.yml`
- `.env.production.example`
- `docs/PRODUCTION_CONFIG_REVIEW.md`

---

## Getting Help

- **API Documentation:** `docs/api/`
- **Architecture Docs:** `docs/ARCHITECTURE_ANALYSIS.md`
- **Issues:** https://github.com/djscrew1738/PlansiteOS/issues
- **Environment Variables:** See `.env.example` for all options

---

## Current Architecture Status

Based on the recent code review:

- **Active Backend:** `/src` (Node.js/Express)
- **Active Frontend:** `/frontend` (React/Vite)
- **Database:** PostgreSQL with comprehensive migrations
- **Status:** ⚠️ Architectural consolidation planned (see `docs/ARCHITECTURE_CONSOLIDATION_PLAN.md`)

The app is functional but in transition. See the architecture documentation for details.
