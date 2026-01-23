# Architecture Consolidation Plan

**Project:** PlansiteOS v2.0
**Date:** 2026-01-23
**Goal:** Consolidate 3 backends + 2 frontends into single coherent monorepo architecture

---

## Selected Architecture: Monorepo (Option A)

**Rationale:**
- `/apps` structure already exists with better organization
- `/apps/web` is more feature-complete than `/frontend`
- `/apps/api` has better modular structure than `/src`
- Turbo.json already configured for monorepo builds
- Allows independent deployment of services
- Better code sharing via packages

---

## Migration Strategy

### Phase 1: Code Audit & Backup (Day 1)

#### Tasks:
- [x] Document all existing structures
- [ ] Create git tag `pre-consolidation-v2.0.0`
- [ ] Verify all tests pass (if any exist)
- [ ] Document current environment variables
- [ ] List all active API endpoints

#### Commands:
```bash
# Create backup tag
git tag -a pre-consolidation-v2.0.0 -m "Backup before architecture consolidation"
git push origin pre-consolidation-v2.0.0

# Document current structure
find . -name "package.json" -not -path "*/node_modules/*" -exec echo {} \; -exec cat {} \;

# List all routes
grep -r "router\." src/routes/ apps/api/src/
```

---

### Phase 2: Backend Consolidation (Days 2-3)

#### Goal: Merge `/src` into `/apps/api` preserving best of both

**Strategy:** `/apps/api` has better structure, `/src` has more complete features

#### 2.1 Merge Service Layer

**Actions:**
1. Copy complete implementations from `/src/services/` to `/apps/api/src/modules/`
2. Preserve modular structure of `/apps/api`
3. Update imports to use new paths

**File Mapping:**
```
/src/services/BlueprintService.js
  → /apps/api/src/modules/blueprints/blueprints.service.js
  (Merge features, keep modular structure)

/src/services/BlueprintVisualizationService.js
  → /apps/api/src/modules/blueprints/visualization.service.js
  (Keep separate concerns)

/src/services/AIService.js
  → /packages/ai-core/src/claude-provider.js
  (Make it shareable)

/src/services/LeadProcessingService.js
  → /apps/api/src/modules/leads/leads.service.js

/src/services/NotificationService.js
  → /apps/api/src/platform/services/notifications.service.js
  (Shared infrastructure)

/src/services/CronService.js
  → /apps/worker/src/scheduler.js
  (Move to worker service)
```

#### 2.2 Merge Route Layer

**Actions:**
```
/src/routes/blueprints.js
  → /apps/api/src/modules/blueprints/blueprints.routes.js
  (Module-based routing)
```

#### 2.3 Merge Utilities

**Actions:**
```
/src/utils/CircuitBreaker.js     → /packages/shared/src/circuit-breaker/
/src/utils/CorrelationId.js      → /packages/shared/src/correlation-id/
/src/utils/TransactionManager.js → /packages/db/src/transaction-manager.js
/src/utils/fileUpload.js         → /apps/api/src/platform/middleware/fileUpload.js
/src/utils/logger.js             → /packages/shared/src/logger/
```

#### 2.4 Update Main App

**File:** `/apps/api/src/app.js`

**Merge:**
- CORS configuration from `/src/app.js`
- Security headers
- Middleware stack
- Error handlers

#### 2.5 Configuration

**Merge:**
```
/src/config/database.js → /packages/db/src/connection.js
```

**Create new:**
```
/apps/api/src/config/
├── index.js
├── cors.config.js
├── security.config.js
└── app.config.js
```

---

### Phase 3: Frontend Consolidation (Day 4)

#### Goal: Merge `/frontend` into `/apps/web`

**Strategy:** `/apps/web` is more complete, cherry-pick missing features from `/frontend`

#### 3.1 Compare Component Libraries

**Check for unique components in `/frontend/src/components/` not in `/apps/web/src/components/`**

```bash
# List all components
ls -R frontend/src/components/
ls -R apps/web/src/components/

# Merge unique ones
```

#### 3.2 PWA Configuration

**Consolidate:**
```
/frontend/public/sw.js           → /apps/web/public/sw.js (if better)
/frontend/public/manifest.json   → /apps/web/public/manifest.json (merge)
```

#### 3.3 Styling

**Check:**
- `/frontend/src/styles.css` vs `/apps/web/src/styles/index.css`
- Keep Tailwind config from `/apps/web` (more complete)

