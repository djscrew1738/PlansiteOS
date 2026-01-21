#!/bin/bash
# ============================================================================
# PlansiteOS Kong Gateway Setup Script
# Version: 3.1
# Description: Configure Kong API Gateway via Admin API
# ============================================================================

set -e

KONG_ADMIN_URL="${KONG_ADMIN_URL:-http://localhost:8001}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=============================================="
echo "PlansiteOS Kong Gateway Setup"
echo "=============================================="
echo ""

# Wait for Kong to be ready
echo "Waiting for Kong Admin API..."
max_attempts=30
attempt=0
until curl -sf "${KONG_ADMIN_URL}/status" > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo -e "${RED}Error: Kong is not responding after ${max_attempts} attempts${NC}"
        exit 1
    fi
    echo "  Attempt $attempt/$max_attempts..."
    sleep 2
done
echo -e "${GREEN}✓ Kong is ready${NC}"
echo ""

# =============================================================================
# Helper Functions
# =============================================================================

create_service() {
    local name=$1
    local url=$2
    local read_timeout=${3:-60000}

    echo "Creating service: $name"
    curl -sf -X POST "${KONG_ADMIN_URL}/services" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"url\": \"${url}\",
            \"connect_timeout\": 60000,
            \"write_timeout\": 60000,
            \"read_timeout\": ${read_timeout},
            \"retries\": 3
        }" > /dev/null && echo -e "  ${GREEN}✓ Created${NC}" || echo -e "  ${YELLOW}⚠ Already exists or error${NC}"
}

create_route() {
    local service=$1
    local name=$2
    local paths=$3

    echo "Creating route: $name"
    curl -sf -X POST "${KONG_ADMIN_URL}/services/${service}/routes" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"${name}\",
            \"paths\": ${paths},
            \"strip_path\": false,
            \"preserve_host\": true
        }" > /dev/null && echo -e "  ${GREEN}✓ Created${NC}" || echo -e "  ${YELLOW}⚠ Already exists or error${NC}"
}

enable_plugin() {
    local name=$1
    local config=$2
    local service=${3:-}

    if [ -n "$service" ]; then
        echo "Enabling plugin: $name for $service"
        curl -sf -X POST "${KONG_ADMIN_URL}/services/${service}/plugins" \
            -H "Content-Type: application/json" \
            -d "{\"name\": \"${name}\", \"config\": ${config}}" > /dev/null \
            && echo -e "  ${GREEN}✓ Enabled${NC}" || echo -e "  ${YELLOW}⚠ Already exists or error${NC}"
    else
        echo "Enabling global plugin: $name"
        curl -sf -X POST "${KONG_ADMIN_URL}/plugins" \
            -H "Content-Type: application/json" \
            -d "{\"name\": \"${name}\", \"config\": ${config}}" > /dev/null \
            && echo -e "  ${GREEN}✓ Enabled${NC}" || echo -e "  ${YELLOW}⚠ Already exists or error${NC}"
    fi
}

# =============================================================================
# Create Services
# =============================================================================

echo "Creating services..."
echo "---"

create_service "parsing-service" "http://parsing:8080" 120000
create_service "vision-service" "http://vision:8081" 300000
create_service "estimation-service" "http://estimation:8082" 120000
create_service "rendering-service" "http://rendering:8083" 180000
create_service "assistant-service" "http://assistant:8084" 300000

echo ""

# =============================================================================
# Create Routes
# =============================================================================

echo "Creating routes..."
echo "---"

create_route "parsing-service" "parsing-routes" '[\"/api/v1/parse\", \"/api/v1/blueprints\"]'
create_route "vision-service" "vision-routes" '[\"/api/v1/vision\", \"/api/v1/detect\"]'
create_route "estimation-service" "estimation-routes" '[\"/api/v1/estimate\", \"/api/v1/costs\"]'
create_route "rendering-service" "rendering-routes" '[\"/api/v1/render\", \"/api/v1/outputs\"]'
create_route "assistant-service" "assistant-routes" '[\"/api/v1/chat\", \"/api/v1/assistant\", \"/api/v1/conversations\"]'

echo ""

# =============================================================================
# Enable Global Plugins
# =============================================================================

echo "Enabling global plugins..."
echo "---"

# Prometheus metrics
enable_plugin "prometheus" '{
    "per_consumer": false,
    "status_code_metrics": true,
    "latency_metrics": true,
    "bandwidth_metrics": true,
    "upstream_health_metrics": true
}'

# CORS
enable_plugin "cors" '{
    "origins": ["*"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    "headers": ["Accept", "Authorization", "Content-Type", "X-Correlation-ID", "X-Request-ID"],
    "exposed_headers": ["X-Correlation-ID", "X-Request-ID"],
    "credentials": true,
    "max_age": 3600
}'

# Correlation ID
enable_plugin "correlation-id" '{
    "header_name": "X-Correlation-ID",
    "generator": "uuid#counter",
    "echo_downstream": true
}'

# Request size limiting
enable_plugin "request-size-limiting" '{
    "allowed_payload_size": 100,
    "size_unit": "megabytes"
}'

echo ""

# =============================================================================
# Enable Service-Specific Plugins
# =============================================================================

echo "Enabling service-specific plugins..."
echo "---"

# Rate limiting for parsing
enable_plugin "rate-limiting" '{
    "minute": 60,
    "hour": 1000,
    "policy": "local",
    "fault_tolerant": true
}' "parsing-service"

# Rate limiting for vision (lower due to GPU)
enable_plugin "rate-limiting" '{
    "minute": 20,
    "hour": 200,
    "policy": "local",
    "fault_tolerant": true
}' "vision-service"

# Rate limiting for assistant (LLM constraints)
enable_plugin "rate-limiting" '{
    "minute": 30,
    "hour": 500,
    "policy": "local",
    "fault_tolerant": true
}' "assistant-service"

echo ""

# =============================================================================
# Verify Configuration
# =============================================================================

echo "Verifying configuration..."
echo "---"

echo "Services:"
curl -sf "${KONG_ADMIN_URL}/services" | jq -r '.data[].name' 2>/dev/null | while read name; do
    echo "  - $name"
done

echo ""
echo "Routes:"
curl -sf "${KONG_ADMIN_URL}/routes" | jq -r '.data[].name' 2>/dev/null | while read name; do
    echo "  - $name"
done

echo ""
echo "Plugins:"
curl -sf "${KONG_ADMIN_URL}/plugins" | jq -r '.data[].name' 2>/dev/null | sort -u | while read name; do
    echo "  - $name"
done

echo ""
echo "=============================================="
echo -e "${GREEN}Kong Gateway setup complete!${NC}"
echo "=============================================="
echo ""
echo "API Gateway endpoints:"
echo "  - Parsing:    http://localhost:8000/api/v1/parse"
echo "  - Vision:     http://localhost:8000/api/v1/vision"
echo "  - Estimation: http://localhost:8000/api/v1/estimate"
echo "  - Rendering:  http://localhost:8000/api/v1/render"
echo "  - Assistant:  http://localhost:8000/api/v1/chat"
echo ""
echo "Admin API: ${KONG_ADMIN_URL}"
echo "Metrics:   http://localhost:8001/metrics"
