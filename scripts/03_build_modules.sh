#!/bin/bash
set -euo pipefail

cd /opt/plansiteos

if [ -f Makefile ]; then
    make all
fi

if [ -f frontend/package.json ]; then
    cd frontend
    npm install
    npm run build
fi
