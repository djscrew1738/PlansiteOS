# Acceptance Criteria Checklist

Step-by-step verification that all requirements are met.

## Setup Verification

### Local Development Environment

- [ ] Docker Compose starts all services (PostgreSQL, Redis, MinIO)
- [ ] MinIO console accessible at http://localhost:9001
- [ ] `blueprints` bucket created automatically
- [ ] Backend API starts without errors
- [ ] RQ worker starts and connects to Redis
- [ ] Frontend dev server runs at http://localhost:5173
- [ ] API documentation accessible at http://localhost:8000/docs
- [ ] Health check returns `status: ok` at http://localhost:8000/api/health

## File Upload Requirements

### Supported File Types

Test each file type:

- [ ] **PDF upload**: Single-page PDF uploads successfully
- [ ] **PDF upload**: Multi-page PDF uploads successfully
- [ ] **PNG upload**: PNG image uploads successfully
- [ ] **JPG upload**: JPG image uploads successfully
- [ ] **JPEG upload**: JPEG image uploads successfully
- [ ] **HEIC upload** (optional): HEIC image uploads successfully OR returns clear error with future plan

### Upload Validation

- [ ] Files > 100MB are rejected with 413 error
- [ ] Unsupported file types (e.g., .txt, .zip) are rejected with 400 error
- [ ] Filename sanitization works (special characters removed/replaced)
- [ ] Rate limiting triggers after 10 uploads in 1 minute (429 error)

## Normalization Processing

### PDF Processing

Upload a multi-page PDF and verify:

- [ ] PDF split into individual pages correctly
- [ ] Page numbers assigned sequentially (1, 2, 3...)
- [ ] Each page stored as separate PNG in object storage
- [ ] Storage keys follow pattern: `projects/{projectId}/uploads/{uploadId}/pages/page_NN.png`

### Image Enhancement

Upload a skewed/rotated blueprint image and verify:

- [ ] **Deskew**: Automatically straightened if tilted < 45°
- [ ] **Rotation**: Rotated to nearest 0/90/180/270 degrees
- [ ] **CLAHE**: Contrast enhanced (visible improvement in dark/light areas)
- [ ] Original file preserved immutably
- [ ] Processed file stored separately

### Thumbnails

- [ ] Thumbnail generated for each page
- [ ] Thumbnails stored as JPG format
- [ ] Max dimension of thumbnail ≤ 400px
- [ ] Aspect ratio maintained

### Quality Warnings

Test with low-quality images:

- [ ] **Blur detection**: Warning generated for blurry images (Laplacian variance < threshold)
- [ ] **Low resolution**: Warning generated if shortest side < 1800px
- [ ] Warnings stored in Upload.warnings JSON field
- [ ] Warnings stored in Page.warnings JSON field
- [ ] Warnings displayed in UI

## Background Processing

### Job Queue

- [ ] Upload triggers background job immediately
- [ ] Job status tracked in Upload.status field
- [ ] Progress updates stored in Upload.progress JSON array
- [ ] Job can be monitored via GET /api/uploads/{id}

### Processing Steps

Verify each step appears in progress array:

- [ ] `queued` - Job added to queue
- [ ] `fetching` - Downloading original from storage
- [ ] `converting` - PDF pages extracted or image loaded
- [ ] `enhancing` - Deskew/rotate/CLAHE applied
- [ ] `uploading_pages` - Processed pages uploaded to storage
- [ ] `writing_db` - Page records created in database
- [ ] `done` - Processing completed

### Status Tracking

- [ ] Upload starts with status `UPLOADED`
- [ ] Status changes to `PROCESSING` when job starts
- [ ] Status changes to `READY` when job completes successfully
- [ ] Status changes to `FAILED` if job encounters error
- [ ] Error message stored in Upload.error_message field if failed

## Viewer Requirements

### Zoom and Pan

- [ ] **Mouse scroll**: Zoom in/out with mouse wheel
- [ ] **Touch pinch**: Zoom in/out with pinch gesture (mobile)
- [ ] **Drag**: Pan image by clicking and dragging
- [ ] **Touch drag**: Pan image by touching and dragging (mobile)
- [ ] Zoom limited to reasonable range (0.1x to 10x)
- [ ] Zoom centers on cursor/touch position

### Page Switching

- [ ] **Thumbnail sidebar**: Displays all pages as thumbnails
- [ ] **Click thumbnail**: Opens page in main viewer
- [ ] **Active indicator**: Currently viewed page highlighted in sidebar
- [ ] **Toggle sidebar**: Button to show/hide thumbnail sidebar
- [ ] Page info displayed in footer (page number, DPI, dimensions)

