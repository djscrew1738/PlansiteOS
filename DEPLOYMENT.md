# PlansiteOS Deployment Guide

Complete guide for running PlansiteOS locally and in production.

---

## 🏠 Running Locally (Development)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Quick Start

#### 1. Clone and Install Dependencies
```bash
git clone https://github.com/djscrew1738/PlansiteOS.git
cd PlansiteOS
npm install
```

#### 2. Start Infrastructure Services (Database, Redis, MinIO)
```bash
docker compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- MinIO on `localhost:9000` (console: `localhost:9001`)

#### 3. Configure Environment Variables
Create `.env` file in root (or use existing):
```env
# Database
DATABASE_URL=postgresql://plansite:plansite@localhost:5432/plansite

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=plansite-blueprints

# AI Services
ANTHROPIC_API_KEY=your-api-key-here

# Development
NODE_ENV=development
```

#### 4. Run Database Migrations
```bash
cd packages_temp/db
npm run migrate:latest
cd ../..
```

#### 5. Start Applications

**Option A: Run All Apps in Separate Terminals**

Terminal 1 - API Server:
```bash
cd apps/api
npm install
npm run dev
# API runs on http://localhost:8090
```

Terminal 2 - Main Web App:
```bash
cd apps/web
npm install
npm run dev
# Web app runs on http://localhost:3000
```

Terminal 3 - Blueprint Foundation App:
```bash
cd apps/blueprint-foundation/frontend
npm install
npm run dev
# Blueprint app runs on http://localhost:5173
```

Terminal 4 - Worker (Optional):
```bash
cd apps/worker
npm install
npm run dev
```

**Option B: Use Legacy Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Access Development Environment

- **Web App**: http://localhost:3000
- **Blueprint Foundation**: http://localhost:5173
- **API**: http://localhost:8090
- **MinIO Console**: http://localhost:9001 (user: minioadmin / minioadmin)
- **Postgres**: localhost:5432 (user: plansite / plansite)

### Development Tips

- Hot reload is enabled for all apps
- API logs are in `apps/api/src/logs/`
- Use `npm run test` to run all tests
- Use `npm run ci` for full CI pipeline test

---

## 🌐 Running Remotely (Production)

### Server Requirements
- Ubuntu 20.04+ or similar Linux distro
- Docker & Docker Compose
- 2GB+ RAM
- Domain name (optional but recommended)
- Open ports: 80, 443 (or 8099 for Tailscale)

### Production Deployment

#### 1. SSH into Server
```bash
ssh user@your-server-ip
```

#### 2. Clone Repository
```bash
git clone https://github.com/djscrew1738/PlansiteOS.git
cd PlansiteOS
```

#### 3. Configure Production Environment

Create/edit `.env` file:
```env
# Domain Configuration
DOMAIN=app.ctlplumbingllc.com
ADMIN_EMAIL=admin@ctlplumbingllc.com
TAILSCALE_IP=100.109.158.92  # If using Tailscale

# Database (Generate secure password!)
POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
DATABASE_URL=postgresql://plansite:CHANGE_THIS_SECURE_PASSWORD@postgres:5432/plansite

# Redis
REDIS_URL=redis://redis:6379/0

# MinIO Object Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=CHANGE_THIS_SECURE_PASSWORD
S3_BUCKET=plansite-blueprints

# CORS & API
CORS_ORIGIN=https://app.ctlplumbingllc.com
VITE_API_BASE=https://app.ctlplumbingllc.com

# AI Services
ANTHROPIC_API_KEY=your-api-key-here

# Production Settings
NODE_ENV=production
```

#### 4. DNS Configuration (For Public Access)

Add these DNS records to your domain:
```
A    app.ctlplumbingllc.com  →  YOUR_SERVER_PUBLIC_IP
A    ctlplumbingllc.com       →  YOUR_SERVER_PUBLIC_IP
```

Wait 5-10 minutes for DNS propagation.

#### 5. Build and Start Production Stack
```bash
# Build all Docker images
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

This starts:
- PostgreSQL (internal only)
- Redis (internal only)
- MinIO (internal only)
- Prometheus & Grafana (monitoring)
- Node API service
- Frontend service
- Caddy (reverse proxy with auto HTTPS)

