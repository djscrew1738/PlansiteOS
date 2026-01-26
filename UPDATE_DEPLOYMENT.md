# Update Deployment Guide

Quick guide for updating PlansiteOS on your host server with the latest changes.

---

## Quick Update (Standard Process)

### Step 1: SSH to Your Server

```bash
ssh user@your-server-ip
# Or if you have an alias set up:
ssh plansiteos-server
```

### Step 2: Navigate to App Directory

```bash
cd ~/apps/PlansiteOS
# Or wherever you cloned the repository
```

### Step 3: Pull Latest Changes

```bash
# Fetch latest from remote
git fetch origin

# Check what branch you're on
git branch

# Pull latest changes from your working branch
git pull origin claude/code-review-UtED5

# Or if you want to update to main:
# git pull origin main
```

### Step 4: Rebuild and Restart (Docker)

```bash
# Stop current containers
docker compose -f docker-compose.production.yml down

# Rebuild images with new code
docker compose -f docker-compose.production.yml build

# Start services
docker compose -f docker-compose.production.yml up -d

# Watch logs to verify startup
docker compose -f docker-compose.production.yml logs -f
```

**Press Ctrl+C to stop watching logs**

### Step 5: Verify Update

```bash
# Check all containers are running
docker ps

# Test health endpoint
curl http://localhost:8090/api/health

# Check from outside (your laptop)
curl https://app.ctlplumbingllc.com/api/health
```

---

## Alternative: Using Systemd Service

If you set up the systemd service:

```bash
# Navigate to app directory
cd ~/apps/PlansiteOS

# Pull latest changes
git pull origin claude/code-review-UtED5

# Rebuild
docker compose -f docker-compose.production.yml build

# Restart via systemd
sudo systemctl restart plansite

# Check status
sudo systemctl status plansite

# View logs
sudo journalctl -u plansite -f
```

---

## Zero-Downtime Update (Advanced)

For production with no downtime:

```bash
cd ~/apps/PlansiteOS

# Pull changes
git pull origin claude/code-review-UtED5

# Build new images (doesn't affect running containers)
docker compose -f docker-compose.production.yml build

# Rolling restart (updates one service at a time)
docker compose -f docker-compose.production.yml up -d --no-deps api

# Wait a few seconds for health check
sleep 10

# Verify it's working
curl http://localhost:8090/api/health

# If good, restart other services
docker compose -f docker-compose.production.yml up -d
```

---

## Update Specific Components Only

### Update Backend Only

```bash
git pull origin claude/code-review-UtED5

# Rebuild and restart just the API
docker compose -f docker-compose.production.yml build api
docker compose -f docker-compose.production.yml up -d api

# Check logs
docker compose -f docker-compose.production.yml logs -f api
```

### Update Frontend Only

```bash
git pull origin claude/code-review-UtED5

# If serving built files via Caddy
cd frontend
npm install
npm run build
cd ..

# Restart Caddy to pick up new files
docker compose -f docker-compose.production.yml restart caddy
```

### Update Database Migrations

```bash
git pull origin claude/code-review-UtED5

# Run new migrations
docker exec -i plansite-postgres psql -U plansite -d plansite < database/migrations/NEW_MIGRATION.sql

# Or if using the migration runner
./database/run_migrations.sh
```

---

## Troubleshooting Updates

### Issue: "Your branch is behind"

```bash
# Stash any local changes
git stash

# Pull latest
git pull origin claude/code-review-UtED5

# Re-apply stashed changes (if needed)
git stash pop
```

### Issue: "Port already in use"

```bash
# Stop all containers
docker compose -f docker-compose.production.yml down

# Check if anything else is using port 8090
lsof -i :8090

# Kill if needed
sudo kill -9 $(lsof -t -i:8090)

# Restart
docker compose -f docker-compose.production.yml up -d
```

### Issue: "Image build failed"

```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker compose -f docker-compose.production.yml build --no-cache

# Start
docker compose -f docker-compose.production.yml up -d
```

### Issue: Database connection errors after update

```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker logs plansite-postgres

# Restart database
docker compose -f docker-compose.production.yml restart postgres

# Wait for it to be ready
sleep 10

# Restart API
docker compose -f docker-compose.production.yml restart api
```

