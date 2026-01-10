# Blueprint Upload Foundation

## Local Development

1. Start dependencies:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. Run migrations:
   ```bash
   cd backend
   export DATABASE_URL=postgresql+psycopg2://plansite:plansite@localhost:5432/plansite
   alembic upgrade head
   ```

3. Run API:
   ```bash
   cd backend
   export DATABASE_URL=postgresql+psycopg2://plansite:plansite@localhost:5432/plansite
   export REDIS_URL=redis://localhost:6379/0
   export S3_ENDPOINT=http://localhost:9000
   export S3_ACCESS_KEY=minioadmin
   export S3_SECRET_KEY=minioadmin
   export S3_BUCKET=plansite-blueprints
   export S3_REGION=us-east-1
   export S3_SECURE=false
   uvicorn app.main:app --reload --port 8000
   ```

4. Run worker:
   ```bash
   cd backend
   export DATABASE_URL=postgresql+psycopg2://plansite:plansite@localhost:5432/plansite
   export REDIS_URL=redis://localhost:6379/0
   export S3_ENDPOINT=http://localhost:9000
   export S3_ACCESS_KEY=minioadmin
   export S3_SECRET_KEY=minioadmin
   export S3_BUCKET=plansite-blueprints
   export S3_REGION=us-east-1
   export S3_SECURE=false
   python -m app.rq_worker
   ```

5. Run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. End-to-end upload:
   - Create a project at `/projects/new`.
   - Upload a PDF or image.
   - Monitor processing status on `/uploads/:uploadId`.
   - Open viewer at `/pages/:pageId`.

## HEIC Support Plan

HEIC uploads are disabled for now because Pillow requires an additional HEIC codec. Plan: add `pillow-heif` and system `libheif` to the backend image, then enable `image/heic` and `image/heif` MIME types after validation testing.

## Production Deployment (Ubuntu)

1. Create a non-root deploy user:
   ```bash
   sudo adduser deploy
   sudo usermod -aG docker deploy
   ```

2. UFW hardening:
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw default deny incoming
   sudo ufw enable
   ```

3. Docker compose:
   ```bash
   cp .env.example .env
   docker compose up -d --build
   ```

4. Backups:
   - Postgres: `pg_dump` nightly.
   - Object storage: `mc mirror` (MinIO) or `aws s3 sync`.

5. Log rotation:
   - Use `logrotate` for `/var/lib/docker/containers/*/*.log`.
