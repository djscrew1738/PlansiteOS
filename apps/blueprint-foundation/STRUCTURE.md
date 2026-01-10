# Blueprint Upload Foundation - Directory Structure

```
blueprint-foundation/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 001_initial_schema.py
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app
│   │   ├── config.py                  # Settings
│   │   ├── database.py                # SQLAlchemy setup
│   │   ├── storage.py                 # MinIO/S3 client
│   │   ├── queue.py                   # RQ setup
│   │   ├── models.py                  # SQLAlchemy models
│   │   ├── schemas.py                 # Pydantic schemas
│   │   ├── dependencies.py            # FastAPI dependencies
│   │   ├── middleware.py              # Rate limiting
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── projects.py
│   │       ├── uploads.py
│   │       ├── pages.py
│   │       └── health.py
│   ├── worker/
│   │   ├── __init__.py
│   │   ├── worker.py                  # RQ worker entry
│   │   └── tasks.py                   # Job definitions
│   ├── processor/
│   │   ├── __init__.py
│   │   ├── image_processor.py         # OpenCV processing
│   │   └── pdf_processor.py           # PDF handling
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── alembic.ini
│   └── pytest.ini
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts              # API client
│   │   ├── components/
│   │   │   ├── UploadZone.tsx
│   │   │   ├── ThumbnailGrid.tsx
│   │   │   ├── BlueprintViewer.tsx
│   │   │   ├── CalibrationModal.tsx
│   │   │   └── ProgressIndicator.tsx
│   │   ├── pages/
│   │   │   ├── NewProject.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   ├── UploadDetail.tsx
│   │   │   └── PageViewer.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── storage.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── index.html
├── docker-compose.dev.yml
├── docker-compose.yml                  # Production
├── Caddyfile
├── .env.example
├── README.md
└── DEPLOY.md
```
