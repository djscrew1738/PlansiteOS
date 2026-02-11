# Archived Migration Files

These files are **DEPRECATED** and no longer used by the migration system.

The ordered migration system (added in PR #10) only executes files matching:
- `NNN_name.up.sql`
- `NNN_name.down.sql`

## Why These Are Archived

These were standalone SQL files created before the ordered migration system:
- `simple_blueprint_setup.sql` - Original schema (superseded by 001_core_schema)
- `add_bids_support.sql` - Bids tables (superseded by 002_bids_schema)
- `add_blueprint_analysis.sql` - Analysis columns (superseded by 001_core_schema)
- `add_transaction_support.sql` - Transaction tables (superseded by 001_core_schema)

## Current Migration System

Use the ordered migrations instead:
- `001_core_schema.up.sql` - Core tables (projects, leads, blueprints, etc.)
- `002_bids_schema.up.sql` - Bid/pricing workflow tables

Run migrations with:
```bash
npm run migrate:latest
```

See `packages_temp/db/README.md` for full documentation.
