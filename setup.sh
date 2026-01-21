#!/bin/bash

# PlansiteOS Complete Setup & Launch Script
# Handles PostgreSQL, database creation, migrations, and service startup

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="plansiteos"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"
API_PORT="5000"

# Network Configuration
LOCAL_IP="192.168.1.215"
TAILSCALE_IP="100.109.158.92"
DOMAIN="cbrnholdings.com"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PlansiteOS Complete Setup & Launch   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root - this is okay but not recommended for development"
fi

# Step 1: Check PostgreSQL
print_step "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed!"
    echo "Install with: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi
print_success "PostgreSQL client installed"

# Step 2: Start PostgreSQL if not running
print_step "Starting PostgreSQL service..."
if pg_isready -q 2>/dev/null; then
    print_success "PostgreSQL is already running"
else
    print_warning "PostgreSQL not running, attempting to start..."
    if sudo systemctl start postgresql 2>/dev/null; then
        sleep 2
        print_success "PostgreSQL started via systemctl"
    elif sudo service postgresql start 2>/dev/null; then
        sleep 2
        print_success "PostgreSQL started via service"
    else
        print_error "Failed to start PostgreSQL. Please start it manually."
        exit 1
    fi
fi

# Step 3: Create database if it doesn't exist
print_step "Checking database '$DB_NAME'..."
if psql -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_success "Database '$DB_NAME' exists"
else
    print_warning "Database not found, creating..."
    if createdb -U $DB_USER $DB_NAME 2>/dev/null; then
        print_success "Database '$DB_NAME' created"
    else
        # Try with sudo
        if sudo -u postgres createdb $DB_NAME 2>/dev/null; then
            print_success "Database '$DB_NAME' created (via sudo)"
        else
            print_error "Failed to create database"
            exit 1
        fi
    fi
fi

# Step 4: Check if migrations have been run
print_step "Checking database migrations..."
MIGRATION_CHECK=$(psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'leads', 'blueprints');" 2>/dev/null || echo "0")

if [ "$MIGRATION_CHECK" -eq "3" ]; then
    print_success "All migrations appear to be run"
else
    print_warning "Migrations needed, running now..."

    # Run migrations
    MIGRATIONS=(
        "migrations/add_leads_support.sql"
        "migrations/add_user_authentication.sql"
        "migrations/add_blueprint_analysis.sql"
    )

    for migration in "${MIGRATIONS[@]}"; do
        if [ -f "$migration" ]; then
            migration_name=$(basename "$migration")
            echo -n "  Running $migration_name... "
            if psql -U $DB_USER -d $DB_NAME -f "$migration" > /dev/null 2>&1; then
                echo -e "${GREEN}✓${NC}"
            else
                # Try with sudo
                if sudo -u postgres psql -d $DB_NAME -f "$migration" > /dev/null 2>&1; then
                    echo -e "${GREEN}✓ (via sudo)${NC}"
                else
                    echo -e "${RED}✗ Failed${NC}"
                fi
            fi
        else
            print_warning "Migration file not found: $migration"
        fi
    done
    print_success "Migrations completed"
fi

# Step 5: Create/update backend .env
print_step "Configuring backend environment..."
cat > apps/api/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Server Configuration
PORT=${API_PORT}
HOST=0.0.0.0
NODE_ENV=development

# Network Configuration
LOCAL_IP=${LOCAL_IP}
TAILSCALE_IP=${TAILSCALE_IP}
DOMAIN=${DOMAIN}

# JWT Authentication
JWT_SECRET=dev-secret-change-in-production-min-32-characters-long-string-$(openssl rand -hex 16)
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# File Uploads
UPLOAD_DIR=./uploads/blueprints
MAX_FILE_SIZE_MB=50

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://${LOCAL_IP}:3000,http://${TAILSCALE_IP}:3000,https://${DOMAIN}

# Optional API Keys (uncomment and add your keys)
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE_NUMBER=
# SENDGRID_API_KEY=
# SENDGRID_FROM_EMAIL=notifications@${DOMAIN}
# SENDGRID_FROM_NAME="PlansiteOS Notifications"
# NOTIFICATION_PHONE_NUMBER=
# NOTIFICATION_EMAIL=admin@${DOMAIN}
EOF
print_success "Backend environment configured"

