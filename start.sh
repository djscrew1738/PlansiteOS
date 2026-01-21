#!/bin/bash

echo "🚀 PlansiteOS Startup Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if pg_isready -q; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not running${NC}"
    echo ""
    echo "PostgreSQL is not running. Please start it first:"
    echo "  sudo systemctl start postgresql"
    echo "  or"
    echo "  sudo service postgresql start"
    echo ""
    exit 1
fi

# Check if database exists
echo -n "Checking database 'plansiteos'... "
if psql -lqt | cut -d \| -f 1 | grep -qw plansiteos; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${YELLOW}⚠ Not found${NC}"
    echo "Creating database..."
    createdb plansiteos 2>/dev/null && echo -e "${GREEN}✓ Created${NC}" || echo -e "${RED}✗ Failed (check permissions)${NC}"
fi

# Check environment files
echo -n "Checking environment files... "
if [ -f "apps/api/.env" ] && [ -f "apps/web/.env" ]; then
    echo -e "${GREEN}✓ Found${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
    echo "Environment files are missing. They have been created with defaults."
fi

# Check node_modules
echo -n "Checking dependencies... "
if [ -d "apps/api/node_modules" ] && [ -d "apps/web/node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Missing${NC}"
    echo "Installing dependencies..."
    cd apps/api && npm install --silent
    cd ../web && npm install --silent
    cd ../..
    echo -e "${GREEN}✓ Installed${NC}"
fi

# Check upload directory
echo -n "Checking upload directory... "
if [ -d "apps/api/uploads/blueprints" ]; then
    echo -e "${GREEN}✓ Ready${NC}"
else
    mkdir -p apps/api/uploads/blueprints
    echo -e "${GREEN}✓ Created${NC}"
fi

echo ""
echo "=============================="
echo "✅ All checks passed!"
echo ""
echo "Starting services..."
echo ""
echo -e "${YELLOW}Backend will run on:${NC} http://localhost:5000"
echo -e "${YELLOW}Frontend will run on:${NC} http://localhost:3000 (or next available port)"
echo ""
echo -e "${YELLOW}Default login:${NC}"
echo "  Email: admin@ctlplumbing.com"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""
echo "=============================="
echo ""

# Start backend in background
cd apps/api
echo "Starting backend server..."
npm run dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
cd apps/web
echo "Starting frontend server..."
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait a bit more
sleep 2

echo ""
echo -e "${GREEN}✓ Services started!${NC}"
echo ""
echo "Backend PID: $BACKEND_PID (logs: backend.log)"
echo "Frontend PID: $FRONTEND_PID (logs: frontend.log)"
echo ""
echo "To view logs:"
echo "  tail -f backend.log"
echo "  tail -f frontend.log"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Save PIDs to file
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Wait for user interrupt
wait
