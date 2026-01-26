# PlansiteOS Deployment Quick Reference

One-page cheat sheet for common deployment operations.

---

## 🚀 Quick Update (Most Common)

```bash
# SSH to server
ssh user@your-server-ip

# Navigate and update
cd ~/apps/PlansiteOS
./update.sh
```

**That's it!** The script handles everything.

---

## 📋 Common Commands

### Check Status

```bash
# All containers
docker ps

# Specific service
docker compose -f docker-compose.production.yml ps

# Health check
curl http://localhost:8090/api/health

# System status
curl http://localhost:8090/api/status | jq
```

### View Logs

```bash
# All services (live tail)
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f postgres
docker compose -f docker-compose.production.yml logs -f caddy

# Last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100 api
```

### Restart Services

```bash
# All services
docker compose -f docker-compose.production.yml restart

# Specific service
docker compose -f docker-compose.production.yml restart api
docker compose -f docker-compose.production.yml restart caddy

# Via systemd (if configured)
sudo systemctl restart plansite
```

### Stop/Start Services

```bash
# Stop all
docker compose -f docker-compose.production.yml down

# Start all
docker compose -f docker-compose.production.yml up -d

# Stop specific service
docker compose -f docker-compose.production.yml stop api

# Start specific service
docker compose -f docker-compose.production.yml start api
```

---

## 🔧 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs api

# Rebuild and restart
docker compose -f docker-compose.production.yml build api
docker compose -f docker-compose.production.yml up -d api
```

### Database Issues

```bash
# Check database is running
docker ps | grep postgres

# Check database logs
docker logs plansite-postgres

# Restart database
docker compose -f docker-compose.production.yml restart postgres
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker cache
docker system prune -a

# Remove old images
docker image prune -a
```

### Port Already in Use

```bash
# Find what's using port 8090
lsof -i :8090

# Kill the process
sudo kill -9 $(lsof -t -i:8090)

# Restart services
docker compose -f docker-compose.production.yml up -d
```

---

## 💾 Database Operations

### Backup Database

```bash
# Create backup
docker exec plansite-postgres pg_dump -U plansite plansite > backup_$(date +%Y%m%d).sql

# Verify backup
ls -lh backup_*.sql
```

### Restore Database

```bash
# Restore from backup
docker exec -i plansite-postgres psql -U plansite -d plansite < backup_20260123.sql
```

### Run Migration

```bash
# Single migration
docker exec -i plansite-postgres psql -U plansite -d plansite < database/migrations/001_init.sql

# All migrations
./database/run_migrations.sh
```

### Connect to Database

```bash
# Via Docker
docker exec -it plansite-postgres psql -U plansite -d plansite

# Common queries
SELECT COUNT(*) FROM blueprints;
SELECT * FROM blueprints ORDER BY created_at DESC LIMIT 10;
\dt  -- List tables
\q   -- Quit
```

---

## 🔄 Git Operations

### Pull Latest Changes

```bash
cd ~/apps/PlansiteOS
git pull origin claude/code-review-UtED5
```

### Check Current Version

```bash
git log -1 --oneline
git status
```

### View Recent Changes

```bash
git log --oneline -10
git show HEAD
```

### Switch Branch

```bash
git fetch origin
git checkout main
git pull origin main
```

---

## 🌐 Testing Access

### Local (on server)

```bash
# Health check
curl http://localhost:8090/api/health

# Full status
curl http://localhost:8090/api/status | jq

# List blueprints
curl http://localhost:8090/api/blueprints | jq
```

### External (from your laptop)

```bash
# Health check
curl https://app.ctlplumbingllc.com/api/health

# Full status
curl https://app.ctlplumbingllc.com/api/status | jq

# Open in browser
open https://app.ctlplumbingllc.com
```

---

## 📊 Monitoring

### Resource Usage

```bash
# All containers
docker stats

# Disk space
df -h

# Memory
free -h

# System load
uptime
htop
```

### Service Health

```bash
# Check all services
curl http://localhost:8090/api/status | jq '.services'

# Check specific service
curl http://localhost:8090/api/status/database | jq
curl http://localhost:8090/api/status/ai | jq
curl http://localhost:8090/api/status/blueprints | jq
```

---

## 🔒 Security

### Update SSL Certificate

```bash
# Caddy handles this automatically
# To force renewal:
docker compose -f docker-compose.production.yml restart caddy
```

### Check Firewall

```bash
# Check status
sudo ufw status

# Allow port (if needed)
sudo ufw allow 8090/tcp
```

### Update Environment Variables

```bash
# Edit production env
nano .env.production

# Restart to apply
docker compose -f docker-compose.production.yml restart api
```

---

## 📦 Complete Rebuild

If something is really broken:

```bash
# Stop everything
docker compose -f docker-compose.production.yml down

# Remove all containers and volumes (CAREFUL!)
docker compose -f docker-compose.production.yml down -v

# Clean Docker
docker system prune -a

# Rebuild from scratch
docker compose -f docker-compose.production.yml build --no-cache

# Start fresh
docker compose -f docker-compose.production.yml up -d
```

---

## 🆘 Emergency Rollback

```bash
# Find previous version
git log --oneline -5

# Rollback
git reset --hard COMMIT_HASH

# Rebuild and restart
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

---

## 📞 Support Contacts

- **Documentation:** `/docs` directory
- **Issues:** GitHub Issues
- **Logs Location:** `~/apps/PlansiteOS/logs`
- **Backups Location:** `~/backups`

---

## 🔖 Bookmarks

**Local URLs (on server):**
- Health: http://localhost:8090/api/health
- Status: http://localhost:8090/api/status
- Metrics: http://localhost:8090/api/status/metrics

**Public URLs:**
- App: https://app.ctlplumbingllc.com
- API: https://app.ctlplumbingllc.com/api
- Health: https://app.ctlplumbingllc.com/api/health

---

## 📝 Quick Notes

**Default Port:** 8090
**Branch:** claude/code-review-UtED5
**Docker Compose File:** docker-compose.production.yml
**Env File:** .env.production

**Update Frequency:**
- Security: Immediate
- Bugs: Daily
- Features: Weekly

---

**Print this page and keep it handy!** 📄
