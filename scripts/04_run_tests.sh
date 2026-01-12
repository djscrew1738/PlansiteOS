#!/bin/bash
set -euo pipefail

cd /opt/plansiteos

if [ -d backend ]; then
    cd backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    pytest --verbose 2>&1 | tee /var/log/plansiteos/test.log
else
    echo "backend/ not found; skipping tests"
fi