---

### Phase 4: Packages Setup (Day 5)

#### Goal: Convert `packages_temp/` to proper packages

#### 4.1 Rename Directory
```bash
mv packages_temp packages
```

#### 4.2 Update Package Names

**packages/db/package.json:**
```json
{
  "name": "@plansiteos/db",
  "version": "1.0.0",
  "main": "src/index.js",
  "exports": {
    ".": "./src/index.js",
    "./transaction": "./src/transaction-manager.js",
    "./connection": "./src/connection.js"
  }
}
```

**packages/shared/package.json:**
```json
{
  "name": "@plansiteos/shared",
  "version": "1.0.0",
  "exports": {
    "./logger": "./src/logger/index.js",
    "./circuit-breaker": "./src/circuit-breaker/index.js",
    "./correlation-id": "./src/correlation-id/index.js"
  }
}
```

**packages/ai-core/package.json:**
```json
{
  "name": "@plansiteos/ai-core",
  "version": "1.0.0",
  "exports": {
    "./claude": "./src/providers/claude-provider.js",
    "./prompts": "./src/prompts/index.js"
  }
}
```

#### 4.3 Create Package Entry Points

**packages/db/src/index.js:**
```javascript
module.exports = {
  getConnection: require('./connection'),
  TransactionManager: require('./transaction-manager'),
};
```

**packages/shared/src/index.js:**
```javascript
module.exports = {
  logger: require('./logger'),
  CircuitBreaker: require('./circuit-breaker'),
  CorrelationId: require('./correlation-id'),
};
```

---

### Phase 5: Root Configuration (Day 6)

#### 5.1 Update package.json

**File:** `/package.json`

