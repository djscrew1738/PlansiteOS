# PipelineOS Remote Access Configuration

## ✅ Remote Access Configured Successfully!

Your PipelineOS server is now accessible from:

### 1. **Local Network**
```
http://localhost:5000
```

### 2. **Tailscale Network** ⭐
```
http://100.109.158.92:5000
```
- Accessible from any device on your Tailscale network
- Secure, encrypted connection
- No firewall configuration needed

### 3. **Domain** (Requires DNS/Reverse Proxy)
```
https://ctlplumbingllc.com
```
- Requires DNS A record pointing to your server
- Requires reverse proxy (nginx/Caddy) for HTTPS
- See "Domain Setup" section below

---

## 🧪 Testing Remote Access

### Quick Health Check
```bash
# From any Tailscale device:
curl http://100.109.158.92:5000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-07T...",
  "services": {
    "database": { "healthy": true },
    "ai": { "initialized": true },
    "blueprints": { "initialized": true }
  }
}
```

### Blueprint Upload Test
```bash
# Upload a blueprint from remote device
curl -X POST http://100.109.158.92:5000/api/blueprints/upload \
  -F "blueprint=@blueprint.jpg" \
  -F "projectName=Remote Test Project"
```

---

## 🌐 API Endpoints Available

All endpoints are accessible via your Tailscale IP:

### Blueprint Analysis
- **POST** `http://100.109.158.92:5000/api/blueprints/upload`
  - Upload and analyze blueprints
  - Returns fixture counts, measurements, room breakdown

- **GET** `http://100.109.158.92:5000/api/blueprints/:id`
  - Get blueprint details

- **GET** `http://100.109.158.92:5000/api/blueprints`
  - List all blueprints

- **GET** `http://100.109.158.92:5000/api/blueprints/:id/summary`
  - Get fixture summary by type and room

- **POST** `http://100.109.158.92:5000/api/blueprints/:id/annotate`
  - Generate annotated blueprint with dimension lines

- **DELETE** `http://100.109.158.92:5000/api/blueprints/:id`
  - Delete blueprint

### Health & Status
- **GET** `http://100.109.158.92:5000/api/health`
  - System health check

---

## 📱 Mobile/Remote Access

### From Phone/Tablet (on Tailscale)

1. **Install Tailscale** on your mobile device
2. **Connect to Tailscale** network
3. **Open browser** and navigate to:
   ```
   http://100.109.158.92:5000/test-blueprint.html
   ```
4. **Upload blueprints** directly from your phone!

### From Remote Computer (on Tailscale)

```bash
# Set environment variable for convenience
export API_BASE=http://100.109.158.92:5000

# Run tests from any Tailscale device
node test-blueprint-analysis.js
```

---

## 🔒 CORS Configuration

The server is configured to accept requests from:
- ✅ localhost (development)
- ✅ Tailscale IP (100.109.158.92)
- ✅ ctlplumbingllc.com
- ✅ www.ctlplumbingllc.com

To add more allowed origins, edit `.env`:
```bash
# Add custom allowed origins (comma-separated)
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

---

## 🌍 Setting Up Domain Access (Optional)

To access your server at `https://ctlplumbingllc.com`:

### Option 1: Caddy (Easiest - Auto HTTPS)

```bash
# Install Caddy
sudo apt install caddy

# Create Caddyfile
cat > Caddyfile <<EOF
ctlplumbingllc.com {
    reverse_proxy localhost:5000
}
EOF

# Start Caddy
sudo caddy start
```

Caddy automatically:
- Gets SSL certificate from Let's Encrypt
- Handles HTTPS redirects
- Manages certificate renewal

### Option 2: Nginx with Certbot

```bash
# Install nginx and certbot
sudo apt install nginx certbot python3-certbot-nginx

# Create nginx config
sudo tee /etc/nginx/sites-available/pipelineos <<EOF
server {
    server_name ctlplumbingllc.com www.ctlplumbingllc.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/pipelineos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d ctlplumbingllc.com -d www.ctlplumbingllc.com
```

### DNS Configuration Required

For domain access to work, you need:

1. **A Record** pointing to your server's public IP:
   ```
   Type: A
   Name: @
   Value: YOUR_PUBLIC_IP
   TTL: 300
   ```

2. **WWW Subdomain** (optional):
   ```
   Type: CNAME
   Name: www
   Value: ctlplumbingllc.com
   TTL: 300
   ```

**Note:** If using Tailscale, you might prefer Tailscale's built-in HTTPS (MagicDNS + HTTPS certificates).

---

## 🔧 Server Configuration

Current settings in `.env`:
```bash
# Server listens on all interfaces
HOST=0.0.0.0
PORT=5000

# Network info
TAILSCALE_IP=100.109.158.92
DOMAIN=ctlplumbingllc.com
DOMAIN_URL=https://ctlplumbingllc.com

# Database (local Docker container)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pipelineos

# AI Service (required for blueprint analysis)
ANTHROPIC_API_KEY=your-api-key-here
```

---

## 📊 Monitoring & Logs

### View Server Logs
```bash
# Real-time logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# Grep for specific blueprint
grep "blueprint-123" logs/combined.log
```

### Check Server Status
```bash
# From Tailscale network
curl http://100.109.158.92:5000/api/health | jq .

# Check if server is running
ps aux | grep "node src/app.js"

# Check port
ss -tlnp | grep :5000
```

---

## 🚀 Production Deployment

For production use, consider:

### 1. Use PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start server with PM2
pm2 start src/app.js --name pipelineos

# Auto-restart on server reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### 2. Set Up Firewall
```bash
# Allow only Tailscale and your reverse proxy
sudo ufw allow from 100.64.0.0/10 to any port 5000
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3. Enable HTTPS
- Use Caddy or nginx with Let's Encrypt
- Or use Tailscale's built-in HTTPS

### 4. Set Production Environment
```bash
# In .env
NODE_ENV=production
LOG_LEVEL=warn

# Restart server
pm2 restart pipelineos
```

---

## 🎯 Next Steps

Your server is now accessible remotely!

**To complete blueprint analysis setup:**

1. **Get Anthropic API key** from https://console.anthropic.com/
2. **Update .env** with your actual API key:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-actual-key
   ```
3. **Restart server**:
   ```bash
   pm2 restart pipelineos
   # or
   npm start
   ```
4. **Test blueprint upload** from remote device

---

## 📞 Troubleshooting

### Can't access via Tailscale IP

1. **Check Tailscale is running**:
   ```bash
   tailscale status
   ```

2. **Verify server is listening on 0.0.0.0**:
   ```bash
   ss -tlnp | grep :5000
   # Should show: 0.0.0.0:5000
   ```

3. **Test from server itself**:
   ```bash
   curl http://100.109.158.92:5000/api/health
   ```

### CORS errors in browser

Update allowed origins in `src/app.js`:
```javascript
const allowedOrigins = [
  'https://your-frontend-domain.com',
  // ... add more
];
```

### Can't access via domain

1. **Check DNS** is pointing to your server
2. **Verify reverse proxy** is running
3. **Check firewall** allows ports 80/443

---

**Your server is ready!** 🎉

Access it at: **http://100.109.158.92:5000**
