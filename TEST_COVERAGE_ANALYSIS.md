# Test Coverage Analysis - PlansiteOS

## Current State

The codebase has **~1.5% test coverage** across **211 source files** and **31,000+ lines of code**, with only **7 test files** containing **~460 lines of test code**.

### Existing Tests

| Test File | Framework | What It Covers |
|-----------|-----------|----------------|
| `frontend/src/lib/utils.test.ts` | Vitest | `cn()` Tailwind class merging utility |
| `frontend/src/components/ui/Button.test.tsx` | Vitest | Button variants, sizes, events, refs |
| `frontend/src/components/ui/Badge.test.tsx` | Vitest | Badge variants, sizes, custom classes |
| `frontend/src/utils/formatters.test.ts` | Vitest | `formatRelativeTime`, `formatCurrency`, `formatNumber` |
| `apps/api/src/__tests__/config.test.js` | Jest | Repo config assertions (env paths, port references) |
| `apps/api/src/modules/blueprints/__tests__/blueprintStatus.test.js` | Jest | Blueprint status constants and `isBlueprintCompleted` helper |
| `apps/api/src/platform/middleware/__tests__/fileUpload.test.js` | Jest | Upload directory initialization |

### Coverage by Module

| Module | Source Files | Test Files | Estimated Coverage |
|--------|-------------|------------|-------------------|
| `frontend/` | 96 | 4 | ~1.75% |
| `apps/api/` | 59 | 3 | ~1.77% |
| `apps/web/` | 31 | 0 | 0% |
| `apps/worker/` | 1 | 0 | 0% |
| `apps/blueprint-foundation/frontend/` | 15 | 0 | 0% |
| `packages_temp/` | 9 | 0 | 0% |

**No integration tests or end-to-end tests exist.**

---

## Proposed Improvements

The recommendations below are ordered by **impact relative to effort** - the highest-value, most-achievable improvements come first.

---

### Priority 1: Core Business Logic (Critical)

These are the revenue-critical paths. Bugs here directly affect bid accuracy and customer trust.

#### 1A. Bids Service (`apps/api/src/modules/bids/bids.service.js`)

This is the largest and most complex service at **992 lines** with **21+ public methods**. It handles bid generation, pricing calculations, line item management, and status transitions.

**What to test:**
- `groupFixtures(fixtures)` - Pure function that aggregates fixture data. No mocking needed.
- `getDefaultPricing()` / `getFixturePricing(tier)` - Pricing lookup logic.
- Bid total calculations - Verify line item subtotals and overall totals are computed correctly.
- Status transition validation - Ensure `draft -> sent -> accepted` state machine is enforced and invalid transitions are rejected.
- `generateFromBlueprint()` - Mock the database client to verify the correct SQL operations and transaction handling.
- `cloneBid()` - Verify all line items are duplicated and the new bid gets a `draft` status.

**Why it matters:** Incorrect pricing or lost line items during cloning would directly produce wrong bids for customers.

#### 1B. Blueprint Analysis Service (`apps/api/src/modules/blueprints/blueprints.service.js`)

614 lines handling the full AI-powered blueprint analysis pipeline.

**What to test:**
- `parseAnalysisResults(analysisText)` - JSON extraction from AI responses. Test with well-formed responses, malformed JSON, missing fields, and markdown-wrapped output.
- `enrichFixtureData(analysis)` - Reference data enrichment logic.
- Schema validation (Zod) - Verify the blueprint analysis schema rejects malformed data and accepts valid data.
- Circuit breaker integration - Verify analysis fails gracefully when the AI service is unavailable.

**Why it matters:** The AI response parsing is fragile by nature (LLM outputs vary). Comprehensive tests for `parseAnalysisResults` would catch regressions when prompts change.

#### 1C. Leads Processing Pipeline (`apps/api/src/modules/leads/leads.service.js`)

591 lines orchestrating lead intake from social media posts through validation, deduplication, AI qualification, and persistence.