```json
{
  "name": "plansiteos",
  "version": "2.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=@plansiteos/api",
    "dev:web": "turbo run dev --filter=@plansiteos/web",
    "dev:worker": "turbo run dev --filter=@plansiteos/worker",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:integration": "turbo run test:integration",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:migrate": "cd database && ./run_migrations.sh"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.2",
    "eslint": "^9.39.2",
    "globals": "^17.0.0",
    "prettier": "^3.0.0",
    "turbo": "^1.10.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

#### 5.2 Update turbo.json

**File:** `/turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "cache": false
    },
    "test:integration": {
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

### Phase 6: Database Consolidation (Day 7)

#### Goal: Single source of truth for migrations

#### 6.1 Consolidate Migrations

**Keep:** `/database/migrations/` (most comprehensive)

**Delete:**
- `/migrations/` (old location)
- `/backend/migrations/` (Python/Alembic - not used)

#### 6.2 Migration Script

**File:** `/database/run_migrations.sh`

Ensure it:
- Checks for required environment variables
- Backs up database before migrations
- Runs migrations in order
- Validates schema after completion

#### 6.3 Migration Documentation

**Create:** `/database/README.md`

```markdown
# Database Migrations

## Running Migrations

```bash
# Development
npm run db:migrate

# Production
DB_URL=postgresql://... ./database/run_migrations.sh
```

## Creating New Migrations

1. Create file: `database/migrations/00X_description.sql`
2. Follow naming convention
3. Test locally
4. Add to version control
```

---

### Phase 7: Cleanup (Day 8)

#### Delete Unused Code

```bash
# Delete Python backend (not used)
rm -rf backend/

# Delete old frontend (merged to apps/web)
rm -rf frontend/

# Delete old backend (merged to apps/api)
rm -rf src/

# Delete old migrations
rm -rf migrations/

# Delete temporary packages marker
# (already renamed to packages/)
```

#### Move Documentation

**Reorganize docs:**
```
/docs
├── README.md                          # Entry point
├── architecture/
│   ├── overview.md
│   ├── monorepo-structure.md         # NEW
│   └── database-schema.md
├── api/
│   └── openapi.yaml                  # To be created
├── guides/
│   ├── getting-started.md
│   ├── development.md
│   ├── testing.md
│   └── deployment.md
└── history/
    ├── ARCHITECTURE_ANALYSIS.md      # Move from root
    └── ARCHITECTURE_CONSOLIDATION_PLAN.md
```

**Delete obsolete docs:**
- GITHUB_UPLOAD.md (outdated)
- MIGRATION_COMPLETE.md (historical)
- IMPLEMENTATION_COMPLETE.md (outdated)

**Keep in root:**
- README.md
- LICENSE
- .env.example (to be updated)

---

### Phase 8: Update Configuration Files (Day 9)

#### 8.1 Docker Compose

**Update:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    # ... existing config

  redis:
    # ... existing config

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./apps/web:/app/apps/web

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    depends_on:
      - postgres
      - redis
```

#### 8.2 Dockerfiles

**Create:** `apps/api/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/

# Install dependencies
RUN npm ci

# Copy source
COPY apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 5000

CMD ["npm", "start"]
```

**Similar for:** `apps/web/Dockerfile`, `apps/worker/Dockerfile`

#### 8.3 GitHub Actions

**Create:** `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:integration

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
```

---

### Phase 9: Import Path Updates (Day 10)

#### Update All Imports

**Old pattern:**
```javascript
const db = require('../../../config/database');
const logger = require('../../../utils/logger');
```

**New pattern:**
```javascript
const { getConnection } = require('@plansiteos/db');
const { logger } = require('@plansiteos/shared');
```

#### Find and Replace Commands

```bash
# Update database imports
find apps/api -name "*.js" -exec sed -i \
  "s|require('../config/database')|require('@plansiteos/db')|g" {} \;

# Update logger imports
find apps/api -name "*.js" -exec sed -i \
  "s|require('../utils/logger')|require('@plansiteos/shared/logger')|g" {} \;

# Update circuit breaker imports
find apps/api -name "*.js" -exec sed -i \
  "s|require('../utils/CircuitBreaker')|require('@plansiteos/shared/circuit-breaker')|g" {} \;
```

---

### Phase 10: Testing & Validation (Day 11-12)

#### 10.1 Installation Test

```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install

# Verify workspaces
npm ls --workspaces
```

#### 10.2 Build Test

```bash
# Build all packages
npm run build

# Check for errors
echo $?  # Should be 0
```

#### 10.3 Development Test

```bash
# Start API
npm run dev:api

# In another terminal, test endpoints
curl http://localhost:5000/health

# Start web
npm run dev:web

# Visit http://localhost:3000
```

#### 10.4 Database Migration Test

```bash
# Run migrations
npm run db:migrate

# Verify schema
psql $DATABASE_URL -c "\dt"
```

#### 10.5 Integration Test

**Create:** `apps/api/tests/integration/blueprint-upload.test.js`

Test complete flow:
1. Upload blueprint file
2. Verify database record created
3. Check AI analysis triggered
4. Validate response format

---

## Rollback Plan

**If consolidation fails:**

```bash
# Revert to backup tag
git reset --hard pre-consolidation-v2.0.0

# Force push if needed (careful!)
git push origin HEAD --force

# Or create revert branch
git checkout -b revert-consolidation
```

---

## Success Criteria

- [ ] Single `package.json` workspace configuration
- [ ] All apps run with `npm run dev`
- [ ] All tests pass
- [ ] Build completes without errors
- [ ] Docker Compose up works
- [ ] No duplicate code
- [ ] All imports use @plansiteos/* packages
- [ ] Documentation updated
- [ ] CI/CD pipeline green
- [ ] Production deployment successful

---

## Timeline Summary

| Phase | Days | Status |
|-------|------|--------|
| 1. Code Audit | 1 | ⏳ In Progress |
| 2. Backend Consolidation | 2 | ⏸️ Pending |
| 3. Frontend Consolidation | 1 | ⏸️ Pending |
| 4. Packages Setup | 1 | ⏸️ Pending |
| 5. Root Configuration | 1 | ⏸️ Pending |
| 6. Database Consolidation | 1 | ⏸️ Pending |
| 7. Cleanup | 1 | ⏸️ Pending |
| 8. Configuration Updates | 1 | ⏸️ Pending |
| 9. Import Updates | 1 | ⏸️ Pending |
| 10. Testing | 2 | ⏸️ Pending |
| **Total** | **12 days** | |

---

## Post-Consolidation Tasks

1. Update README.md with new structure
2. Create onboarding guide for new developers
3. Set up pre-commit hooks (husky + lint-staged)
4. Configure renovatebot for dependency updates
5. Set up Sentry for error tracking
6. Configure feature flags system
7. Create staging environment
8. Performance testing
9. Security audit
10. Update deployment documentation

---

## Notes

- Preserve git history where possible
- Use `git mv` instead of `rm + create` for tracking
- Test after each phase
- Document any blockers immediately
- Keep stakeholders informed of progress

---

**Next Step:** Execute Phase 1 - Code Audit
