-- 002_bids_schema.down.sql
-- Rollback for bid workflow tables and functions.

DROP FUNCTION IF EXISTS update_bid_totals(INTEGER);
DROP FUNCTION IF EXISTS calculate_bid_totals(INTEGER);
DROP FUNCTION IF EXISTS generate_bid_number();

DROP TABLE IF EXISTS bid_activity_log;
DROP TABLE IF EXISTS bid_line_items;
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS labor_rates;
DROP TABLE IF EXISTS fixture_pricing;
