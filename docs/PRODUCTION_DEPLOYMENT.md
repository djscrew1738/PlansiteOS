# PlansiteOS Production Deployment Guide

**Goal:** Deploy PlansiteOS to app.ctlplumbingllc.com with 24/7 availability

**Last Updated:** 2026-01-23

---

## Prerequisites

### Server Requirements

- **VPS or Dedicated Server** (recommended specs):
  - 4 GB RAM minimum
  - 2 CPU cores minimum
  - 50 GB disk space
  - Ubuntu 22.04 LTS or similar
  - Public IP address
  - Root or sudo access

- **Domain Name:**
  - `ctlplumbingllc.com` with DNS management access
  - Ability to create A records

### Required Software

- Docker (20.10+)
- Docker Compose (2.0+)
- Git

### Required Credentials

- Anthropic API key
- Server SSH access
- Domain DNS access

---

## Deployment Overview

```
Internet
    ↓
DNS (app.ctlplumbingllc.com)
    ↓
Server Public IP
    ↓
Caddy (Port 80/443) → Auto HTTPS
    ↓
Backend API (Port 5000) → Node.js Express
    ↓
PostgreSQL (Port 5432) + Redis (Port 6379)
```

---

## Step 1: Prepare Your Server

### 1.1 Connect to Server

```bash
ssh user@your-server-ip
```

### 1.2 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 1.4 Install Git

```bash
sudo apt install git -y
```

### 1.5 Configure Firewall

```bash
# Install UFW if not present
sudo apt install ufw -y

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

---

## Step 2: Configure DNS

### 2.1 Add DNS Records

Log into your domain registrar or DNS provider and add:

**A Record:**
```
Type: A
Name: app
Value: YOUR_SERVER_PUBLIC_IP
TTL: 3600
```

**Result:** `app.ctlplumbingllc.com` → Your server IP

### 2.2 Verify DNS Propagation

```bash
# Check from your local machine
dig app.ctlplumbingllc.com

# Or use online tool
# https://dnschecker.org/
```

⏱️ DNS propagation can take 5 minutes to 48 hours. Usually 15-30 minutes.

---

## Step 3: Clone Repository

```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/djscrew1738/PlansiteOS.git
cd PlansiteOS

# Checkout the production-ready branch
git checkout main  # or your production branch
```

---

## Step 4: Configure Environment

### 4.1 Create Production Environment File

```bash
cp .env.production.example .env.production
```

### 4.2 Edit Environment Variables

```bash
nano .env.production
```

**Required variables:**

```bash
# Database
POSTGRES_PASSWORD=CREATE_STRONG_PASSWORD_HERE_32_CHARS_MIN

# AI Service
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here

# Domain (will be used by backend)
DOMAIN=ctlplumbingllc.com

# CORS (allow your domain)
CORS_ORIGIN=https://app.ctlplumbingllc.com,https://ctlplumbingllc.com
```

**Generate strong password:**
```bash
openssl rand -base64 32
```

### 4.3 Set Secure Permissions

```bash
chmod 600 .env.production
```

---

## Step 5: Update Caddy Configuration

### 5.1 Review Caddyfile

Check `Caddyfile.production`:
- Ensure domain matches: `app.ctlplumbingllc.com`
- Ensure backend port matches: `localhost:5000`

### 5.2 Important: Choose Frontend Serving Method

**Option A: Proxy to frontend dev server (simpler for now)**
- Already configured in Caddyfile.production
- Proxies to `localhost:5173`

**Option B: Serve built static files (production recommended)**

Edit `Caddyfile.production` and uncomment:
```caddyfile
# Comment out the reverse_proxy line
# reverse_proxy localhost:5173 { ... }

# Uncomment these lines:
root * /home/user/PlansiteOS/frontend/dist
file_server
try_files {path} /index.html
```

Then build the frontend:
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Step 6: Build and Deploy

### 6.1 Load Environment Variables

```bash
export $(cat .env.production | xargs)
```

### 6.2 Build Docker Images

```bash
docker compose -f docker-compose.production.yml build
```

This will:
- Build Node.js backend image
- Pull PostgreSQL, Redis, and Caddy images

### 6.3 Start Services

```bash
docker compose -f docker-compose.production.yml up -d
```

### 6.4 Verify Services Are Running

```bash
docker compose -f docker-compose.production.yml ps
```

You should see:
```
NAME                  STATUS
plansite-postgres     Up (healthy)
plansite-redis        Up (healthy)
plansite-api          Up (healthy)
plansite-caddy        Up
```

### 6.5 Check Logs

```bash
# All services
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f caddy
```

---

## Step 7: Run Database Migrations

```bash
# Connect to postgres container
docker exec -it plansite-postgres psql -U plansite -d plansite

