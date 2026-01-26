#!/bin/bash

# Test System Status Locally
# This script tests all status endpoints

set -e

API_URL="${API_URL:-http://localhost:8090}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Testing PlansiteOS System Status"
echo "  API: $API_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
  local endpoint=$1
  local name=$2

  echo -n "Testing $name... "

  response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint" 2>&1)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ] || [ "$http_code" = "503" ]; then
    echo -e "${GREEN}✓${NC} ($http_code)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗${NC} ($http_code)"
    echo "$body"
  fi

  echo ""
}

# Test health check
test_endpoint "/api/health" "Health Check"

# Test full status
test_endpoint "/api/status" "Full System Status"

# Test quick status (cached)
test_endpoint "/api/status/quick" "Quick Status"

# Test individual services
test_endpoint "/api/status/database" "Database Status"
test_endpoint "/api/status/ai" "AI Service Status"
test_endpoint "/api/status/blueprints" "Blueprints Engine Status"

# Test Prometheus metrics
echo -n "Testing Prometheus Metrics... "
response=$(curl -s -w "\n%{http_code}" "$API_URL/api/status/metrics" 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
  echo -e "${GREEN}✓${NC} ($http_code)"
  echo "$body" | head -20
  echo "... (truncated)"
else
  echo -e "${RED}✗${NC} ($http_code)"
  echo "$body"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Testing Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
