-- ============================================================================
-- PlansiteOS Database Schema v3.1
-- Migration: 003_materialized_views.sql
-- Description: Materialized views and reporting tables for analytics
-- ============================================================================

BEGIN;

-- ============================================================================
-- Materialized View: Project Statistics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_project_statistics AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.status AS project_status,
    p.created_at AS project_created_at,

    -- Blueprint stats
    COUNT(DISTINCT b.id) AS blueprint_count,
    COALESCE(SUM(b.total_pages_processed), 0) AS total_pages,
    COALESCE(SUM(b.total_fixtures), 0) AS total_fixtures,
    COALESCE(SUM(b.total_rooms), 0) AS total_rooms,

    -- Processing stats
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS blueprints_completed,
    COUNT(DISTINCT CASE WHEN b.status = 'failed' THEN b.id END) AS blueprints_failed,

    -- Estimate stats
    COUNT(DISTINCT ce.id) AS estimate_count,
    COALESCE(MAX(ce.total_cost), 0) AS latest_estimate_total,
    COALESCE(MAX(ce.final_price), 0) AS latest_estimate_price,

    -- Conversation stats
    COUNT(DISTINCT c.id) AS conversation_count,
    COALESCE(SUM(c.message_count), 0) AS total_messages,

    -- Rendering stats
    COUNT(DISTINCT ro.id) AS rendered_outputs_count

FROM projects p
LEFT JOIN blueprints b ON b.project_id = p.id
LEFT JOIN cost_estimates ce ON ce.project_id = p.id
LEFT JOIN conversations c ON c.project_id = p.id
LEFT JOIN rendered_outputs ro ON ro.blueprint_id = b.id
GROUP BY p.id, p.name, p.status, p.created_at;

CREATE UNIQUE INDEX idx_mv_project_statistics_project_id
ON mv_project_statistics(project_id);

COMMENT ON MATERIALIZED VIEW mv_project_statistics IS 'Aggregated statistics per project';

-- ============================================================================
-- Materialized View: Fixture Type Statistics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_fixture_type_statistics AS
SELECT
    f.fixture_type,
    ft.display_name,
    ft.category,

    -- Counts
    COUNT(*) AS total_detections,
    COUNT(DISTINCT f.blueprint_id) AS blueprints_containing,
    COUNT(DISTINCT b.project_id) AS projects_containing,

    -- Confidence stats
    ROUND(AVG(f.confidence_score), 4) AS avg_confidence,
    ROUND(MIN(f.confidence_score), 4) AS min_confidence,
    ROUND(MAX(f.confidence_score), 4) AS max_confidence,

    -- Cost stats
    ROUND(AVG(f.estimated_unit_cost), 2) AS avg_unit_cost,
    ROUND(SUM(f.estimated_unit_cost * f.quantity), 2) AS total_estimated_cost,

    -- Dimension stats
    ROUND(AVG(f.width), 2) AS avg_width,
    ROUND(AVG(f.depth), 2) AS avg_depth,
    ROUND(AVG(f.height), 2) AS avg_height

FROM fixtures f
LEFT JOIN fixture_types ft ON ft.type_code = f.fixture_type
LEFT JOIN blueprints b ON b.id = f.blueprint_id
GROUP BY f.fixture_type, ft.display_name, ft.category;

CREATE UNIQUE INDEX idx_mv_fixture_type_statistics_type
ON mv_fixture_type_statistics(fixture_type);

COMMENT ON MATERIALIZED VIEW mv_fixture_type_statistics IS 'Aggregated statistics per fixture type';

-- ============================================================================
-- Materialized View: Daily Processing Metrics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_processing_metrics AS
SELECT
    DATE(created_at) AS date,

    -- Blueprint processing
    COUNT(DISTINCT CASE WHEN source_type = 'blueprints' THEN source_id END) AS blueprints_uploaded,
    COUNT(DISTINCT CASE WHEN source_type = 'blueprints' AND status = 'completed' THEN source_id END) AS blueprints_processed,

    -- Job processing
    COUNT(*) FILTER (WHERE job_type IS NOT NULL) AS total_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_jobs,

    -- Performance
    ROUND(AVG(duration_ms), 0) AS avg_duration_ms,
    MAX(duration_ms) AS max_duration_ms,

    -- By service
    COUNT(*) FILTER (WHERE service_name = 'parsing') AS parsing_jobs,
    COUNT(*) FILTER (WHERE service_name = 'vision') AS vision_jobs,
    COUNT(*) FILTER (WHERE service_name = 'estimation') AS estimation_jobs,
    COUNT(*) FILTER (WHERE service_name = 'rendering') AS rendering_jobs,
    COUNT(*) FILTER (WHERE service_name = 'assistant') AS assistant_jobs

