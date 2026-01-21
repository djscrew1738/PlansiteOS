#!/bin/bash
# ============================================================================
# PlansiteOS Database Migration Runner
# ============================================================================

set -e

# Configuration
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-plansiteos}"
DB_USER="${POSTGRES_USER:-plansiteos}"
DB_PASSWORD="${POSTGRES_PASSWORD:-plansiteos}"

MIGRATIONS_DIR="$(dirname "$0")/migrations"
MIGRATIONS_TABLE="schema_migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "PlansiteOS Database Migration Runner"
echo "=============================================="
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed${NC}"
    exit 1
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Test connection
echo "Testing database connection..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    exit 1
fi
echo -e "${GREEN}✓ Connected to database${NC}"
echo ""

# Create migrations tracking table if not exists
echo "Setting up migrations tracking..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q <<EOF
CREATE TABLE IF NOT EXISTS $MIGRATIONS_TABLE (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64)
);
EOF
echo -e "${GREEN}✓ Migrations table ready${NC}"
echo ""

# Get list of applied migrations
get_applied_migrations() {
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
        "SELECT filename FROM $MIGRATIONS_TABLE ORDER BY filename;"
}

# Check if migration is already applied
is_migration_applied() {
    local filename=$1
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c \
        "SELECT COUNT(*) FROM $MIGRATIONS_TABLE WHERE filename = '$filename';" | grep -q '^1$'
}

# Apply a migration
apply_migration() {
    local filepath=$1
    local filename=$(basename "$filepath")
    local checksum=$(sha256sum "$filepath" | cut -d' ' -f1)

    echo "  Applying: $filename"

    # Run the migration
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$filepath" > /dev/null 2>&1; then
        # Record the migration
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -q -c \
            "INSERT INTO $MIGRATIONS_TABLE (filename, checksum) VALUES ('$filename', '$checksum');"
        echo -e "    ${GREEN}✓ Applied successfully${NC}"
        return 0
    else
        echo -e "    ${RED}✗ Failed to apply${NC}"
        return 1
    fi
}

# Get pending migrations
get_pending_migrations() {
    local pending=()
    for migration in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration" ]; then
            local filename=$(basename "$migration")
            if ! is_migration_applied "$filename"; then
                pending+=("$migration")
            fi
        fi
    done
    printf '%s\n' "${pending[@]}"
}

# Main logic
echo "Checking for pending migrations..."
echo ""

PENDING=$(get_pending_migrations)

if [ -z "$PENDING" ]; then
    echo -e "${GREEN}✓ All migrations are up to date${NC}"
else
    echo "Pending migrations:"
    echo "$PENDING" | while read -r migration; do
        echo "  - $(basename "$migration")"
    done
    echo ""

    # Apply pending migrations in order
    FAILED=0
    echo "Applying migrations..."
    echo "$PENDING" | sort | while read -r migration; do
        if [ -f "$migration" ]; then
            if ! apply_migration "$migration"; then
                FAILED=1
                break
            fi
        fi
    done

    if [ $FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ All migrations applied successfully${NC}"
    else
        echo ""
        echo -e "${RED}✗ Migration failed${NC}"
        exit 1
    fi
fi

# Show current migration status
echo ""
echo "Migration Status:"
echo "=============================================="
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
    "SELECT filename, applied_at FROM $MIGRATIONS_TABLE ORDER BY filename;"

echo ""
echo -e "${GREEN}Done!${NC}"