#### 6. Verify Deployment
```bash
# Check all services are running
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Check specific service
docker compose -f docker-compose.prod.yml logs -f node-api
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f caddy
```

#### 7. Access Production Environment

**With Domain (HTTPS)**:
- **App**: https://app.ctlplumbingllc.com
- **API**: https://app.ctlplumbingllc.com/api
- **Health**: https://app.ctlplumbingllc.com/health

**With Tailscale/Internal**:
- **App**: http://100.109.158.92:8099
- **API**: http://100.109.158.92:8099/api

**Monitoring**:
- **Prometheus**: http://YOUR_SERVER_IP:9090
- **Grafana**: http://YOUR_SERVER_IP:3001 (user: admin / admin)

---

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f node-api
docker compose -f docker-compose.prod.yml logs -f caddy

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 node-api
```

### Check Service Health
```bash
# Health check endpoint
curl http://localhost:8099/health

# Or via domain
curl https://app.ctlplumbingllc.com/health
```

### Container Stats
```bash
docker stats
```

---

## 🔄 Updates & Maintenance

### Update Production Deployment
```bash
cd PlansiteOS

# Pull latest changes
git pull origin main

# Rebuild and restart services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Check everything is running
docker compose -f docker-compose.prod.yml ps
```

### Database Backup
```bash
# Backup database
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U plansite plansite > backup-$(date +%Y%m%d).sql

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U plansite plansite < backup-20260122.sql
```

### Reset Environment (⚠️ Destructive)
```bash
# Stop and remove all containers and volumes
docker compose -f docker-compose.prod.yml down -v

# Start fresh
docker compose -f docker-compose.prod.yml up -d
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8090
sudo lsof -i :8090

# Or kill the process
sudo kill $(sudo lsof -t -i:8090)
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Check logs
docker compose -f docker-compose.prod.yml logs postgres

# Restart database
docker compose -f docker-compose.prod.yml restart postgres
```

### CORS Errors
- Check `CORS_ORIGIN` in `.env` matches your domain
- Verify Caddy configuration includes your domain
- Check browser console for specific origin errors

### Caddy SSL Certificate Issues
```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Verify DNS is pointing to your server
dig app.ctlplumbingllc.com

# Restart Caddy
docker compose -f docker-compose.prod.yml restart caddy
```

### Service Won't Start
```bash
# Check specific service logs
docker compose -f docker-compose.prod.yml logs service-name

# Inspect service
docker compose -f docker-compose.prod.yml ps

# Rebuild service
docker compose -f docker-compose.prod.yml build service-name
docker compose -f docker-compose.prod.yml up -d service-name
```

---

## 📝 Architecture Overview

### Local Development Stack
```
┌─────────────────────────────────────┐
│  apps/web (React)      :3000        │
│  apps/api (Node)       :8090        │
│  blueprint-foundation  :5173        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  Docker Services                    │
│  - PostgreSQL          :5432        │
│  - Redis               :6379        │
│  - MinIO               :9000        │
└─────────────────────────────────────┘
```

### Production Stack
```
Internet → Caddy (:80/:443) →
    ├→ Frontend (:4173) → React SPA
    ├→ Node API (:8090) → Express Server
    │   ├→ PostgreSQL (internal)
    │   ├→ Redis (internal)
    │   └→ MinIO (internal)
    └→ Monitoring
        ├→ Prometheus (:9090)
        └→ Grafana (:3001)
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Set `NODE_ENV=production` in production
- [ ] Configure firewall (ufw/iptables)
- [ ] Enable SSL/HTTPS (Caddy does this automatically)
- [ ] Restrict database access to internal network only
- [ ] Set up regular backups
- [ ] Configure log rotation
- [ ] Monitor with Grafana/Prometheus
- [ ] Keep Docker images updated

---

## 📚 Additional Resources

- **API Documentation**: See `apps/api/README.md`
- **Frontend Docs**: See `apps/web/README.md`
- **Database Migrations**: See `packages_temp/db/README.md`
- **CI/CD Pipeline**: See `scripts/ci.sh`

---

For issues or questions, open an issue on GitHub:
https://github.com/djscrew1738/PlansiteOS/issues