FROM (
    SELECT
        id AS source_id,
        'blueprints' AS source_type,
        status,
        created_at,
        NULL::VARCHAR AS job_type,
        NULL::VARCHAR AS service_name,
        EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at)) * 1000 AS duration_ms
    FROM blueprints
    UNION ALL
    SELECT
        id AS source_id,
        'jobs' AS source_type,
        status,
        created_at,
        job_type,
        service_name,
        duration_ms::DECIMAL
    FROM processing_jobs
) combined
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_mv_daily_processing_metrics_date
ON mv_daily_processing_metrics(date);

COMMENT ON MATERIALIZED VIEW mv_daily_processing_metrics IS 'Daily processing metrics for monitoring';

-- ============================================================================
-- Function to Refresh All Materialized Views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fixture_type_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_processing_metrics;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_all_materialized_views() IS 'Refresh all materialized views concurrently';

-- ============================================================================
-- Reporting Tables: Cost Analysis History
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_analysis_history (
    id BIGSERIAL PRIMARY KEY,

    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,  -- 'daily', 'weekly', 'monthly'

    -- Project stats
    total_projects INTEGER DEFAULT 0,
    new_projects INTEGER DEFAULT 0,
    active_projects INTEGER DEFAULT 0,

    -- Blueprint stats
    total_blueprints INTEGER DEFAULT 0,
    blueprints_processed INTEGER DEFAULT 0,
    avg_fixtures_per_blueprint DECIMAL(10, 2),

    -- Cost stats
    total_estimates_generated INTEGER DEFAULT 0,
    total_estimated_value DECIMAL(14, 2) DEFAULT 0,
    avg_estimate_value DECIMAL(14, 2) DEFAULT 0,

    -- By fixture type (JSONB)
    fixture_type_breakdown JSONB DEFAULT '{}',
    cost_category_breakdown JSONB DEFAULT '{}',

    -- Performance stats
    avg_processing_time_ms INTEGER,
    total_api_calls INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(period_start, period_end, period_type)
);

CREATE INDEX idx_cost_analysis_history_period
ON cost_analysis_history(period_start, period_end);

CREATE INDEX idx_cost_analysis_history_type
ON cost_analysis_history(period_type);

COMMENT ON TABLE cost_analysis_history IS 'Historical snapshots for reporting and analytics';

