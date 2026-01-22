# PlansiteOS Remote Access Guide

This guide covers all methods to access PlansiteOS remotely from any device.

## Quick Start

| Method | URL | Best For |
|--------|-----|----------|
| **Tailscale VPN** | `http://100.109.158.92:5000` | Secure access from anywhere |
| **Public Domain** | `https://ctlplumbingllc.com` | Customers & public access |
| **Local Network** | `http://[server-ip]:5000` | Same WiFi network |

---

## Method 1: Tailscale VPN (Recommended)

Tailscale provides secure, encrypted access without exposing ports to the internet.

### Setup on Your Phone/Tablet

1. **Install Tailscale app**
   - iOS: [App Store](https://apps.apple.com/app/tailscale/id1470499037)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=com.tailscale.ipn)

2. **Sign in** with the same account as your server

3. **Access PlansiteOS**
   ```
   http://100.109.158.92:5000
   ```

4. **Add to Home Screen** (PWA)
   - iOS: Safari > Share > Add to Home Screen
   - Android: Chrome > Menu > Add to Home Screen

### Benefits
- No public IP required
- Works through firewalls
- End-to-end encrypted
- No port forwarding needed

---

## Method 2: Public Domain Access

For customer access or when Tailscale isn't available.

### Prerequisites

1. **Domain name** pointing to your server's public IP
2. **Router port forwarding** (ports 80 and 443 to server)
3. **Static IP or Dynamic DNS**

### DNS Configuration

Add these records to your domain:

```
Type    Name    Value
A       @       YOUR_PUBLIC_IP
A       www     YOUR_PUBLIC_IP
```

### Server Setup

1. **Configure environment**
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```

2. **Set your domain**
   ```env
   DOMAIN=ctlplumbingllc.com
   ADMIN_EMAIL=admin@ctlplumbingllc.com
   CORS_ORIGIN=https://ctlplumbingllc.com,https://www.ctlplumbingllc.com
   VITE_API_BASE=https://ctlplumbingllc.com
   ```

3. **Deploy with production config**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

4. **Access via HTTPS**
   ```
   https://ctlplumbingllc.com
   ```

### Router Port Forwarding

Forward these ports to your server's local IP:

| External Port | Internal Port | Protocol |
|--------------|---------------|----------|
| 80           | 80            | TCP      |
| 443          | 443           | TCP      |

### SSL Certificates

Caddy automatically obtains and renews Let's Encrypt SSL certificates.

---

## Method 3: Local Network Access

Access from devices on the same WiFi/LAN.

1. **Find server's local IP**
   ```bash
   ip addr show | grep "inet "
   ```

2. **Access from any device on the network**
   ```
   http://192.168.x.x:5000
   ```

---

## Mobile PWA Installation

PlansiteOS is a Progressive Web App (PWA) that can be installed on mobile devices.

### iOS (Safari)

1. Open PlansiteOS in Safari
2. Tap the **Share** button
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

### Android (Chrome)

1. Open PlansiteOS in Chrome
2. Tap the **three-dot menu**
3. Tap **Add to Home Screen** or **Install App**
4. Tap **Add**

### PWA Features

- **Works offline** - View cached blueprints without internet
- **Push notifications** - Get alerts when analysis completes
- **Camera access** - Snap photos of blueprints directly
- **Share target** - Share images directly to PlansiteOS
- **Background sync** - Uploads continue even when offline

---

## Cloud Deployment Options

### Option A: DigitalOcean Droplet

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - 2GB RAM minimum
   - 50GB SSD

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

3. **Clone and deploy**
   ```bash
   git clone https://github.com/your-repo/PlansiteOS.git
   cd PlansiteOS
   cp .env.production.example .env.production
   # Edit .env.production with your values
   docker compose -f docker-compose.prod.yml up -d
   ```

### Option B: AWS EC2

1. **Launch EC2 instance**
   - Amazon Linux 2 or Ubuntu
   - t3.small or larger
   - Security group: allow 80, 443

2. **Install and deploy**
   ```bash
   # Install Docker
   sudo yum install docker -y
   sudo service docker start

   # Install docker-compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Deploy
   git clone https://github.com/your-repo/PlansiteOS.git
   cd PlansiteOS
   cp .env.production.example .env.production
   docker compose -f docker-compose.prod.yml up -d
   ```

### Option C: Railway/Render (Managed)

For simpler deployment without server management:

1. Connect your GitHub repository
2. Set environment variables from `.env.production.example`
3. Deploy

---

## Troubleshooting

### Can't connect remotely

1. **Check server is running**
   ```bash
   docker compose ps
   curl http://localhost:5000/api/health
   ```

2. **Check firewall**
   ```bash
   sudo ufw status
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **Check Tailscale status**
   ```bash
   tailscale status
   ```

### SSL certificate errors

1. **Check Caddy logs**
   ```bash
   docker compose logs caddy
   ```

2. **Verify DNS propagation**
   ```bash
   dig +short ctlplumbingllc.com
   ```

### PWA not installing

1. Ensure you're using HTTPS
2. Clear browser cache
3. Check manifest.json is accessible: `https://your-domain/manifest.json`

### Slow upload on mobile

1. Reduce image size before upload
2. Use WiFi instead of cellular
3. Check server resources: `docker stats`

---

## Security Recommendations

1. **Use strong passwords** in `.env.production`
2. **Keep Docker updated**: `sudo apt update && sudo apt upgrade`
3. **Enable automatic security updates**
4. **Use Tailscale** for admin access instead of public ports
5. **Regular backups**: `docker compose exec postgres pg_dump -U plansite plansite > backup.sql`

---

## Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Caddy proxy health |
| `/api/health` | API server health |

Monitor with:
```bash
curl -s https://ctlplumbingllc.com/api/health | jq
```
