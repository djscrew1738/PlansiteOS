# Production Deployment Guide

Complete guide for deploying Blueprint Upload Foundation to Ubuntu production server.

## Prerequisites

- Ubuntu 22.04 LTS server
- Domain name with DNS configured
- Root or sudo access
- Minimum 2GB RAM, 2 CPU cores, 20GB storage

## Step 1: Server Hardening

### Create Deploy User

```bash
# As root
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Copy your SSH key
cat ~/.ssh/authorized_keys > /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user
su - deploy
```

### Configure Firewall

```bash
# Enable UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### Update System

```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### Install Docker

```bash
# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add deploy user to docker group
sudo usermod -aG docker deploy

# Log out and back in for group changes to take effect
exit
# Then: su - deploy

# Verify Docker installation
docker --version
docker compose version
```

## Step 2: Clone and Configure Application

```bash
# Clone repository
cd /home/deploy
git clone <your-repo-url> blueprint-foundation
cd blueprint-foundation

# Create .env file from template
cp .env.example .env

# Edit environment variables
nano .env
```

### Required .env Configuration

```bash
# Domain
DOMAIN=blueprints.example.com

# Database credentials (generate strong passwords)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Copy these to .env
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo "MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD"
```

**Important**: Save these passwords securely!

## Step 3: DNS Configuration

Configure your DNS to point to your server:

```
A Record:  blueprints.example.com -> YOUR_SERVER_IP
```

Wait for DNS propagation (use `dig blueprints.example.com` to verify).

## Step 4: Deploy Application

```bash
cd /home/deploy/blueprint-foundation

# Build and start services
docker compose up -d

# Verify all containers are running
docker compose ps

# Check logs
docker compose logs -f
```

Expected containers:
- blueprints-postgres
- blueprints-redis
- blueprints-minio
- blueprints-minio-init
- blueprints-api
- blueprints-worker
- blueprints-frontend
- blueprints-caddy

## Step 5: Run Database Migrations

```bash
docker compose exec api alembic upgrade head
```

## Step 6: Verify Deployment

### Health Check

```bash
# Via internal API
docker compose exec api curl http://localhost:8000/api/health

# Via public domain (wait for Caddy to provision TLS certificate)
curl https://blueprints.example.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "ok",
  "redis": "ok",
  "storage": "ok"
}
```

### Test Upload

1. Navigate to https://blueprints.example.com
2. Create a new project
3. Upload a test blueprint
4. Verify processing completes
5. Open page viewer and test calibration

## Step 7: Monitoring and Logs

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f caddy

# Recent logs
docker compose logs --tail=100 api
```

### Container Status

```bash
docker compose ps
docker stats
```

## Step 8: Backups

### Database Backup

```bash
# Create backup script
cat > /home/deploy/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose exec -T postgres pg_dump -U postgres blueprints | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.sql.gz"
EOF

chmod +x /home/deploy/backup-db.sh

# Test backup
cd /home/deploy/blueprint-foundation
/home/deploy/backup-db.sh
```

### Object Storage Backup

```bash
# Create MinIO backup script
cat > /home/deploy/backup-minio.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups/minio"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Sync MinIO data
docker compose exec -T minio mc mirror myminio/blueprints /backup

# Compress backup
tar -czf $BACKUP_DIR/minio_$TIMESTAMP.tar.gz -C /var/lib/docker/volumes/blueprint-foundation_minio_data/_data .

# Keep only last 7 days
find $BACKUP_DIR -name "minio_*.tar.gz" -mtime +7 -delete

echo "Backup completed: minio_$TIMESTAMP.tar.gz"
EOF

chmod +x /home/deploy/backup-minio.sh
```

### Automated Backups with Cron

```bash
# Edit crontab
crontab -e

# Add daily backups at 2 AM
0 2 * * * cd /home/deploy/blueprint-foundation && /home/deploy/backup-db.sh >> /home/deploy/backups/backup.log 2>&1
30 2 * * * cd /home/deploy/blueprint-foundation && /home/deploy/backup-minio.sh >> /home/deploy/backups/backup.log 2>&1
```

## Step 9: Log Rotation

```bash
# Create log rotation config
sudo tee /etc/logrotate.d/blueprint-foundation << 'EOF'
/home/deploy/blueprint-foundation/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        docker compose -f /home/deploy/blueprint-foundation/docker-compose.yml restart api worker > /dev/null 2>&1 || true
    endscript
}
EOF
```

## Step 10: Updates and Maintenance

### Update Application

```bash
cd /home/deploy/blueprint-foundation

# Pull latest code
git pull

# Rebuild and restart services
docker compose build --no-cache
docker compose up -d

# Run new migrations
docker compose exec api alembic upgrade head

# Verify health
curl https://blueprints.example.com/api/health
```

### Scale Workers

```bash
# Edit docker-compose.yml to add more workers
docker compose up -d --scale worker=3
```

### View Resource Usage

```bash
docker stats
df -h
free -m
```

## Troubleshooting

### Caddy TLS Certificate Issues

```bash
# Check Caddy logs
docker compose logs caddy

# Verify DNS resolves correctly
dig blueprints.example.com

# Restart Caddy
docker compose restart caddy
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker compose logs postgres

# Verify database is healthy
docker compose exec postgres pg_isready -U postgres

# Connect to database
docker compose exec postgres psql -U postgres -d blueprints
```

### Worker Not Processing Jobs

```bash
# Check worker logs
docker compose logs worker

# Check Redis connection
docker compose exec redis redis-cli ping

# Restart worker
docker compose restart worker
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Remove old backups
find /home/deploy/backups -name "*.gz" -mtime +30 -delete
```

## Security Checklist

- [x] Firewall configured (UFW)
- [x] Non-root deploy user
- [x] Strong passwords generated
- [x] SSH key authentication
- [x] Automatic HTTPS (Caddy)
- [x] Security headers enabled
- [x] Docker networks segmented
- [x] Object storage private
- [x] Regular backups configured
- [x] Log rotation configured

## Monitoring Recommendations

Consider adding:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Log aggregation**: ELK stack, Grafana Loki
- **Metrics**: Prometheus + Grafana
- **Alerts**: Email/Slack notifications for failures

## Additional Hardening (Optional)

### Fail2ban for SSH Protection

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Unattended Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### Docker Security Scanning

```bash
# Scan images for vulnerabilities
docker scout quickview blueprints-api
```

## Support

For issues, check:
1. Application logs: `docker compose logs`
2. System logs: `journalctl -xe`
3. Caddy logs: `docker compose logs caddy`
4. Health endpoint: `https://your-domain.com/api/health`
