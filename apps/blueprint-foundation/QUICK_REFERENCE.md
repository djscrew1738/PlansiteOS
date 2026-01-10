# Quick Reference Guide

Fast lookup for common tasks and commands.

## Local Development

### Start Services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Start Worker
```bash
cd backend
source venv/bin/activate
python worker/worker.py
```

### Start Frontend
```bash
cd frontend
npm run dev
```

### Database Migrations
```bash
cd backend
alembic upgrade head              # Apply migrations
alembic revision -m "message"     # Create migration
alembic downgrade -1              # Rollback
```

## Production Commands

### Deploy
```bash
docker compose up -d
docker compose exec api alembic upgrade head
```

### View Logs
```bash
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f caddy
```

### Restart Service
```bash
docker compose restart api
docker compose restart worker
```

### Scale Workers
```bash
docker compose up -d --scale worker=3
```

### Backup Database
```bash
docker compose exec postgres pg_dump -U postgres blueprints | gzip > backup.sql.gz
```

### Restore Database
```bash
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U postgres blueprints
```

## URLs

### Local Development
- Frontend: http://localhost:5173
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)

### Production
- Application: https://your-domain.com
- API: https://your-domain.com/api
- Health: https://your-domain.com/api/health

## Environment Variables

### Required
```bash
DOMAIN=blueprints.example.com
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
MINIO_ROOT_PASSWORD=<strong-password>
```

### Optional
```bash
MAX_UPLOAD_SIZE=104857600           # 100MB
RATE_LIMIT_PER_MINUTE=10
IMAGE_TARGET_DPI=300
BLUR_THRESHOLD=100.0
LOW_RES_THRESHOLD=1800
```

## File Locations

### Backend
- **API**: `backend/app/main.py`
- **Models**: `backend/app/models.py`
- **Routers**: `backend/app/routers/`
- **Worker**: `backend/worker/tasks.py`
- **Processing**: `backend/processor/image_processor.py`
- **Migrations**: `backend/alembic/versions/`

### Frontend
- **App**: `frontend/src/App.tsx`
- **API Client**: `frontend/src/api/client.ts`
- **Components**: `frontend/src/components/`
- **Pages**: `frontend/src/pages/`
- **Types**: `frontend/src/types/index.ts`

### Config
- **Docker Compose Dev**: `docker-compose.dev.yml`
- **Docker Compose Prod**: `docker-compose.yml`
- **Caddy**: `Caddyfile`
- **Environment**: `.env` (not committed)

## Common Issues

### "Connection refused" on localhost:8000
```bash
# Check if API is running
ps aux | grep uvicorn

# Check logs
tail -f backend/logs/api.log
```

### Worker not processing jobs
```bash
# Check Redis connection
docker compose exec redis redis-cli ping

# Restart worker
docker compose restart worker

# Check worker logs
docker compose logs worker
```

### Images not loading
```bash
# Check MinIO is running
docker compose ps minio

# Check bucket exists
docker compose exec minio mc ls myminio/

# Verify storage credentials in .env
```

### Caddy TLS certificate issues
```bash
# Check DNS points to server
dig your-domain.com

# View Caddy logs
docker compose logs caddy

# Restart Caddy
docker compose restart caddy
```

### Database migration errors
```bash
# Check current revision
cd backend
alembic current

# View migration history
alembic history

# Force revision (use carefully!)
alembic stamp head
```

## API Quick Tests

### Health Check
```bash
curl http://localhost:8000/api/health
```

### Create Project
```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "foundation_type": "SLAB",
    "floors": 1
  }'
```

### Upload File
```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/uploads \
  -F "file=@blueprint.pdf"
```

### Get Upload Status
```bash
curl http://localhost:8000/api/uploads/{upload_id}
```

## Performance Tuning

### Increase Worker Instances
```yaml
# In docker-compose.yml
docker compose up -d --scale worker=5
```

### Increase Database Connections
```python
# In backend/app/database.py
engine = create_engine(
    settings.database_url,
    pool_size=20,           # Default: 10
    max_overflow=40,        # Default: 20
)
```

### Redis Memory Limit
```yaml
# In docker-compose.yml
redis:
  command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### Caddy Response Caching
```caddyfile
# In Caddyfile under handle /api/*
cache {
    ttl 5m
    stale 1h
}
```

## Monitoring

### Check Disk Usage
```bash
df -h
docker system df
```

### Check Memory Usage
```bash
free -h
docker stats
```

### Check Container Health
```bash
docker compose ps
docker inspect --format='{{.State.Health.Status}}' blueprints-api
```

### View Recent Logs
```bash
docker compose logs --tail=100 api
journalctl -xe -n 100
```

## Backup and Restore

### Manual Backup
```bash
# Database
docker compose exec postgres pg_dump -U postgres blueprints > backup.sql

# MinIO data
docker compose exec minio mc mirror myminio/blueprints /backup

# Application files
tar -czf app-backup.tar.gz backend/ frontend/ docker-compose.yml Caddyfile .env
```

### Automated Backup (Cron)
```cron
0 2 * * * /home/deploy/backup-db.sh
30 2 * * * /home/deploy/backup-minio.sh
```

### Restore from Backup
```bash
# Database
cat backup.sql | docker compose exec -T postgres psql -U postgres blueprints

# MinIO
docker compose exec minio mc mirror /backup myminio/blueprints
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall (UFW)
- [ ] Set up SSL/TLS (automatic with Caddy)
- [ ] Enable security headers (included in Caddyfile)
- [ ] Configure backups
- [ ] Set up log rotation
- [ ] Review CORS origins
- [ ] Audit exposed ports
- [ ] Update dependencies regularly
- [ ] Monitor logs for suspicious activity

## Getting Help

1. **Check logs**: `docker compose logs -f`
2. **Verify health**: `curl /api/health`
3. **Review docs**: README.md, DEPLOY.md
4. **Check GitHub issues**: [your-repo]/issues
5. **Contact**: [your-support-email]

## Useful Links

- **API Documentation**: http://localhost:8000/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **Konva Docs**: https://konvajs.org/docs/
- **Docker Docs**: https://docs.docker.com/
- **Caddy Docs**: https://caddyserver.com/docs/
