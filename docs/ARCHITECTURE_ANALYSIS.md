# PlansiteOS Architecture Analysis

**Date:** 2026-01-23
**Status:** Critical - Multiple Conflicting Architectures Detected

## Executive Summary

PlansiteOS currently has **THREE separate backend implementations** and **TWO separate frontend implementations** running concurrently. This creates significant confusion, maintenance overhead, and deployment complexity.

## Current Architecture Map

### Backend Implementations

#### 1. Python FastAPI Backend (`/backend`)
- **Language:** Python 3.x
- **Framework:** FastAPI + SQLAlchemy
- **Location:** `/backend`
- **Entry Point:** `backend/app/main.py`
- **Database:** PostgreSQL via SQLAlchemy ORM
- **Status:** ⚠️ Partial implementation
- **Purpose:** Original backend (possibly legacy)

**Key Files:**
- `backend/requirements.txt` - Python dependencies
- `backend/alembic.ini` - Database migrations
- `backend/Dockerfile` - Container configuration

---

#### 2. Node.js Express Backend (`/src`)
- **Language:** Node.js (CommonJS)
- **Framework:** Express.js
- **Location:** `/src`
- **Entry Point:** `src/app.js`
- **Database:** PostgreSQL via raw `pg` queries
- **Status:** ✅ **ACTIVE - Most Complete Implementation**
- **Purpose:** Current production backend

**Key Features:**
- Blueprint upload and AI analysis
- Claude API integration with circuit breaker
- Transaction management
- Correlation ID tracking
- File upload handling
- Comprehensive error handling

**Structure:**
```
/src
├── app.js                    # Express server
├── config/
│   └── database.js          # PostgreSQL connection
├── middleware/
│   └── correlationId.js     # Request tracking
├── routes/
│   └── blueprints.js        # API endpoints
├── services/
│   ├── BlueprintService.js              # AI analysis
│   ├── BlueprintVisualizationService.js # Image processing
│   ├── AIService.js
│   ├── CronService.js
│   ├── LeadProcessingService.js
│   └── NotificationService.js
└── utils/
    ├── CircuitBreaker.js
    ├── CorrelationId.js
    ├── TransactionManager.js
    ├── fileUpload.js
    └── logger.js
```

---

#### 3. Node.js Monorepo API (`/apps/api`)
- **Language:** Node.js (CommonJS)
- **Framework:** Express.js
- **Location:** `/apps/api`
- **Entry Point:** `apps/api/src/server.js`
- **Status:** 🚧 Under Development (PipelineOS branding)
- **Purpose:** Future monorepo architecture

**Structure:**
```
/apps/api/src
├── server.js
├── app.js
├── modules/              # Domain-driven design
│   ├── blueprints/
│   ├── bids/
│   ├── leads/
│   └── models/
├── platform/             # Shared infrastructure
│   ├── middleware/
│   ├── config/
│   └── database/
└── integrations/         # External services
```

**Differences from `/src`:**
- Module-based organization (DDD approach)
- Named `@pipelineos/api` (rebranding?)
- Test infrastructure configured (Jest)
- More modern structure
- **Potentially duplicates `/src` functionality**

---

### Frontend Implementations

#### 1. React Frontend (`/frontend`)
- **Framework:** React + Vite + TypeScript
- **Location:** `/frontend`
- **Status:** ✅ Active (referenced in root package.json)
- **Features:**
  - PWA support (service worker, manifest)
  - TypeScript configuration
  - Minimal component structure

**Structure:**
```
/frontend/src
├── main.tsx
├── App.tsx
├── components/
├── pages/
└── styles.css
```

---

#### 2. React Web App (`/apps/web`)
- **Framework:** React + Vite + Tailwind CSS
- **Location:** `/apps/web`
- **Status:** ✅ Active (monorepo structure)
- **Features:**
  - Complete page implementations (Leads, Estimates, Material, Messages)
  - Mobile-optimized with bottom navigation
  - Tabbed layout system
  - PWA support
  - **More feature-complete than `/frontend`**

**Structure:**
```
/apps/web/src
├── app/
├── components/
│   └── layout/
│       ├── MobileBottomNav.jsx
│       ├── TabNavigation.jsx
│       └── TabbedLayout.jsx
├── pages/
│   ├── Leads.jsx
│   ├── Estimates.jsx
│   ├── Material.jsx
│   └── Messages.jsx
└── styles/
```

---

### Supporting Infrastructure

#### Worker Service (`/apps/worker`)
- **Location:** `/apps/worker`
- **Purpose:** Background job processing
- **Status:** 🚧 Planned/partial

#### Database Migrations
- **Location 1:** `/migrations` (root - likely for `/src` backend)
- **Location 2:** `/database/migrations` (comprehensive SQL migrations)
- **Location 3:** `/backend/migrations` (Alembic for Python backend)

#### Packages (Planned Monorepo)
- `/packages_temp/ai-core` - AI service abstractions
- `/packages_temp/contracts` - Shared types/interfaces
- `/packages_temp/db` - Database utilities
- `/packages_temp/shared` - Common utilities

---

## Critical Issues

### 1. Unclear Active Codebase ⚠️

