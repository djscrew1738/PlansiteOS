#!/bin/bash
set -euo pipefail

cd /opt/plansiteos

if [ -d docs/source ]; then
    sphinx-build -b html docs/source docs/build/html
else
    echo "docs/source not found; skipping"
fi
