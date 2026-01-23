#!/bin/bash

# PlansiteOS Production Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PlansiteOS Production Deployment"
echo "  app.ctlplumbingllc.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo "❌ Please do not run as root (use your regular user account)"
  exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed"
  echo "Install with: curl -fsSL https://get.docker.com | sh"
  exit 1
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
  echo "❌ Docker Compose is not installed"
  echo "Install with: sudo apt install docker-compose-plugin"
  exit 1
fi

# Check for .env.production
if [ ! -f .env.production ]; then
  echo "⚠️  .env.production not found"
  echo ""
  read -p "Create from template? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.production.example .env.production
    echo "✓ Created .env.production"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.production and set:"
    echo "   - POSTGRES_PASSWORD"
    echo "   - ANTHROPIC_API_KEY"
    echo ""
    read -p "Press Enter when ready to continue..."
  else
    exit 1
  fi
fi

# Load environment variables (without exporting to avoid security issues)
if [ -f .env.production ]; then
  source .env.production
fi

# Check required variables
MISSING_VARS=()

if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your-secure-database-password-here" ]; then
  MISSING_VARS+=("POSTGRES_PASSWORD")
fi

if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-your-api-key-here" ]; then
  MISSING_VARS+=("ANTHROPIC_API_KEY")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Missing or invalid environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   - $var"
  done
  echo ""
  echo "Edit .env.production and set these variables"
  exit 1
fi

echo "✓ Environment variables configured"
echo ""

# Check if Caddyfile.production exists
if [ ! -f Caddyfile.production ]; then
  echo "❌ Caddyfile.production not found"
  exit 1
fi

echo "Step 1: Building Docker images..."
docker compose -f docker-compose.production.yml build

echo ""
echo "Step 2: Starting services..."
docker compose -f docker-compose.production.yml up -d

echo ""
echo "Step 3: Waiting for services to be healthy..."
sleep 10

# Check service health
SERVICES=("plansite-postgres" "plansite-redis" "plansite-api")
ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
  if docker ps --filter "name=$service" --filter "health=healthy" | grep -q "$service"; then
    echo "✓ $service is healthy"
  else
    echo "⚠️  $service is not healthy yet (may still be starting)"
    ALL_HEALTHY=false
  fi
done

echo ""
if [ "$ALL_HEALTHY" = false ]; then
  echo "⚠️  Some services are not healthy yet"
  echo "   This is normal on first startup"
  echo "   Check status with: docker compose -f docker-compose.production.yml ps"
  echo ""
fi

echo "Step 4: Testing local API..."
sleep 5

if curl -f http://localhost:5000/health &> /dev/null; then
  echo "✓ API is responding"
else
  echo "⚠️  API not responding yet (may still be initializing)"
  echo "   Check logs with: docker compose -f docker-compose.production.yml logs api"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Services running:"
docker compose -f docker-compose.production.yml ps
echo ""
echo "Next steps:"
echo ""
echo "1. Configure DNS:"
echo "   Add A record: app.ctlplumbingllc.com → $(curl -s ifconfig.me)"
echo ""
echo "2. Wait for DNS propagation (5-30 minutes)"
echo ""
echo "3. Test access:"
echo "   https://app.ctlplumbingllc.com/health"
echo ""
echo "4. View logs:"
echo "   docker compose -f docker-compose.production.yml logs -f"
echo ""
echo "5. Set up auto-start:"
echo "   sudo cp plansite.service /etc/systemd/system/"
echo "   sudo systemctl enable plansite"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ Deployment complete!"
echo ""
echo "Documentation: docs/PRODUCTION_DEPLOYMENT.md"
echo ""