**Problem:** The root `package.json` scripts reference `/backend` (Python) and `/frontend`, but the most complete code is in `/src` (Node.js).

```json
// Root package.json points to:
"dev:backend": "cd backend && npm run dev"  // ❌ Python has no npm
```

**This script will fail!**

### 2. Code Duplication

**BlueprintService exists in two places:**
- `/src/services/BlueprintService.js` (682 lines)
- `/apps/api/src/modules/blueprints/blueprints.service.js` (613 lines)

**Visualization service exists in two places:**
- `/src/services/BlueprintVisualizationService.js`
- `/apps/api/src/modules/blueprints/BlueprintVisualizationService.js`

### 3. Multiple Database Migration Systems

- Alembic (Python) in `/backend/migrations`
- SQL scripts in `/database/migrations`
- SQL scripts in `/migrations`

**Which one is the source of truth?**

### 4. Branding Confusion

- Root project: `PlansiteOS`
- Apps/api package: `@pipelineos/api`

**Is this a rebrand or two different projects?**

---

## Dependency Analysis

### Active Dependencies (from `/src` - the working backend)

**Production:**
- `express` - Web framework
- `@anthropic-ai/sdk` - Claude AI integration
- `pg` - PostgreSQL client
- `multer` - File uploads
- `winston` - Logging
- `cors` - CORS handling

**Development:**
- `eslint` - Linting
- `prettier` - Code formatting
- `commitlint` - Commit message validation

**Missing:**
- ❌ Test framework (no Jest/Mocha)
- ❌ API documentation tools
- ❌ Type checking (no TypeScript for backend)

---

## Recommended Architecture Decision

### Option A: Consolidate to Monorepo (Recommended)

**Migrate everything to `/apps` structure:**

```
PlansiteOS/
├── apps/
│   ├── api/              # Migrate /src here, keep modular structure
│   ├── web/              # Merge /frontend here (already better)
│   └── worker/           # Background jobs
├── packages/
│   ├── db/               # Database utilities (from packages_temp)
│   ├── shared/           # Common code
│   ├── ai-core/          # AI abstractions
│   └── types/            # TypeScript types
├── database/
│   └── migrations/       # Single source of truth
├── docs/
├── monitoring/           # Keep existing
├── gateway/              # Keep existing
└── package.json          # Workspace configuration
```

**Benefits:**
- Clear separation of concerns
- Shared code in packages
- Independent deployments
- Turbo for fast builds
- Single repository

**Migration Steps:**
1. Merge `/src` into `/apps/api` (preserve modular structure)
2. Delete `/backend` (Python) - unused
3. Consolidate `/frontend` → `/apps/web`
4. Rename `packages_temp` → `packages`
5. Update root package.json with workspaces
6. Consolidate migrations to `/database/migrations`

---

### Option B: Simple Monolith

**Keep `/src` and `/frontend` as primary:**

```
PlansiteOS/
├── backend/              # Rename /src to /backend
│   ├── src/
│   ├── tests/
│   └── package.json
├── frontend/             # Keep /frontend
│   ├── src/
│   └── package.json
├── shared/               # Shared utilities
├── database/
│   └── migrations/
└── package.json
```

**Benefits:**
- Simpler structure
- Easier to understand
- Faster to deploy
- Less tooling overhead

**Drawbacks:**
- Code sharing more difficult
- Harder to scale team
- Deployment coupling

---

## Immediate Action Items

### Phase 1: Audit & Document (This Week)

- [x] Map all directory structures
- [x] Identify active vs unused code
- [ ] Run each codebase to verify which works
- [ ] Document environment variables for each
- [ ] Check which tests (if any) pass

### Phase 2: Choose Architecture (Next Week)

- [ ] Decide: Monorepo (A) or Monolith (B)
- [ ] Create detailed migration plan
- [ ] Identify breaking changes
- [ ] Plan data migration if needed

### Phase 3: Execute (2-4 Weeks)

- [ ] Execute migration plan
- [ ] Update all documentation
- [ ] Fix all import paths
- [ ] Update Docker configurations
- [ ] Test end-to-end flows

---

## Questions for Product Owner

1. **Is `/src` the active production backend?** (Appears to be most complete)
2. **What is the relationship between PlansiteOS and PipelineOS?**
3. **Is the Python backend (`/backend`) still in use?** If not, can we delete it?
4. **Which frontend is being developed?** `/frontend` or `/apps/web`?
5. **What's the deployment strategy?** Monorepo or separate deployments?
6. **Can we consolidate to one database migration system?**

---

## Risk Assessment

**Current State Risks:**

| Risk | Severity | Impact |
|------|----------|--------|
| Developer confusion | HIGH | Wrong code modified |
| Deployment failures | HIGH | Unclear entry points |
| Code drift | MEDIUM | Duplicate implementations diverge |
| Security vulnerabilities | MEDIUM | Multiple codebases to patch |
| Testing gaps | HIGH | No tests for production code |

**Recommendation:** Address architectural confusion before adding new features.

---

## Next Steps

See `ARCHITECTURE_CONSOLIDATION_PLAN.md` for detailed implementation plan.
