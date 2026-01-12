#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/plansiteos"
mkdir -p "$BACKUP_DIR"

pg_dump -U plansite_user plansite_db | gzip > "$BACKUP_DIR/db_$(date +%F).sql.gz"
