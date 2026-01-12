#!/bin/bash
set -euo pipefail

BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>" && exit 1
fi

gunzip -c "$BACKUP_FILE" | psql -U plansite_user plansite_db
