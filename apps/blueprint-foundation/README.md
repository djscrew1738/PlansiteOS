# Blueprint Upload Foundation

Production-ready blueprint upload and calibration system for new-construction plumbing applications.

## Features

- **Upload**: PDF (multi-page), PNG, JPG, JPEG, HEIC support
- **Normalization**: Automatic deskew, rotation, contrast enhancement (CLAHE)
- **Viewer**: Canvas-based zoom/pan with mobile-first UX (Konva)
- **Calibration**: 2-point scale calibration with real-world measurements
- **Background Processing**: Redis Queue (RQ) for non-blocking operations
- **Production Ready**: Docker Compose, Caddy TLS, security hardening

## Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL + SQLAlchemy + Alembic
- Redis + RQ for background jobs
- MinIO/S3 for object storage
- OpenCV + pdf2image for processing

### Frontend
- React + TypeScript + Vite
- Konva for canvas-based viewer
- React Router for navigation

### Infrastructure
- Docker Compose
- Caddy for automatic HTTPS
- Segmented networks for security

## Quick Start (Local Development)

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Start Infrastructure Services

```bash
cd apps/blueprint-foundation

# Start PostgreSQL, Redis, MinIO
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

Access MinIO console at http://localhost:9001 (minioadmin/minioadmin)

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blueprints
REDIS_URL=redis://localhost:6379/0
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=blueprints
STORAGE_SECURE=false
EOF

# Run database migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### 3. Start Worker (in new terminal)

```bash
cd backend
source venv/bin/activate
python worker/worker.py
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Start development server
npm run dev
```

Frontend will be available at http://localhost:5173

### 5. Test End-to-End

1. Navigate to http://localhost:5173
2. Click "Create New Project"
3. Fill in project details
4. Upload a PDF or image blueprint
5. Wait for processing to complete
6. Click on processed page to open viewer
7. Use "Calibrate Scale" to set scale

## Production Deployment

See [DEPLOY.md](./DEPLOY.md) for complete production deployment guide.

Quick production deployment:

```bash
# 1. Clone repository on server
git clone <repo-url>
cd blueprint-foundation

# 2. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 3. Build and start services
docker-compose up -d

# 4. Run migrations
docker-compose exec api alembic upgrade head

# 5. Verify health
curl https://your-domain.com/api/health
```

## Project Structure

```
blueprint-foundation/
├── backend/              # FastAPI application
│   ├── app/             # API code
│   ├── worker/          # RQ background workers
│   ├── processor/       # Image processing
│   ├── alembic/         # Database migrations
│   └── requirements.txt
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Route pages
│   │   ├── api/         # API client
│   │   └── types/       # TypeScript types
│   └── package.json
├── docker-compose.yml       # Production
├── docker-compose.dev.yml   # Development
├── Caddyfile               # Reverse proxy config
└── .env.example            # Environment template
```

## API Endpoints

- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project
- `POST /api/projects/{id}/uploads` - Upload blueprint
- `GET /api/uploads/{id}` - Get upload status and pages
- `POST /api/uploads/{id}/select-pages` - Select PDF pages
- `GET /api/pages/{id}/image` - Get page image
- `GET /api/pages/{id}/thumb` - Get page thumbnail
- `POST /api/pages/{id}/calibration` - Create/update calibration
- `GET /api/pages/{id}/calibration` - Get calibration
- `GET /api/health` - Health check

## Development Commands

```bash
# Backend
cd backend
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head                               # Apply migrations
alembic downgrade -1                               # Rollback migration
pytest                                             # Run tests

# Frontend
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Lint code

# Docker
docker-compose -f docker-compose.dev.yml up -d     # Start dev services
docker-compose -f docker-compose.dev.yml down      # Stop dev services
docker-compose -f docker-compose.dev.yml logs -f   # View logs
docker-compose up -d                               # Start production
docker-compose logs -f api                         # View API logs
docker-compose logs -f worker                      # View worker logs
```

## Security Features

- File type validation and size limits
- Filename sanitization
- Rate limiting on uploads
- Private object storage (signed URLs)
- Segmented Docker networks
- Automatic HTTPS via Caddy
- Security headers (HSTS, CSP, etc.)
- Input validation with Pydantic

## HEIC Support

HEIC (iPhone photos) support is included via `pillow-heif` package. If you encounter issues or want to omit HEIC support:

1. Remove `pillow-heif==0.15.0` from `backend/requirements.txt`
2. Remove `image/heic` from allowed MIME types in `app/config.py`

Future enhancement: Add server-side HEIC to PNG conversion endpoint.

## License

[Specify your license]

## Support

For issues and questions, please open a GitHub issue.
