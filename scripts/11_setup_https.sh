#!/bin/bash
set -euo pipefail

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx --non-interactive --agree-tos -m you@example.com -d plansite.example.com
sudo certbot renew --dry-run
