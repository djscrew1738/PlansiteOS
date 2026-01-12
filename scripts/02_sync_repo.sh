#!/bin/bash
set -euo pipefail

REPO_URL="https://github.com/your-org/plansiteos.git"
TARGET_DIR="/opt/plansiteos"

if [ -d "$TARGET_DIR/.git" ]; then
    cd "$TARGET_DIR"
    git pull
else
    git clone "$REPO_URL" "$TARGET_DIR"
fi