**What to test:**
- `validateInput(postData)` - Input validation rules.
- `sanitizeInputs(postData)` - XSS/injection sanitization.
- `checkDuplicate(postUrl)` - Deduplication logic.
- `verifyServiceArea(analysis)` - Geographic filtering.
- `processIncomingPost()` end-to-end flow with mocked dependencies - Verify the orchestration order and that failures at each step are handled correctly.

**Why it matters:** Leads drive revenue. A bug in deduplication could cause duplicate outreach; a bug in service area filtering could miss valid leads.

---

### Priority 2: Infrastructure & Resilience (High Value)

These components underpin the reliability of all services above.

#### 2A. Circuit Breaker (`apps/api/src/platform/middleware/CircuitBreaker.js`)

430 lines implementing the circuit breaker pattern used by both the blueprint and leads services. This is a **pure state machine** with no external dependencies beyond a logger - making it highly testable.

**What to test:**
- State transitions: CLOSED -> OPEN after failure threshold, OPEN -> HALF_OPEN after timeout, HALF_OPEN -> CLOSED on success, HALF_OPEN -> OPEN on failure.
- Failure window cleanup - Verify old failures are discarded.
- Timeout enforcement - Verify slow calls are aborted.
- Metrics accumulation - Verify success/failure/timeout counts are accurate.
- Concurrent execution - Verify multiple simultaneous calls are handled properly.

**Why it matters:** A broken circuit breaker could either let cascading failures through (never opens) or permanently block services (never closes).

#### 2B. AI Service for Leads (`apps/api/src/modules/leads/AIService.js`)

512 lines wrapping the Claude API with rate limiting and circuit breaking.

**What to test:**
- `parseAIResponse(response)` - JSON extraction from markdown-wrapped responses, handling of missing fields, malformed JSON.
- `checkRateLimit()` - Rate limiter state transitions and window management.
- `isClaudeFailure(error)` - Error classification (which errors should trip the circuit breaker vs. which should be retried).
- `buildAnalysisPrompt()` - Verify prompt structure.

#### 2C. File Upload Middleware (`apps/api/src/platform/middleware/fileUpload.js`)

367 lines handling file uploads. Several functions are pure utilities.

**What to test:**
- `formatFileSize(bytes)` - Pure function, trivial to test.
- `validateFile(file)` - MIME type, extension, and size validation.
- `getFileMetadata(file)` - Metadata extraction.
- `handleUploadError()` - Error middleware response formatting.
- `cleanupOldFiles(daysOld)` - Cleanup logic with mocked filesystem.

---

### Priority 3: Validation Schemas (Low Effort, High Confidence)

These are the easiest tests to write and provide strong regression protection.

#### 3A. Bid Validation Schemas (`apps/api/src/schemas/bid.schema.js`)

8 Joi schemas covering generation, updates, line items, and queries. Test each schema with:
- Valid input (should pass)
- Missing required fields (should fail with specific error)
- Invalid types (should fail)
- Boundary values (empty strings, negative numbers, very long strings)

#### 3B. Blueprint Analysis Schema (`apps/api/src/schemas/blueprint.schema.js`)

Zod schema for AI response validation. Test with:
- Valid fixture data
- Missing fixture fields
- Invalid numeric values
- Empty arrays vs. populated arrays

---

### Priority 4: Frontend State & Hooks (Medium Value)

#### 4A. Zustand Stores (`frontend/src/stores/`)

`selectionStore.ts` (95 lines) and `appStore.ts` (79 lines) are pure state machines. Zustand provides first-class testing support.

**What to test:**
- `selectionStore`: Toggle selection, select all, clear, cross-resource clear.
- `appStore`: Project context updates, upload queue management, toast notification lifecycle, localStorage persistence of UI preferences.

#### 4B. API Hooks (`frontend/src/hooks/useApi.ts`)

312 lines of React Query hooks. Use `@tanstack/react-query` testing utilities.

