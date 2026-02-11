-- ============================================================================
-- Migration: Add Blueprint Analysis Support
-- Description: Tables for storing blueprints and fixture analysis
-- Date: 2026-01-07
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Create blueprints table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blueprints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    project_name VARCHAR(255),
    project_address TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    original_url TEXT,

    -- Analysis status
    status VARCHAR(20) DEFAULT 'pending',
    analysis_started_at TIMESTAMP,
    analysis_completed_at TIMESTAMP,

    -- Analysis results
    total_fixtures INTEGER DEFAULT 0,
    analysis_data JSONB,
    error_message TEXT,

    -- Metadata
    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_blueprints_user_id ON blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON blueprints(status);
CREATE INDEX IF NOT EXISTS idx_blueprints_correlation_id ON blueprints(correlation_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_created_at ON blueprints(created_at DESC);

COMMENT ON TABLE blueprints IS 'Uploaded blueprints for plumbing analysis';
COMMENT ON COLUMN blueprints.status IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN blueprints.analysis_data IS 'JSON containing fixture counts, measurements, and locations';

-- ============================================================================
-- 2. Create blueprint_fixtures table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blueprint_fixtures (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,

    -- Fixture details
    fixture_type VARCHAR(50) NOT NULL,
    location VARCHAR(100),
    room_name VARCHAR(100),
    quantity INTEGER DEFAULT 1,

    -- Measurements (in inches or feet)
    width DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    height DECIMAL(10, 2),
    measurement_unit VARCHAR(10) DEFAULT 'inches',

    -- Position on blueprint
    position_x DECIMAL(10, 2),
    position_y DECIMAL(10, 2),

    -- Additional metadata
    notes TEXT,
    confidence_score DECIMAL(5, 2),
    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_fixture_type CHECK (
        fixture_type IN (
            'lavatory', 'sink', 'toilet', 'urinal', 'shower', 'bathtub',
            'water_heater', 'hose_bib', 'floor_drain', 'water_closet',
            'kitchen_sink', 'dishwasher', 'washing_machine', 'utility_sink',
            'drinking_fountain', 'other'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_blueprint_fixtures_blueprint_id ON blueprint_fixtures(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_fixtures_type ON blueprint_fixtures(fixture_type);
CREATE INDEX IF NOT EXISTS idx_blueprint_fixtures_location ON blueprint_fixtures(location);

COMMENT ON TABLE blueprint_fixtures IS 'Individual fixtures detected in blueprints';
COMMENT ON COLUMN blueprint_fixtures.fixture_type IS 'Type of plumbing fixture';
COMMENT ON COLUMN blueprint_fixtures.confidence_score IS 'AI confidence in detection (0-100)';

-- ============================================================================
-- 3. Create blueprint_rooms table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blueprint_rooms (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,

    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50),
    floor_level VARCHAR(20),

    -- Room dimensions
    width DECIMAL(10, 2),
    length DECIMAL(10, 2),
    area DECIMAL(10, 2),
    measurement_unit VARCHAR(10) DEFAULT 'feet',

    -- Fixture counts in this room
    fixture_count INTEGER DEFAULT 0,

    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_rooms_blueprint_id ON blueprint_rooms(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_rooms_room_type ON blueprint_rooms(room_type);

COMMENT ON TABLE blueprint_rooms IS 'Rooms/spaces identified in blueprints';

-- ============================================================================
-- 4. Create blueprint_analysis_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS blueprint_analysis_log (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,

    analysis_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    duration_ms INTEGER,

    input_data JSONB,
    output_data JSONB,
    error_message TEXT,

    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_log_blueprint_id ON blueprint_analysis_log(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_log_correlation_id ON blueprint_analysis_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_log_created_at ON blueprint_analysis_log(created_at DESC);

COMMENT ON TABLE blueprint_analysis_log IS 'Log of all analysis operations on blueprints';

-- ============================================================================
-- 5. Create views for easy querying
-- ============================================================================

-- View: Blueprint summary with fixture counts by type
CREATE OR REPLACE VIEW blueprint_summary AS
SELECT
    b.id as blueprint_id,
    b.project_name,
    b.status,
    b.total_fixtures,
    b.created_at,
    COUNT(DISTINCT bf.room_name) as room_count,
    COUNT(bf.id) as detected_fixtures,
    json_object_agg(
        bf.fixture_type,
        COUNT(bf.id)
    ) FILTER (WHERE bf.fixture_type IS NOT NULL) as fixture_counts_by_type
FROM blueprints b
LEFT JOIN blueprint_fixtures bf ON bf.blueprint_id = b.id
GROUP BY b.id, b.project_name, b.status, b.total_fixtures, b.created_at;

COMMENT ON VIEW blueprint_summary IS 'Summary view of blueprints with fixture counts';

-- View: Fixtures by location
CREATE OR REPLACE VIEW fixtures_by_location AS
SELECT
    bf.blueprint_id,
    bf.location,
    bf.room_name,
    bf.fixture_type,
    COUNT(*) as count,
    AVG(bf.confidence_score) as avg_confidence,
    json_agg(json_build_object(
        'id', bf.id,
        'type', bf.fixture_type,
        'width', bf.width,
        'depth', bf.depth,
        'confidence', bf.confidence_score
    )) as fixtures
FROM blueprint_fixtures bf
GROUP BY bf.blueprint_id, bf.location, bf.room_name, bf.fixture_type
ORDER BY bf.location, bf.fixture_type;

COMMENT ON VIEW fixtures_by_location IS 'Fixtures grouped by location and type';

-- ============================================================================
-- 6. Create functions for analysis
-- ============================================================================

-- Function: Get fixture count by type for a blueprint
CREATE OR REPLACE FUNCTION get_fixture_counts(p_blueprint_id INTEGER)
RETURNS TABLE (
    fixture_type VARCHAR,
    count BIGINT,
    avg_confidence DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bf.fixture_type,
        COUNT(*) as count,
        ROUND(AVG(bf.confidence_score), 2) as avg_confidence
    FROM blueprint_fixtures bf
    WHERE bf.blueprint_id = p_blueprint_id
    GROUP BY bf.fixture_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_fixture_counts(INTEGER) IS 'Get fixture counts by type for a blueprint';

-- Function: Get fixtures by room
CREATE OR REPLACE FUNCTION get_fixtures_by_room(p_blueprint_id INTEGER)
RETURNS TABLE (
    room_name VARCHAR,
    fixture_type VARCHAR,
    count BIGINT,
    total_width DECIMAL,
    total_depth DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bf.room_name,
        bf.fixture_type,
        COUNT(*) as count,
        ROUND(SUM(bf.width), 2) as total_width,
        ROUND(SUM(bf.depth), 2) as total_depth
    FROM blueprint_fixtures bf
    WHERE bf.blueprint_id = p_blueprint_id
      AND bf.room_name IS NOT NULL
    GROUP BY bf.room_name, bf.fixture_type
    ORDER BY bf.room_name, count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_fixtures_by_room(INTEGER) IS 'Get fixtures grouped by room';

-- Function: Get total fixture count
CREATE OR REPLACE FUNCTION get_total_fixture_count(p_blueprint_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(quantity), 0)
    INTO total_count
    FROM blueprint_fixtures
    WHERE blueprint_id = p_blueprint_id;

    RETURN total_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_total_fixture_count(INTEGER) IS 'Get total count of all fixtures';

-- Function: Update blueprint analysis status
CREATE OR REPLACE FUNCTION update_blueprint_status(
    p_blueprint_id INTEGER,
    p_status VARCHAR,
    p_total_fixtures INTEGER DEFAULT NULL,
    p_analysis_data JSONB DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE blueprints
    SET
        status = p_status,
        total_fixtures = COALESCE(p_total_fixtures, total_fixtures),
        analysis_data = COALESCE(p_analysis_data, analysis_data),
        error_message = p_error_message,
        analysis_completed_at = CASE
            WHEN p_status IN ('completed', 'failed') THEN NOW()
            ELSE analysis_completed_at
        END,
        updated_at = NOW()
    WHERE id = p_blueprint_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_blueprint_status IS 'Update blueprint analysis status';

-- ============================================================================
-- 7. Create trigger for auto-updating updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_blueprints_updated_at ON blueprints;
CREATE TRIGGER update_blueprints_updated_at
    BEFORE UPDATE ON blueprints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Insert fixture type reference data
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixture_types_reference (
    fixture_type VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    typical_width_inches DECIMAL(10, 2),
    typical_depth_inches DECIMAL(10, 2),
    typical_height_inches DECIMAL(10, 2),
    category VARCHAR(50),
    description TEXT,
    icon_name VARCHAR(50)
);

INSERT INTO fixture_types_reference (fixture_type, display_name, typical_width_inches, typical_depth_inches, typical_height_inches, category, icon_name) VALUES
    ('lavatory', 'Lavatory/Bathroom Sink', 20, 18, 32, 'bathroom', 'lavatory'),
    ('sink', 'Sink', 24, 21, 36, 'kitchen', 'sink'),
    ('toilet', 'Toilet', 15, 28, 29, 'bathroom', 'toilet'),
    ('urinal', 'Urinal', 14, 14, 24, 'bathroom', 'urinal'),
    ('shower', 'Shower', 36, 36, 84, 'bathroom', 'shower'),
    ('bathtub', 'Bathtub', 60, 32, 20, 'bathroom', 'bathtub'),
    ('water_heater', 'Water Heater', 20, 20, 48, 'equipment', 'water-heater'),
    ('hose_bib', 'Hose Bib', 4, 6, 12, 'outdoor', 'hose-bib'),
    ('floor_drain', 'Floor Drain', 4, 4, 2, 'drainage', 'floor-drain'),
    ('water_closet', 'Water Closet', 15, 28, 29, 'bathroom', 'water-closet'),
    ('kitchen_sink', 'Kitchen Sink', 33, 22, 8, 'kitchen', 'kitchen-sink'),
    ('dishwasher', 'Dishwasher', 24, 24, 34, 'kitchen', 'dishwasher'),
    ('washing_machine', 'Washing Machine', 27, 30, 43, 'laundry', 'washing-machine'),
    ('utility_sink', 'Utility Sink', 24, 20, 34, 'utility', 'utility-sink'),
    ('drinking_fountain', 'Drinking Fountain', 14, 14, 36, 'public', 'fountain'),
    ('other', 'Other Fixture', NULL, NULL, NULL, 'other', 'other')
ON CONFLICT (fixture_type) DO NOTHING;

COMMENT ON TABLE fixture_types_reference IS 'Reference data for fixture types and typical dimensions';

-- ============================================================================
-- 9. Grant permissions (adjust as needed)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE ON blueprints TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON blueprint_fixtures TO your_app_user;
-- GRANT SELECT, INSERT ON blueprint_rooms TO your_app_user;
-- GRANT SELECT, INSERT ON blueprint_analysis_log TO your_app_user;
-- GRANT SELECT ON fixture_types_reference TO your_app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- Commit transaction
-- ============================================================================

COMMIT;

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check that tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name LIKE 'blueprint%';

-- Check fixture types
-- SELECT * FROM fixture_types_reference ORDER BY category, fixture_type;

-- Test functions
-- SELECT * FROM get_fixture_counts(1);
-- SELECT * FROM get_fixtures_by_room(1);
