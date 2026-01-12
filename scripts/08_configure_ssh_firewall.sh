#!/bin/bash
set -euo pipefail

sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
# Optional: sudo sed -i 's/^#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
sudo ufw allow ssh