### Image Loading

- [ ] Images load via backend proxy OR signed URLs
- [ ] Loading state shown while image fetches
- [ ] Error handling if image fails to load
- [ ] Images display at correct aspect ratio
- [ ] Large images (>10MB) load without performance issues

## Scale Calibration

### Two-Point Calibration

- [ ] **"Calibrate Scale" button**: Enters calibration mode
- [ ] **First click**: Places point A, shows red circle
- [ ] **Second click**: Places point B, shows red circle
- [ ] **Line overlay**: Dashed red line drawn between points
- [ ] **Modal appears**: Prompts for distance and unit after second point
- [ ] **Cancel calibration**: "Cancel" button exits mode without saving

### Distance Input

- [ ] **Input field**: Accepts decimal numbers (e.g., 10.5)
- [ ] **Unit selector**: Dropdown with FT, IN, MM options
- [ ] **Validation**: Rejects zero, negative, or non-numeric values
- [ ] **Save**: Creates/updates Calibration record in database

### Calibration Display

- [ ] **Pixels per unit**: Calculated correctly (pixel distance / real distance)
- [ ] **Scale overlay**: Green line and text overlay shown after calibration
- [ ] **Persisted**: Calibration loads automatically when page reopened
- [ ] **Update**: New calibration replaces old (unique per page)
- [ ] **Scale text**: Shows "Scale: X.XX px/ft" or appropriate unit

### Coordinate Accuracy

- [ ] Point coordinates stored as integers (px from top-left)
- [ ] Coordinates account for zoom/pan state correctly
- [ ] Calibration persists across browser refresh

## API Endpoints

Test each endpoint:

### Projects

- [ ] `POST /api/projects` - Creates project, returns 201 + project object
- [ ] `GET /api/projects/{id}` - Returns project or 404

### Uploads

- [ ] `POST /api/projects/{projectId}/uploads` - Accepts multipart file, returns 201 + upload object
- [ ] `GET /api/uploads/{uploadId}` - Returns upload with pages array, warnings, progress
- [ ] `POST /api/uploads/{uploadId}/select-pages` - For PDF uploads, stores page selection

### Pages

- [ ] `GET /api/pages/{pageId}/image` - Returns PNG image or signed URL JSON
- [ ] `GET /api/pages/{pageId}/thumb` - Returns JPEG thumbnail or signed URL JSON

### Calibration

- [ ] `POST /api/pages/{pageId}/calibration` - Creates calibration, returns 201 + calibration object
- [ ] `POST /api/pages/{pageId}/calibration` (existing) - Updates calibration, returns calibration object
- [ ] `GET /api/pages/{pageId}/calibration` - Returns calibration or null

### Health

- [ ] `GET /api/health` - Returns status of database, Redis, storage

## Security Requirements

### File Validation

- [ ] MIME type checked against whitelist
- [ ] File size checked against max limit (100MB default)
- [ ] Filename sanitized (no path traversal, special chars removed)

### Storage Security

- [ ] Object storage bucket NOT publicly accessible
- [ ] Images served via backend proxy OR signed URLs with expiry
- [ ] Original files stored in secure location
- [ ] No direct URLs to storage endpoint exposed to client

### API Security

- [ ] CORS configured to allowed origins only
- [ ] Rate limiting on upload endpoint (10 req/min default)
- [ ] Input validation on all endpoints (Pydantic schemas)
- [ ] SQL injection protection (SQLAlchemy parameterized queries)

## Production Deployment

### Docker Compose

- [ ] All 8 containers start successfully
- [ ] Health checks pass for all services
- [ ] Services restart automatically on failure (`restart: unless-stopped`)
- [ ] Networks segmented (backend internal, frontend accessible)

### Caddy TLS

- [ ] Automatic HTTPS certificate provisioned
- [ ] Certificate auto-renews before expiry
- [ ] HTTP redirects to HTTPS
- [ ] Security headers present in responses:
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] X-Content-Type-Options
  - [ ] X-Frame-Options
  - [ ] Referrer-Policy
  - [ ] Content-Security-Policy

### Database Migrations

- [ ] Alembic migrations run successfully
- [ ] Schema matches models.py definitions
- [ ] Foreign keys enforced
- [ ] Indexes created on appropriate columns

### Hardening

- [ ] UFW firewall configured (ports 22, 80, 443 only)
- [ ] Non-root deploy user created
- [ ] Strong passwords generated for database, Redis, MinIO
- [ ] SSH key authentication (password auth disabled recommended)
- [ ] Backups configured (database + object storage)
- [ ] Log rotation configured