-- ============================================================================
-- Function to Generate Daily Cost Analysis
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_daily_cost_analysis(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
DECLARE
    v_fixture_breakdown JSONB;
    v_cost_breakdown JSONB;
BEGIN
    -- Calculate fixture type breakdown
    SELECT jsonb_object_agg(fixture_type, count)
    INTO v_fixture_breakdown
    FROM (
        SELECT f.fixture_type, COUNT(*) as count
        FROM fixtures f
        JOIN blueprints b ON b.id = f.blueprint_id
        WHERE DATE(b.created_at) = p_date
        GROUP BY f.fixture_type
    ) sub;

    -- Calculate cost category breakdown
    SELECT jsonb_object_agg(category, total)
    INTO v_cost_breakdown
    FROM (
        SELECT eli.category, SUM(eli.total_cost) as total
        FROM estimate_line_items eli
        JOIN cost_estimates ce ON ce.id = eli.estimate_id
        WHERE DATE(ce.created_at) = p_date
        GROUP BY eli.category
    ) sub;

    -- Insert analysis record
    INSERT INTO cost_analysis_history (
        period_start,
        period_end,
        period_type,
        total_projects,
        new_projects,
        total_blueprints,
        blueprints_processed,
        avg_fixtures_per_blueprint,
        total_estimates_generated,
        total_estimated_value,
        avg_estimate_value,
        fixture_type_breakdown,
        cost_category_breakdown,
        avg_processing_time_ms
    )
    SELECT
        p_date,
        p_date,
        'daily',
        (SELECT COUNT(*) FROM projects),
        (SELECT COUNT(*) FROM projects WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM blueprints WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM blueprints WHERE DATE(created_at) = p_date AND status = 'completed'),
        (SELECT AVG(total_fixtures) FROM blueprints WHERE DATE(created_at) = p_date),
        (SELECT COUNT(*) FROM cost_estimates WHERE DATE(created_at) = p_date),
        (SELECT COALESCE(SUM(total_cost), 0) FROM cost_estimates WHERE DATE(created_at) = p_date),
        (SELECT AVG(total_cost) FROM cost_estimates WHERE DATE(created_at) = p_date),
        COALESCE(v_fixture_breakdown, '{}'),
        COALESCE(v_cost_breakdown, '{}'),
        (SELECT AVG(duration_ms)::INTEGER FROM processing_jobs WHERE DATE(created_at) = p_date)
    ON CONFLICT (period_start, period_end, period_type) DO UPDATE
    SET
        total_projects = EXCLUDED.total_projects,
        new_projects = EXCLUDED.new_projects,
        total_blueprints = EXCLUDED.total_blueprints,
        blueprints_processed = EXCLUDED.blueprints_processed,
        avg_fixtures_per_blueprint = EXCLUDED.avg_fixtures_per_blueprint,
        total_estimates_generated = EXCLUDED.total_estimates_generated,
        total_estimated_value = EXCLUDED.total_estimated_value,
        avg_estimate_value = EXCLUDED.avg_estimate_value,
        fixture_type_breakdown = EXCLUDED.fixture_type_breakdown,
        cost_category_breakdown = EXCLUDED.cost_category_breakdown,
        avg_processing_time_ms = EXCLUDED.avg_processing_time_ms;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_daily_cost_analysis(DATE) IS 'Generate daily cost analysis snapshot';

-- ============================================================================
-- Scheduled Jobs Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(100) UNIQUE NOT NULL,
    job_type VARCHAR(50) NOT NULL,  -- 'refresh_views', 'generate_report', 'cleanup'
    schedule_cron VARCHAR(100) NOT NULL,  -- Cron expression
    is_enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_run_status VARCHAR(50),
    last_run_duration_ms INTEGER,
    next_run_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed scheduled jobs
INSERT INTO scheduled_jobs (job_name, job_type, schedule_cron, metadata) VALUES
    ('refresh_materialized_views', 'refresh_views', '0 */15 * * * *', '{"views": ["mv_project_statistics", "mv_fixture_type_statistics", "mv_daily_processing_metrics"]}'),
    ('generate_daily_analysis', 'generate_report', '0 0 2 * * *', '{"report_type": "daily_cost_analysis"}'),
    ('cleanup_old_logs', 'cleanup', '0 0 3 * * *', '{"tables": ["audit_log", "vector_search_log"], "retention_days": 90}')
ON CONFLICT (job_name) DO NOTHING;

CREATE TRIGGER update_scheduled_jobs_updated_at
    BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE scheduled_jobs IS 'Configuration for scheduled background jobs';

-- ============================================================================
-- Cleanup Function
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_logs(p_retention_days INTEGER DEFAULT 90)
RETURNS TABLE (
    table_name VARCHAR,
    rows_deleted BIGINT
) AS $$
DECLARE
    v_cutoff TIMESTAMP WITH TIME ZONE;
    v_audit_deleted BIGINT;
    v_search_deleted BIGINT;
BEGIN
    v_cutoff := NOW() - (p_retention_days || ' days')::INTERVAL;

    -- Clean audit log
    WITH deleted AS (
        DELETE FROM audit_log
        WHERE created_at < v_cutoff
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_audit_deleted FROM deleted;

    -- Clean vector search log
    WITH deleted AS (
        DELETE FROM vector_search_log
        WHERE created_at < v_cutoff
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_search_deleted FROM deleted;

    -- Return results
    RETURN QUERY VALUES
        ('audit_log'::VARCHAR, v_audit_deleted),
        ('vector_search_log'::VARCHAR, v_search_deleted);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_logs(INTEGER) IS 'Clean up old log entries beyond retention period';

COMMIT;