---

## Rollback to Previous Version

If the update causes issues:

```bash
# Find previous commit
git log --oneline -5

# Rollback to specific commit
git reset --hard COMMIT_HASH

# Rebuild and restart
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Or rollback to last working tag:

```bash
# See available tags
git tag -l

# Checkout tag
git checkout pre-consolidation-v2.0.0

# Rebuild
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

---

## Update Checklist

Before updating:

- [ ] Backup database
- [ ] Check disk space (`df -h`)
- [ ] Note current version/commit (`git log -1`)
- [ ] Verify no users are currently uploading blueprints

During update:

- [ ] Pull latest code
- [ ] Check for new environment variables in `.env.production.example`
- [ ] Run new database migrations
- [ ] Rebuild Docker images
- [ ] Restart services

After update:

- [ ] Verify all containers running (`docker ps`)
- [ ] Check health endpoint (`curl http://localhost:8090/api/health`)
- [ ] Test blueprint upload
- [ ] Check logs for errors
- [ ] Verify public access works

---

## Automated Update Script

Create this script for quick updates:

```bash
#!/bin/bash
# File: update.sh

set -e

echo "Updating PlansiteOS..."

# Navigate to app directory
cd ~/apps/PlansiteOS

# Pull latest
echo "Pulling latest changes..."
git pull origin claude/code-review-UtED5

# Rebuild
echo "Rebuilding containers..."
docker compose -f docker-compose.production.yml build

# Restart
echo "Restarting services..."
docker compose -f docker-compose.production.yml up -d

# Wait for health check
echo "Waiting for services to be ready..."
sleep 15

# Test
echo "Testing health endpoint..."
if curl -f http://localhost:8090/api/health; then
  echo "✓ Update successful!"
else
  echo "✗ Update may have issues. Check logs:"
  echo "docker compose -f docker-compose.production.yml logs -f"
  exit 1
fi

echo ""
echo "Update complete. Check status:"
echo "docker ps"
```

Make it executable:

```bash
chmod +x update.sh
./update.sh
```

---

## Database Backup Before Update

**Always backup before major updates:**

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker exec plansite-postgres pg_dump -U plansite plansite > ~/backups/plansite_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh ~/backups/

# Restore if needed (DON'T run unless you need to restore)
# docker exec -i plansite-postgres psql -U plansite -d plansite < ~/backups/plansite_YYYYMMDD_HHMMSS.sql
```

---

## Monitoring During Update

Watch system resources during update:

```bash
# In one terminal - watch Docker stats
watch docker stats

# In another terminal - watch logs
docker compose -f docker-compose.production.yml logs -f

# In another terminal - watch system resources
htop
```

---

## Update Frequency Recommendations

- **Security updates:** Immediately
- **Bug fixes:** Within 24 hours
- **New features:** Weekly maintenance window
- **Database migrations:** During low-traffic periods
- **Major version upgrades:** Schedule downtime

---

## Quick Reference Commands

```bash
# Standard update
cd ~/apps/PlansiteOS && git pull && docker compose -f docker-compose.production.yml build && docker compose -f docker-compose.production.yml up -d

# Check status
docker ps && curl http://localhost:8090/api/health

# View logs
docker compose -f docker-compose.production.yml logs -f

# Restart everything
docker compose -f docker-compose.production.yml restart

# Stop everything
docker compose -f docker-compose.production.yml down

# Start everything
docker compose -f docker-compose.production.yml up -d
```

---

## Next Steps After Update

1. Monitor logs for 10-15 minutes
2. Test critical functionality
3. Check system status dashboard
4. Verify database integrity
5. Test backup/restore procedure
6. Update runbook with any issues encountered

---

## Support

If issues persist after update:

1. Check logs: `docker compose logs -f`
2. Verify environment variables: `.env.production`
3. Check disk space: `df -h`
4. Review recent commits: `git log -5`
5. Rollback if needed (see above)
6. Check GitHub issues for known problems

---

**Last Updated:** 2026-01-23
**Compatible With:** PlansiteOS v2.0+
