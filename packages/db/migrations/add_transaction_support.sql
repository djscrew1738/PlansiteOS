-- ============================================================================
-- Migration: Add Transaction Support Tables
-- Description: Adds tables needed for transaction handling and correlation tracking
-- Date: 2026-01-07
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Add correlation_id to leads table
-- ============================================================================

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_leads_correlation_id
ON leads(correlation_id);

COMMENT ON COLUMN leads.correlation_id IS 'Correlation ID for distributed tracing';

-- ============================================================================
-- 2. Create notification_queue table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 50,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT NOW(),
    last_attempt_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status
ON notification_queue(status);

CREATE INDEX IF NOT EXISTS idx_notification_queue_lead_id
ON notification_queue(lead_id);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_at
ON notification_queue(scheduled_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_notification_queue_correlation_id
ON notification_queue(correlation_id);

COMMENT ON TABLE notification_queue IS 'Queue for asynchronous notifications';
COMMENT ON COLUMN notification_queue.type IS 'Notification type: high_priority_alert, daily_summary, etc.';
COMMENT ON COLUMN notification_queue.priority IS 'Priority score (higher = more urgent)';
COMMENT ON COLUMN notification_queue.status IS 'Status: pending, processing, completed, failed';

-- ============================================================================
-- 3. Create lead_activity table for audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_activity (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    user_id INTEGER,
    correlation_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id
ON lead_activity(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_activity_created_at
ON lead_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_activity_correlation_id
ON lead_activity(correlation_id);

CREATE INDEX IF NOT EXISTS idx_lead_activity_type
ON lead_activity(activity_type);

COMMENT ON TABLE lead_activity IS 'Audit trail of all activities on leads';
COMMENT ON COLUMN lead_activity.activity_type IS 'Type: created, updated, contacted, quoted, won, lost, etc.';

-- ============================================================================
-- 4. Create transaction_log table for debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS transaction_log (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL,
    correlation_id VARCHAR(100),
    operation VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_log_transaction_id
ON transaction_log(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_log_correlation_id
ON transaction_log(correlation_id);

CREATE INDEX IF NOT EXISTS idx_transaction_log_created_at
ON transaction_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transaction_log_status
ON transaction_log(status);

COMMENT ON TABLE transaction_log IS 'Log of database transactions for debugging';

-- ============================================================================
-- 5. Create request_log table for correlation tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS request_log (
    id SERIAL PRIMARY KEY,
    correlation_id VARCHAR(100) NOT NULL,
    method VARCHAR(10),
    path TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_log_correlation_id
ON request_log(correlation_id);

CREATE INDEX IF NOT EXISTS idx_request_log_created_at
ON request_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_log_status_code
ON request_log(status_code);

COMMENT ON TABLE request_log IS 'HTTP request log with correlation IDs';

-- ============================================================================
-- 6. Update existing leads with correlation IDs (optional)
-- ============================================================================

-- Generate correlation IDs for existing leads that don't have one
UPDATE leads
SET correlation_id = 'migration_' || id::text || '_' || floor(random() * 1000000)::text
WHERE correlation_id IS NULL;

-- ============================================================================
-- 7. Create function to auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to notification_queue
DROP TRIGGER IF EXISTS update_notification_queue_updated_at ON notification_queue;
CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Create views for easier querying
-- ============================================================================

-- View for pending notifications
CREATE OR REPLACE VIEW pending_notifications AS
SELECT
    nq.id,
    nq.lead_id,
    nq.type,
    nq.priority,
    nq.attempts,
    nq.scheduled_at,
    nq.correlation_id,
    l.city,
    l.job_type,
    l.ai_score,
    l.status as lead_status
FROM notification_queue nq
JOIN leads l ON l.id = nq.lead_id
WHERE nq.status = 'pending'
  AND nq.scheduled_at <= NOW()
ORDER BY nq.priority DESC, nq.scheduled_at ASC;

COMMENT ON VIEW pending_notifications IS 'View of pending notifications ready to send';

-- View for lead activity timeline
CREATE OR REPLACE VIEW lead_timeline AS
SELECT
    la.lead_id,
    la.activity_type,
    la.description,
    la.correlation_id,
    la.created_at,
    l.post_url,
    l.city,
    l.status
FROM lead_activity la
JOIN leads l ON l.id = la.lead_id
ORDER BY la.created_at DESC;

COMMENT ON VIEW lead_timeline IS 'Chronological view of all lead activities';

-- ============================================================================
-- 9. Grant permissions (adjust as needed)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE ON notification_queue TO your_app_user;
-- GRANT SELECT, INSERT ON lead_activity TO your_app_user;
-- GRANT SELECT, INSERT ON transaction_log TO your_app_user;
-- GRANT SELECT, INSERT ON request_log TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- 10. Add helpful functions
-- ============================================================================

-- Function to get lead activity by correlation ID
CREATE OR REPLACE FUNCTION get_activity_by_correlation_id(p_correlation_id VARCHAR)
RETURNS TABLE (
    activity_id INTEGER,
    lead_id INTEGER,
    activity_type VARCHAR,
    description TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        la.id,
        la.lead_id,
        la.activity_type,
        la.description,
        la.created_at
    FROM lead_activity la
    WHERE la.correlation_id = p_correlation_id
    ORDER BY la.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get full request trace by correlation ID
CREATE OR REPLACE FUNCTION get_request_trace(p_correlation_id VARCHAR)
RETURNS TABLE (
    source VARCHAR,
    event_type VARCHAR,
    message TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'request'::VARCHAR, 'http_request'::VARCHAR, path::TEXT, created_at
    FROM request_log
    WHERE correlation_id = p_correlation_id
    UNION ALL
    SELECT 'transaction'::VARCHAR, 'db_transaction'::VARCHAR, operation::TEXT, created_at
    FROM transaction_log
    WHERE correlation_id = p_correlation_id
    UNION ALL
    SELECT 'activity'::VARCHAR, activity_type::VARCHAR, description::TEXT, created_at
    FROM lead_activity
    WHERE correlation_id = p_correlation_id
    ORDER BY created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_request_trace(VARCHAR) IS 'Get complete trace of a request by correlation ID';

-- ============================================================================
-- Commit transaction
-- ============================================================================

COMMIT;

-- ============================================================================
-- Verification queries (run these after migration)
-- ============================================================================

-- Check that tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('notification_queue', 'lead_activity', 'transaction_log', 'request_log');

-- Check that correlation_id column was added to leads
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'leads' AND column_name = 'correlation_id';

-- Check indexes
-- SELECT indexname FROM pg_indexes
-- WHERE tablename IN ('notification_queue', 'lead_activity', 'transaction_log', 'request_log');

-- Test the trace function
-- SELECT * FROM get_request_trace('your-correlation-id-here');
