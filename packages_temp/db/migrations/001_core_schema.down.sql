-- 001_core_schema.down.sql
-- Rollback for core schema objects.

DROP FUNCTION IF EXISTS get_request_trace(VARCHAR);
DROP FUNCTION IF EXISTS get_activity_by_correlation_id(VARCHAR);
DROP FUNCTION IF EXISTS get_fixtures_by_room(INTEGER);
DROP FUNCTION IF EXISTS get_fixture_counts(INTEGER);
DROP FUNCTION IF EXISTS get_total_fixture_count(INTEGER);

DROP TABLE IF EXISTS request_log;
DROP TABLE IF EXISTS transaction_log;
DROP TABLE IF EXISTS lead_activity;
DROP TABLE IF EXISTS notification_queue;
DROP TABLE IF EXISTS blueprint_analysis_log;
DROP TABLE IF EXISTS blueprint_fixtures;
DROP TABLE IF EXISTS blueprint_rooms;
DROP TABLE IF EXISTS fixture_types_reference;
DROP TABLE IF EXISTS blueprints;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS projects;

DROP FUNCTION IF EXISTS update_updated_at_column();
