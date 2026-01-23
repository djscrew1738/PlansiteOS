#!/bin/sh
set -e

# Ensure upload volume is writable by nodejs
mkdir -p /app/uploads /app/uploads/blueprints
chown -R nodejs:nodejs /app/uploads

exec su-exec nodejs "$@"