## Data Model Integrity

### Projects Table

- [ ] UUID primary key
- [ ] name field required
- [ ] foundationType enum (SLAB | PIER_BEAM | UNKNOWN)
- [ ] floors integer, default 1
- [ ] createdAt timestamp

### Uploads Table

- [ ] UUID primary key
- [ ] projectId foreign key to projects
- [ ] status enum (UPLOADED | PROCESSING | READY | FAILED)
- [ ] warnings JSON array
- [ ] progress JSON array
- [ ] error_message nullable text

### Pages Table

- [ ] UUID primary key
- [ ] uploadId foreign key to uploads
- [ ] pageNumber integer
- [ ] widthPx, heightPx integers
- [ ] dpiEstimated nullable integer
- [ ] storageKeyPagePng, storageKeyPageThumb strings
- [ ] status enum (READY | FAILED)
- [ ] warnings JSON array

### Calibrations Table

- [ ] UUID primary key
- [ ] pageId foreign key to pages (UNIQUE constraint)
- [ ] p1x, p1y, p2x, p2y integers
- [ ] realDistance float
- [ ] realUnit enum (FT | IN | MM)
- [ ] pixelsPerUnit float (calculated)

## Storage Keys Deterministic

Verify storage key patterns:

- [ ] Original: `projects/{projectId}/uploads/{uploadId}/original/{filename}`
- [ ] Page PNG: `projects/{projectId}/uploads/{uploadId}/pages/page_NN.png`
- [ ] Thumbnail: `projects/{projectId}/uploads/{uploadId}/thumbs/page_NN.jpg`

## User Experience

### Upload Flow

1. [ ] User creates project with required fields
2. [ ] User uploads file via drag-drop or file picker
3. [ ] Progress bar shows upload percentage
4. [ ] Upload status automatically updates (polling every 2 seconds)
5. [ ] Processing steps visible in progress indicator
6. [ ] Thumbnails appear after processing completes
7. [ ] User clicks thumbnail to open viewer

### Viewer Flow

1. [ ] Page loads with image centered and fitted to viewport
2. [ ] User can zoom and pan smoothly
3. [ ] User clicks "Calibrate Scale" button
4. [ ] User clicks two points on blueprint
5. [ ] Modal appears with distance input
6. [ ] User enters distance and selects unit
7. [ ] Calibration saves and displays scale overlay
8. [ ] Refreshing page preserves calibration

### Mobile Experience

- [ ] Touch zoom (pinch) works smoothly
- [ ] Touch pan works smoothly
- [ ] Buttons large enough for touch targets (44px+)
- [ ] Layout responsive on mobile devices
- [ ] Upload zone works with mobile file picker

## Performance

- [ ] API responds to requests within 500ms (excluding uploads)
- [ ] Image processing completes within 2 minutes for typical blueprint
- [ ] Viewer loads and renders within 2 seconds
- [ ] Zoom/pan feels smooth (no lag)
- [ ] Multiple simultaneous uploads handled correctly

## Error Handling

Test error scenarios:

- [ ] Network failure during upload shows error message
- [ ] Processing failure shows error in Upload.error_message
- [ ] Invalid file type shows user-friendly error
- [ ] Page not found returns 404
- [ ] Database connection failure detected in health check
- [ ] Worker crash doesn't lose jobs (Redis persistence)

## Documentation

- [ ] README.md complete with setup instructions
- [ ] DEPLOY.md complete with production deployment guide
- [ ] .env.example includes all required variables
- [ ] API endpoints documented (in README or OpenAPI docs)
- [ ] Code comments present for complex logic
- [ ] Architecture overview clear and accurate

## HEIC Support Decision

Choose one:

- [ ] **Option A**: HEIC support implemented and tested
- [ ] **Option B**: HEIC support omitted with justification documented and future plan provided

**If Option B**, document:
- Reason for omission (e.g., library compatibility, server dependencies)
- Future plan (e.g., client-side conversion, dedicated endpoint, HEIF library upgrade)

---

## Final Verification

After completing all checks above:

- [ ] End-to-end test: Create project → Upload PDF → Process → View → Calibrate
- [ ] Production deployment test on clean Ubuntu server
- [ ] Security scan passed (no critical vulnerabilities)
- [ ] Performance acceptable under load
- [ ] Documentation accurate and complete
- [ ] Code committed to version control
- [ ] `.env` file NOT committed (gitignored)

**Acceptance Status**: ⬜ NOT READY | ⬜ READY FOR REVIEW | ✅ ACCEPTED
