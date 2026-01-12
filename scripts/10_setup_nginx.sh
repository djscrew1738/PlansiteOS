#!/bin/bash
set -euo pipefail

sudo apt install -y nginx
cat <<'EOL' | sudo tee /etc/nginx/sites-available/plansiteos
server {
    listen 80;
    server_name plansite.example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOL
sudo ln -sf /etc/nginx/sites-available/plansiteos /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
