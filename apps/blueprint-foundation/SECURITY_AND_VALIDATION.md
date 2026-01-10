# Security, Validation, and Warning Systems

Comprehensive documentation of all security measures, validation logic, and warning systems.

## Security Measures

### 1. File Upload Security

#### File Type Validation
**Location**: `backend/app/routers/uploads.py`

```python
# MIME type whitelist
allowed_mime_types = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/heic"
]

# Validation enforced before storage
if mime_type not in settings.allowed_mime_types:
    raise HTTPException(status_code=400, detail="File type not allowed")
```

**Protection Against**: Malicious file uploads, arbitrary code execution

#### File Size Limits
**Location**: `backend/app/routers/uploads.py`, `Caddyfile`

```python
# Backend validation
if len(content) > settings.max_upload_size:  # Default: 100MB
    raise HTTPException(status_code=413, detail="File too large")

# Caddy reverse proxy enforcement
request_body {
    max_size 100MB
}
```

**Protection Against**: DoS via large file uploads, resource exhaustion

#### Filename Sanitization
**Location**: `backend/app/routers/uploads.py`

```python
def sanitize_filename(filename: str) -> str:
    """
    - Removes directory path components (prevents path traversal)
    - Strips special characters except alphanumeric, dots, dashes, underscores
    - Limits length to 200 characters
    """
    filename = os.path.basename(filename)  # Remove path
    filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)  # Remove special chars
    if len(filename) > 200:
        name, ext = os.path.splitext(filename)
        filename = name[:200-len(ext)] + ext
    return filename
```

**Protection Against**: Path traversal, directory manipulation, XSS via filenames

### 2. Rate Limiting

**Location**: `backend/app/middleware.py`

```python
class RateLimitMiddleware:
    """
    Tracks requests per IP address
    Enforces limit: 10 uploads per minute per IP (configurable)
    Returns 429 Too Many Requests when exceeded
    """
```

**Implementation**:
- In-memory tracking of request timestamps per IP
- Automatic cleanup of old timestamps (> 60 seconds)
- Thread-safe with locking

**Protection Against**: Brute force attacks, resource exhaustion, abuse

### 3. Object Storage Security

#### Private Bucket
**Location**: `docker-compose.yml`, `docker-compose.dev.yml`

```bash
# MinIO bucket policy set to private (no public access)
mc anonymous set none myminio/blueprints
```

#### Signed URLs
**Location**: `backend/app/storage.py`

```python
def get_signed_url(object_name: str, expires: int = 3600) -> str:
    """
    Generates presigned URLs with 1-hour expiry (configurable)
    URLs cannot be reused after expiry
    """
```

**Alternative**: Backend proxy mode (images served through API)

**Protection Against**: Unauthorized access, direct file enumeration, hotlinking

### 4. Database Security

#### SQL Injection Prevention
**Technology**: SQLAlchemy ORM with parameterized queries

```python
# All queries use ORM (automatically parameterized)
upload = db.query(Upload).filter(Upload.id == upload_id).first()

# No raw SQL strings with user input
```

**Protection Against**: SQL injection attacks

#### Password Protection
**Location**: `docker-compose.yml`

```yaml
# Database requires password authentication
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Must be set in .env

# Redis requires password
redis-server --requirepass ${REDIS_PASSWORD}
```

**Protection Against**: Unauthorized database access

### 5. Network Security

#### Segmented Networks
**Location**: `docker-compose.yml`

```yaml
networks:
  backend:
    internal: true  # No external access
  frontend:
    # Only Caddy has external access
```

**Isolation**:
- Backend services (database, Redis, MinIO, worker) NOT accessible from internet
- Only API and frontend accessible via Caddy reverse proxy

**Protection Against**: Direct attacks on backend services, lateral movement

### 6. HTTPS and TLS

**Location**: `Caddyfile`

```
{$DOMAIN} {
    # Automatic HTTPS via Let's Encrypt
    # Certificates auto-renewed
    # HTTP -> HTTPS redirect automatic
}
```

**Protection Against**: Man-in-the-middle attacks, eavesdropping, data interception

### 7. Security Headers

**Location**: `Caddyfile`

All responses include:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Protection Against**: XSS, clickjacking, MIME sniffing, data leakage

### 8. CORS Configuration

**Location**: `backend/app/config.py`, `backend/app/main.py`

```python
# Only allowed origins can make API requests
cors_origins = ["https://your-domain.com"]

# Credentials support enabled
allow_credentials = True
```

**Protection Against**: Cross-site request forgery (CSRF), unauthorized API access

### 9. Input Validation

**Location**: All API endpoints via Pydantic schemas

```python
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    floors: int = Field(1, ge=1, le=10)
    # All inputs validated before processing
```

**Protection Against**: Buffer overflows, malformed data, injection attacks

### 10. Firewall (UFW)

**Location**: `DEPLOY.md`

```bash
# Only essential ports open
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw default deny incoming
```

**Protection Against**: Port scanning, unauthorized service access

## Validation Systems

### 1. Upload Validation

**Pre-Storage Checks** (`backend/app/routers/uploads.py`):
- ✓ File size within limit
- ✓ MIME type in whitelist
- ✓ Filename sanitized
- ✓ Project exists (foreign key validation)

### 2. Calibration Validation

