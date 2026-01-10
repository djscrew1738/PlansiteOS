#!/bin/bash

# Blueprint Analysis Quick Test Script
# Usage: ./test-blueprint.sh [blueprint-file.jpg]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_BASE="${API_BASE:-http://localhost:3000}"
BLUEPRINT_FILE="${1:-test-blueprint.jpg}"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Blueprint Analysis Quick Test${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Check if server is running
echo -e "${YELLOW}Checking if server is running...${NC}"
if curl -s "${API_BASE}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}\n"
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo -e "${BLUE}Start your server with: npm start${NC}\n"
    exit 1
fi

# Check if file exists
if [ ! -f "$BLUEPRINT_FILE" ]; then
    echo -e "${RED}✗ Blueprint file not found: $BLUEPRINT_FILE${NC}"
    echo -e "${BLUE}Please provide a valid blueprint file${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ Blueprint file found: $BLUEPRINT_FILE${NC}"
FILE_SIZE=$(du -h "$BLUEPRINT_FILE" | cut -f1)
echo -e "${BLUE}  File size: $FILE_SIZE${NC}\n"

# Upload blueprint
echo -e "${YELLOW}Uploading blueprint...${NC}"
RESPONSE=$(curl -s -X POST "${API_BASE}/api/blueprints/upload" \
    -F "blueprint=@${BLUEPRINT_FILE}" \
    -F "projectName=Test Project $(date +%Y-%m-%d)" \
    -F "projectAddress=123 Test St, Dallas TX")

# Check if upload succeeded
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Blueprint uploaded successfully${NC}\n"

    # Extract data
    BLUEPRINT_ID=$(echo "$RESPONSE" | jq -r '.blueprint.id')
    TOTAL_FIXTURES=$(echo "$RESPONSE" | jq -r '.analysis.totalFixtures')
    TOTAL_ROOMS=$(echo "$RESPONSE" | jq -r '.analysis.totalRooms')
    ANALYSIS_TIME=$(echo "$RESPONSE" | jq -r '.analysis.analysisTime')
    CORRELATION_ID=$(echo "$RESPONSE" | jq -r '.correlationId')

    # Display results
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Analysis Results${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo -e "${BLUE}Blueprint ID:${NC} $BLUEPRINT_ID"
    echo -e "${BLUE}Correlation ID:${NC} $CORRELATION_ID"
    echo -e "${BLUE}Total Fixtures:${NC} $TOTAL_FIXTURES"
    echo -e "${BLUE}Total Rooms:${NC} $TOTAL_ROOMS"
    echo -e "${BLUE}Analysis Time:${NC} ${ANALYSIS_TIME}ms\n"

    # Display fixture totals
    echo -e "${YELLOW}Fixture Totals:${NC}"
    echo "$RESPONSE" | jq -r '.analysis.fixtureTotals | to_entries[] | "  \(.key): \(.value)"'
    echo ""

    # Display rooms
    echo -e "${YELLOW}Rooms:${NC}"
    echo "$RESPONSE" | jq -r '.analysis.rooms[] | "  \(.name): \(.fixtureCount) fixtures"'
    echo ""

    # Generate annotated blueprint
    echo -e "${YELLOW}Generating annotated blueprint...${NC}"
    ANNOTATE_RESPONSE=$(curl -s -X POST "${API_BASE}/api/blueprints/${BLUEPRINT_ID}/annotate")

    if echo "$ANNOTATE_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Annotated blueprint generated${NC}"
        ANNOTATED_PATH=$(echo "$ANNOTATE_RESPONSE" | jq -r '.annotatedImagePath')
        echo -e "${BLUE}  Output: $ANNOTATED_PATH${NC}\n"

        # Check if file exists
        if [ -f "$ANNOTATED_PATH" ]; then
            echo -e "${GREEN}✓ Annotated file exists on disk${NC}"
            ANNOTATED_SIZE=$(du -h "$ANNOTATED_PATH" | cut -f1)
            echo -e "${BLUE}  Size: $ANNOTATED_SIZE${NC}\n"
        fi
    else
        echo -e "${RED}✗ Failed to generate annotated blueprint${NC}"
        echo "$ANNOTATE_RESPONSE" | jq '.'
    fi

    # Summary
    echo -e "${CYAN}========================================${NC}"
    echo -e "${GREEN}✓ Test Completed Successfully${NC}"
    echo -e "${CYAN}========================================${NC}\n"

    echo -e "${BLUE}Next steps:${NC}"
    echo -e "1. View blueprint: ${API_BASE}/api/blueprints/${BLUEPRINT_ID}"
    echo -e "2. Check annotated file: $ANNOTATED_PATH"
    echo -e "3. View in browser: http://localhost:3000/test-blueprint.html"
    echo ""

else
    echo -e "${RED}✗ Upload failed${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi
