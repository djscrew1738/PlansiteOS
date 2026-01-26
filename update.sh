#!/bin/bash

# PlansiteOS Update Script
# Quick update deployment for production server

set -e  # Exit on error

BRANCH="${1:-claude/code-review-UtED5}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PlansiteOS Update Script"
echo "  Branch: $BRANCH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.production.yml" ]; then
  echo "❌ Error: docker-compose.production.yml not found"
  echo "   Are you in the PlansiteOS directory?"
  exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
  echo "❌ Docker is not running"
  exit 1
fi

# Show current version
echo "📌 Current version:"
git log -1 --oneline
echo ""

# Backup database (optional but recommended)
read -p "Create database backup before update? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📦 Creating database backup..."
  mkdir -p ~/backups
  BACKUP_FILE=~/backups/plansite_$(date +%Y%m%d_%H%M%S).sql

  if docker exec plansite-postgres pg_dump -U plansite plansite > $BACKUP_FILE 2>/dev/null; then
    echo "✓ Backup created: $BACKUP_FILE"
    ls -lh $BACKUP_FILE
  else
    echo "⚠️  Backup failed (database might not be running yet)"
  fi
  echo ""
fi

# Pull latest changes
echo "📥 Pulling latest changes from $BRANCH..."
git fetch origin

# Show what will be updated
CURRENT_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$BRANCH)

if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
  echo "✓ Already up to date"
  read -p "Rebuild anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi
else
  echo "New commits available:"
  git log --oneline $CURRENT_COMMIT..$REMOTE_COMMIT
  echo ""
fi

# Pull changes
git pull origin $BRANCH
echo "✓ Code updated"
echo ""

# Check for new environment variables
if [ -f ".env.production.example" ]; then
  echo "📋 Checking for new environment variables..."

  if [ -f ".env.production" ]; then
    # Compare env files (simple check)
    NEW_VARS=$(comm -13 <(grep -v '^#' .env.production | cut -d= -f1 | sort) <(grep -v '^#' .env.production.example | cut -d= -f1 | sort))

    if [ -n "$NEW_VARS" ]; then
      echo "⚠️  New environment variables detected:"
      echo "$NEW_VARS"
      echo ""
      echo "Please review .env.production.example and update .env.production"
      read -p "Continue anyway? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. Update .env.production and run again."
        exit 1
      fi
    else
      echo "✓ No new environment variables"
    fi
  else
    echo "⚠️  .env.production not found - you'll need to create it"
  fi
  echo ""
fi

# Rebuild Docker images
echo "🔨 Rebuilding Docker images..."
docker compose -f docker-compose.production.yml build
echo "✓ Images rebuilt"
echo ""

# Restart services
echo "🔄 Restarting services..."
docker compose -f docker-compose.production.yml up -d
echo "✓ Services restarted"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo "🏥 Checking health..."
for i in {1..6}; do
  if curl -f -s http://localhost:8090/api/health > /dev/null 2>&1; then
    echo "✓ Health check passed!"
    break
  else
    if [ $i -eq 6 ]; then
      echo "❌ Health check failed after 30 seconds"
      echo ""
      echo "Check logs with:"
      echo "  docker compose -f docker-compose.production.yml logs -f api"
      exit 1
    fi
    echo "   Attempt $i/6 failed, waiting..."
    sleep 5
  fi
done
echo ""

# Show status
echo "📊 Container Status:"
docker compose -f docker-compose.production.yml ps
echo ""

# Show updated version
echo "📌 Updated to version:"
git log -1 --oneline
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Update Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  • Monitor logs: docker compose -f docker-compose.production.yml logs -f"
echo "  • Test app: https://app.ctlplumbingllc.com"
echo "  • Check status: curl http://localhost:8090/api/status"
echo ""