**Input Validation** (`backend/app/schemas.py`):
```python
class CalibrationCreate(BaseModel):
    p1x: int = Field(..., ge=0)  # Non-negative
    p1y: int = Field(..., ge=0)
    p2x: int = Field(..., ge=0)
    p2y: int = Field(..., ge=0)
    real_distance: float = Field(..., gt=0)  # Greater than 0
    real_unit: RealUnit  # Must be FT, IN, or MM
```

**Computed Validation** (`backend/app/routers/pages.py`):
- Pixels per unit calculated from Euclidean distance
- Prevents division by zero (points must be different)

### 3. Database Constraints

**Enforced at DB Level** (`backend/alembic/versions/001_initial_schema.py`):
- Foreign key constraints (cascading deletes)
- Unique constraints (calibration per page)
- NOT NULL constraints (required fields)
- Enum constraints (status values)
- Check constraints (positive values)

### 4. Health Check Validation

**Dependencies Verified** (`backend/app/routers/health.py`):
- Database connection active
- Redis connection active
- Object storage accessible
- Returns degraded status if any fail

## Warning Systems

### 1. Blur Detection

**Implementation** (`backend/processor/image_processor.py`):

```python
def _calculate_blur_score(gray: np.ndarray) -> float:
    """
    Uses Laplacian variance method
    Higher variance = sharper image
    Threshold: 100.0 (configurable)
    """
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    return laplacian.var()

# Warning generated if score < threshold
if blur_score < self.blur_threshold:
    warnings.append(f"Image may be blurry (score: {blur_score:.1f})")
```

**User Impact**: Warning displayed in UI, does not block upload

### 2. Low Resolution Detection

**Implementation** (`backend/processor/image_processor.py`):

```python
min_dimension = min(width, height)
if min_dimension < self.low_res_threshold:  # Default: 1800px
    warnings.append(f"Low resolution: {width}x{height}px")
```

**User Impact**: Warning displayed, user can proceed but quality may be poor

### 3. Processing Errors

**Error Capture** (`backend/worker/tasks.py`):

```python
try:
    # Processing steps
except Exception as e:
    upload.status = UploadStatus.FAILED
    upload.error_message = str(e)
    # Error stored and displayed to user
```

**Types of Errors Caught**:
- PDF decoding failures
- Image corruption
- Storage upload failures
- Out of memory errors

### 4. Page-Level Warnings

**Storage** (`backend/app/models.py`):
```python
class Page(Base):
    warnings = Column(JSON, nullable=True)  # List of warning strings
```

**Examples**:
- "Blur detected (score: 45.2)"
- "Low resolution: 1200x900px (shortest side < 1800px)"
- "Rotation applied: 15.3 degrees"

**Display**: Warnings shown in thumbnail grid and page viewer

### 5. Upload-Level Warnings

**Storage** (`backend/app/models.py`):
```python
class Upload(Base):
    warnings = Column(JSON, nullable=True)  # Aggregate warnings
```

**Aggregation**: Collects warnings from all pages plus upload-level issues

**Examples**:
- "Page 1: Image may be blurry"
- "Page 3: Low resolution detected"
- "Some pages may have quality issues"

## Error Handling Strategy

### User-Facing Errors

**Principle**: Clear, actionable error messages

**Examples**:
- ✅ "File size exceeds maximum of 100 MB"
- ❌ "Request entity too large"

### Internal Errors

**Logging Strategy**:
- Console logs for development
- Structured logs for production (JSON format via Caddy)
- Error details stored in database (Upload.error_message)

**Sensitive Data**: Never expose internal paths, secrets, or stack traces to users

## Monitoring and Alerting

### Health Endpoint

**Purpose**: Continuous monitoring of system health

**Usage**:
```bash
curl https://your-domain.com/api/health
```

**Response**:
```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok",
  "storage": "ok"
}
```

**Integration**: Can be monitored by UptimeRobot, Pingdom, or custom scripts

### Log Analysis

**Caddy Access Logs**: JSON format in `/data/access.log`

**Metrics to Monitor**:
- Upload success/failure rates
- Processing time per upload
- Storage usage trends
- Error frequency by endpoint

## Security Best Practices Implemented

✅ Principle of least privilege (segmented networks)
✅ Defense in depth (multiple validation layers)
✅ Fail securely (errors don't expose internals)
✅ Secure defaults (.env.example with strong passwords)
✅ Input validation (all endpoints)
✅ Output encoding (automatic via FastAPI/React)
✅ Authentication ready (can add OAuth/JWT)
✅ Audit logging (Caddy access logs)
✅ Regular updates (documented in DEPLOY.md)
✅ Encryption in transit (HTTPS)

## Future Security Enhancements

Recommendations for production hardening:

1. **Authentication**: Add OAuth2 or JWT authentication
2. **Authorization**: Role-based access control (RBAC)
3. **Secrets Management**: Use Vault or AWS Secrets Manager
4. **Vulnerability Scanning**: Integrate Snyk or Trivy
5. **WAF**: Add Web Application Firewall (Cloudflare, AWS WAF)
6. **DDoS Protection**: Cloudflare or similar service
7. **Intrusion Detection**: OSSEC or similar IDS
8. **Penetration Testing**: Regular security audits
9. **Compliance**: GDPR, SOC 2, or HIPAA if required
10. **Bug Bounty**: Responsible disclosure program

## Incident Response

**If Security Issue Discovered**:

1. Isolate affected systems
2. Preserve logs and evidence
3. Patch vulnerability immediately
4. Notify affected users if data breach
5. Conduct post-mortem analysis
6. Update security documentation

**Contact**: [Your security contact email]
