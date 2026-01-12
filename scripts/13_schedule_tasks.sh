#!/bin/bash
set -euo pipefail

(crontab -l 2>/dev/null; echo "0 2 * * * /opt/plansiteos/scripts/14_backup_database.sh") | crontab -