# Verify tables exist
\dt

# Exit
\q
```

If tables don't exist, run migrations:

```bash
docker exec -i plansite-postgres psql -U plansite -d plansite < database/migrations/001_init.sql
docker exec -i plansite-postgres psql -U plansite -d plansite < database/migrations/002_vector_store.sql
docker exec -i plansite-postgres psql -U plansite -d plansite < database/migrations/003_materialized_views.sql
```

---

## Step 8: Test the Deployment

### 8.1 Local Health Check

```bash
# From the server
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123,
  "services": {
    "database": "connected",
    "ai": "configured"
  }
}
```

### 8.2 Test HTTPS Access

```bash
# From your local machine (after DNS propagates)
curl https://app.ctlplumbingllc.com/health
```

### 8.3 Test in Browser

Open: https://app.ctlplumbingllc.com

You should see:
- 🔒 Secure HTTPS connection (Let's Encrypt certificate)
- PlansiteOS frontend loaded
- No certificate warnings

---

## Step 9: Set Up Systemd Service (Auto-Start on Boot)

### 9.1 Update Service File Path

Edit `plansite.service`:
```bash
nano plansite.service
```

Update `WorkingDirectory` to match your path:
```ini
WorkingDirectory=/home/YOUR_USERNAME/apps/PlansiteOS
```

Update `User`:
```ini
User=YOUR_USERNAME
```

Update docker-compose file reference:
```ini
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
ExecReload=/usr/bin/docker compose -f docker-compose.production.yml up -d --remove-orphans
```

### 9.2 Install Service

```bash
sudo cp plansite.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable plansite.service
```

### 9.3 Test Service

```bash
# Stop current containers
docker compose -f docker-compose.production.yml down

# Start via systemd
sudo systemctl start plansite

# Check status
sudo systemctl status plansite

# View logs
sudo journalctl -u plansite -f
```

### 9.4 Verify Auto-Start

```bash
# Reboot server (optional test)
sudo reboot

# After reboot, SSH back and check
docker ps
# Should show all containers running
```

---

## Step 10: Configure Monitoring (Optional but Recommended)

### 10.1 Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/plansite
```

Add:
```
/home/YOUR_USERNAME/apps/PlansiteOS/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 YOUR_USERNAME YOUR_USERNAME
    sharedscripts
    postrotate
        docker compose -f /home/YOUR_USERNAME/apps/PlansiteOS/docker-compose.production.yml kill -s USR1 api
    endscript
}
```

### 10.2 Set Up Disk Space Monitoring

```bash
# Add to crontab
crontab -e
```

Add:
```bash
# Check disk space daily
0 8 * * * df -h / | awk 'NR==2 {if ($5+0 > 80) print "Disk usage is at "$5}' | mail -s "PlansiteOS Disk Alert" your@email.com
```

---

## Step 11: SSL Certificate Verification

Caddy automatically obtains and renews SSL certificates from Let's Encrypt.

### 11.1 Verify Certificate

```bash
# Check Caddy logs for certificate
docker compose -f docker-compose.production.yml logs caddy | grep -i certificate
```

### 11.2 Test SSL

Online tools:
- https://www.ssllabs.com/ssltest/
- Enter: `app.ctlplumbingllc.com`
- Should get A or A+ rating

---

## Maintenance & Operations

### Starting the App

```bash
sudo systemctl start plansite
```

### Stopping the App

```bash
sudo systemctl stop plansite
```

### Restarting the App

```bash
sudo systemctl restart plansite
```

### Viewing Logs

```bash
# All logs
sudo journalctl -u plansite -f

# Docker logs
cd ~/apps/PlansiteOS
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f api
```

### Updating the Application

```bash
cd ~/apps/PlansiteOS

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.production.yml build
sudo systemctl restart plansite
```

### Database Backup

```bash
# Create backup
docker exec plansite-postgres pg_dump -U plansite plansite > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i plansite-postgres psql -U plansite -d plansite < backup_20260123.sql
```

