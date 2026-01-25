# PlansiteOS Quick Start

## 🚀 Local Development (5 minutes)

```bash
# 1. Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# 2. Start API
cd apps/api && npm install && npm run dev

# 3. Start Web App (new terminal)
cd apps/web && npm install && npm run dev

# 4. Open browser
open http://localhost:3000
```

**Access:**
- Web: http://localhost:3000
- API: http://localhost:5001/api
- MinIO: http://localhost:9001

---

## 🌐 Production Deployment (Quick)

```bash
# 1. Configure environment
cp .env.example .env
nano .env  # Update DOMAIN, passwords, API keys

# 2. Deploy
docker compose -f docker-compose.prod.yml up -d

# 3. Check status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

**Access:**
- App: https://app.ctlplumbingllc.com
- Tailscale: http://100.109.158.92:8099

---

## 🔧 Common Commands

### Development
```bash
# View logs
cd apps/api && npm run dev          # API logs
cd apps/web && npm run dev          # Web logs

# Run tests
npm run test                        # All tests
npm run ci                          # Full CI pipeline

# Database migrations
cd packages_temp/db
npm run migrate:latest              # Run migrations
npm run migrate:rollback            # Rollback last
```

### Production
```bash
# Update deployment
git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f node-api

# Restart service
docker compose -f docker-compose.prod.yml restart node-api

# Backup database
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U plansite plansite > backup-$(date +%Y%m%d).sql
```

---

## 🐛 Quick Fixes

**Port in use:**
```bash
sudo lsof -i :5001
sudo kill $(sudo lsof -t -i:5001)
```

**Database issues:**
```bash
docker compose -f docker-compose.prod.yml restart postgres
docker compose -f docker-compose.prod.yml logs postgres
```

**CORS errors:**
- Check `.env` CORS_ORIGIN matches domain
- Restart Caddy: `docker compose -f docker-compose.prod.yml restart caddy`

**Clean slate:**
```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

---

For full documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