# Step 6: Create/update frontend .env
print_step "Configuring frontend environment..."
cat > apps/web/.env << EOF
# API Configuration
VITE_API_URL=http://${LOCAL_IP}:${API_PORT}

# Alternative endpoints (for reference)
# Local: http://localhost:${API_PORT}
# Tailscale: http://${TAILSCALE_IP}:${API_PORT}
# Domain: https://${DOMAIN}/api
EOF
print_success "Frontend environment configured"

# Step 7: Create upload directories
print_step "Creating upload directories..."
mkdir -p apps/api/uploads/blueprints
chmod -R 755 apps/api/uploads
print_success "Upload directories ready"

# Step 8: Install dependencies
print_step "Checking Node.js dependencies..."

# Backend
if [ ! -d "apps/api/node_modules" ]; then
    print_warning "Backend dependencies missing, installing..."
    cd apps/api
    npm install --silent
    cd ../..
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies found"
fi

# Frontend
if [ ! -d "apps/web/node_modules" ]; then
    print_warning "Frontend dependencies missing, installing..."
    cd apps/web
    npm install --silent
    cd ../..
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies found"
fi

# Step 9: Check for running processes on ports
print_step "Checking port availability..."
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

if ! check_port $API_PORT; then
    print_warning "Port $API_PORT is already in use"
    print_warning "Attempting to kill existing process..."
    sudo lsof -ti:$API_PORT | xargs -r sudo kill -9
    sleep 1
fi

if ! check_port 3000; then
    print_warning "Port 3000 is already in use"
    print_warning "Attempting to kill existing process..."
    sudo lsof -ti:3000 | xargs -r sudo kill -9
    sleep 1
fi

print_success "Ports are available"

# Step 10: Start services
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Starting Services              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Start backend
print_step "Starting backend server..."
cd apps/api
npm run dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../../.backend.pid
cd ../..
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    print_success "Backend started (PID: $BACKEND_PID)"
else
    print_error "Backend failed to start. Check backend.log for details"
    tail -20 backend.log
    exit 1
fi

# Start frontend
print_step "Starting frontend server..."
cd apps/web
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../../.frontend.pid
cd ../..
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend started (PID: $FRONTEND_PID)"
else
    print_error "Frontend failed to start. Check frontend.log for details"
    tail -20 frontend.log
    exit 1
fi

# Display success information
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     PlansiteOS Successfully Started!  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo -e "  Local:     ${BLUE}http://localhost:3000${NC}"
echo -e "  Network:   ${BLUE}http://${LOCAL_IP}:3000${NC}"
echo -e "  Tailscale: ${BLUE}http://${TAILSCALE_IP}:3000${NC}"
echo ""
echo -e "${YELLOW}API Endpoints:${NC}"
echo -e "  Local:     ${BLUE}http://localhost:${API_PORT}/api/v1${NC}"
echo -e "  Network:   ${BLUE}http://${LOCAL_IP}:${API_PORT}/api/v1${NC}"
echo -e "  Tailscale: ${BLUE}http://${TAILSCALE_IP}:${API_PORT}/api/v1${NC}"
echo ""
echo -e "${YELLOW}Default Login:${NC}"
echo -e "  Email:    ${BLUE}admin@ctlplumbing.com${NC}"
echo -e "  Password: ${BLUE}admin123${NC}"
echo -e "  ${RED}⚠ Change this password after first login!${NC}"
echo ""
echo -e "${YELLOW}Service Management:${NC}"
echo -e "  View logs:  ${BLUE}tail -f backend.log${NC} or ${BLUE}tail -f frontend.log${NC}"
echo -e "  Stop all:   ${BLUE}./stop.sh${NC}"
echo -e "  Restart:    ${BLUE}./stop.sh && ./setup.sh${NC}"
echo ""
echo -e "${YELLOW}Process IDs:${NC}"
echo -e "  Backend:  ${BLUE}$BACKEND_PID${NC}"
echo -e "  Frontend: ${BLUE}$FRONTEND_PID${NC}"
echo ""
echo -e "${GREEN}Press Ctrl+C to view logs in real-time...${NC}"
echo ""

# Follow logs
trap "echo ''; echo 'Logs stopped. Services still running in background.'; echo 'Run ./stop.sh to stop services.'; exit 0" INT

tail -f backend.log -f frontend.log