### Monitoring Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up old images
docker system prune -a
```

---

## Troubleshooting

### Issue: Can't Access app.ctlplumbingllc.com

**Check 1: DNS**
```bash
dig app.ctlplumbingllc.com
# Should show your server IP
```

**Check 2: Firewall**
```bash
sudo ufw status
# Should show ports 80 and 443 allowed
```

**Check 3: Services Running**
```bash
docker ps
# Should show all containers
```

**Check 4: Caddy Logs**
```bash
docker compose -f docker-compose.production.yml logs caddy
# Look for errors
```

### Issue: SSL Certificate Not Working

**Wait for DNS propagation** (up to 48 hours)

**Check Caddy logs:**
```bash
docker compose -f docker-compose.production.yml logs caddy | grep -i acme
```

**Force certificate refresh:**
```bash
docker compose -f docker-compose.production.yml restart caddy
```

### Issue: API Not Responding

**Check API health:**
```bash
curl http://localhost:5000/health
```

**Check API logs:**
```bash
docker compose -f docker-compose.production.yml logs api
```

**Check database connection:**
```bash
docker exec plansite-postgres pg_isready -U plansite
```

### Issue: Database Connection Failed

**Check PostgreSQL:**
```bash
docker compose -f docker-compose.production.yml ps postgres
# Should show "healthy"
```

**Check environment variables:**
```bash
docker compose -f docker-compose.production.yml exec api env | grep DATABASE
```

**Verify password:**
```bash
docker exec -it plansite-postgres psql -U plansite -d plansite
# Should connect without errors
```

### Issue: Out of Disk Space

**Check space:**
```bash
df -h
```

**Clean Docker:**
```bash
docker system prune -a --volumes
# WARNING: This removes all unused data
```

**Clean logs:**
```bash
find logs/ -name "*.log" -mtime +30 -delete
```

---

## Security Checklist

- [ ] Strong database password (32+ characters)
- [ ] `.env.production` has 600 permissions
- [ ] Firewall enabled (UFW)
- [ ] Only ports 22, 80, 443 open
- [ ] SSH key authentication enabled
- [ ] Password SSH authentication disabled
- [ ] Regular backups configured
- [ ] Log monitoring set up
- [ ] SSL certificate auto-renewing (Caddy handles this)
- [ ] Database not exposed to public internet (127.0.0.1 only)
- [ ] Redis not exposed to public internet (127.0.0.1 only)

---

## Performance Optimization

### Enable HTTP/3

Already enabled in `docker-compose.production.yml`:
```yaml
ports:
  - "443:443/udp"  # HTTP/3
```

### Database Tuning

Edit PostgreSQL config:
```bash
docker exec -it plansite-postgres bash
vi /var/lib/postgresql/data/postgresql.conf
```

Add:
```
shared_buffers = 256MB
effective_cache_size = 1GB
max_connections = 100
```

Restart:
```bash
docker compose -f docker-compose.production.yml restart postgres
```

### Redis Tuning

Already configured in docker-compose:
```yaml
command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

---

## Scaling Considerations

When you outgrow a single server:

1. **Separate Database Server**
   - Move PostgreSQL to dedicated server
   - Update `DATABASE_URL` in .env

2. **Load Balancer**
   - Add multiple API containers
   - Use Nginx/HAProxy for load balancing

3. **Object Storage**
   - Move uploads to S3/MinIO
   - Update file upload configuration

4. **CDN**
   - Add Cloudflare in front
   - Cache static assets

---

## Next Steps

After deployment:

1. **Set up monitoring** - Prometheus/Grafana (see `docs/PRODUCTION_CONFIG_REVIEW.md`)
2. **Configure backups** - Automated daily database backups
3. **Add authentication** - Implement user login system
4. **Performance testing** - Load test with realistic data
5. **Documentation** - Document your specific deployment details

---

## Support

- **Documentation:** See other docs in `/docs`
- **Issues:** https://github.com/djscrew1738/PlansiteOS/issues
- **Server Logs:** `docker compose logs` and `journalctl`

---

## Quick Reference

```bash
# Start app
sudo systemctl start plansite

# Stop app
sudo systemctl stop plansite

# Restart app
sudo systemctl restart plansite

# View logs
docker compose -f docker-compose.production.yml logs -f

# Database backup
docker exec plansite-postgres pg_dump -U plansite plansite > backup.sql

# Update app
git pull && docker compose -f docker-compose.production.yml build && sudo systemctl restart plansite

# Check status
sudo systemctl status plansite
docker ps
```

---

**Deployment Time Estimate:** 1-2 hours (excluding DNS propagation)

**Your URL:** https://app.ctlplumbingllc.com
