#!/bin/bash
set -euo pipefail

cat <<'SERVICE' | sudo tee /etc/systemd/system/plansiteos.service
[Unit]
Description=PlanSiteOS service
After=network.target

[Service]
Type=simple
User=plansite
WorkingDirectory=/opt/plansiteos
ExecStart=/usr/bin/node /opt/plansiteos/server.js
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable plansiteos.service
