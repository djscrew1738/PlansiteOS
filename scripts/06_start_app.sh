#!/bin/bash
set -euo pipefail

cd /opt/plansiteos
sudo systemctl restart plansiteos.service
