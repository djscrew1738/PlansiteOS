#!/bin/bash
set -euo pipefail

cd /opt/plansiteos
VERSION=$(git describe --tags --always)
OUTPUT_DIR="/opt/packages"
mkdir -p "$OUTPUT_DIR"

if [ -d frontend/dist ]; then
    tar czf "$OUTPUT_DIR/plansiteos-$VERSION.tar.gz" frontend/dist
else
    tar czf "$OUTPUT_DIR/plansiteos-$VERSION.tar.gz" .
fi