**What to test:**
- Query key generation and cache invalidation patterns.
- Optimistic updates in `useDeleteBlueprint` - Verify the cache is updated before the server responds and rolled back on failure.
- Upload polling in `useUploadPolling` - Verify polling stops when the blueprint reaches a terminal status.

#### 4C. Utility Hooks

- `useDebounce.ts` - Verify the debounced value updates after the delay and resets on new input.
- `useSelection.ts` - Verify delegation to the correct store slice.

---

### Priority 5: API Route Integration Tests (Medium Effort, High Value)

No API routes have integration tests. The `supertest` library is already installed.

#### 5A. Bids Routes (`apps/api/src/modules/bids/bids.routes.js`)

**What to test:**
- POST `/bids/generate` - Verify request validation, successful generation, and error responses.
- GET `/bids` - Verify listing with pagination.
- PATCH `/bids/:id/status` - Verify status transition validation.
- Validation middleware - Verify malformed requests return 400 with descriptive errors.
- Error handling middleware - Verify internal errors return 500 without leaking stack traces.

#### 5B. Blueprint Routes

Similar pattern - test upload, analysis trigger, status retrieval, and error cases.

---

### Priority 6: Background Workers (`apps/worker/`)

#### 6A. CronService (`apps/worker/src/schedulers/CronService.js`)

441 lines managing 5 scheduled jobs.

**What to test:**
- Job overlap prevention - Verify a job that's still running isn't started again.
- Error tracking per job - Verify consecutive failure counts and last error storage.
- `getStatus()` reporting accuracy.
- Individual job handlers with mocked dependencies (Lead model, NotificationService, database).

---

### Priority 7: Shared Packages (`packages_temp/`)

#### 7A. AI Core (`packages_temp/ai-core/`)

**What to test:**
- Provider selection logic in AIClient.
- Anthropic provider: image file reading, base64 encoding, media type detection.
- Error handling when no API key is configured.

---

## Structural Recommendations

Beyond adding test files, these architectural changes would make the codebase more testable:

1. **Introduce dependency injection in services.** `BidsService` and `BlueprintsService` instantiate their own database clients and external service clients internally. Accepting these as constructor parameters would allow tests to inject mocks without `jest.mock()` gymnastics.

2. **Extract pure functions from services.** Functions like `groupFixtures()`, pricing calculations, and status validation logic are buried inside service files but have no dependencies. Moving them to dedicated utility modules (or simply exporting them) would make them trivially testable.

3. **Add a test database configuration.** The bids and leads services use raw PostgreSQL queries. A test configuration with a disposable database (or SQLite in-memory for simpler tests) would enable proper integration testing without mocking every query.

4. **Set up CI test execution.** The `scripts/ci.sh` file runs tests across all packages, but there is no GitHub Actions workflow (or equivalent) to run them automatically. Adding a CI pipeline that runs on every PR would prevent regressions.

5. **Configure coverage thresholds.** The frontend Vitest config already has coverage reporting set up (`vitest --coverage`). Adding `coverageThreshold` settings would prevent coverage from dropping as new code is added.

---

## Suggested Implementation Order

| Phase | Scope | Files to Create |
|-------|-------|----------------|
| 1 | Validation schemas + pure utilities | `bid.schema.test.js`, `blueprint.schema.test.js`, `fileUpload.test.js` (expand existing) |
| 2 | Circuit breaker + AI response parsing | `CircuitBreaker.test.js`, `AIService.test.js`, `blueprints.service.test.js` (parseAnalysisResults) |
| 3 | Bids service pure functions + state transitions | `bids.service.test.js` |
| 4 | Leads pipeline validation + sanitization | `leads.service.test.js` |
| 5 | Frontend stores + hooks | `selectionStore.test.ts`, `appStore.test.ts`, `useDebounce.test.ts` |
| 6 | API route integration tests | `bids.routes.test.js`, `blueprints.routes.test.js` |
| 7 | Worker + shared packages | `CronService.test.js`, `ai-core/index.test.js` |
