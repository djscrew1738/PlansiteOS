-- Simplified Blueprint Analysis Schema
-- Just the essential tables without complex views/functions

-- Table: blueprints
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

-- Table: blueprint_fixtures
CREATE TABLE IF NOT EXISTS blueprint_fixtures (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    fixture_type VARCHAR(50) NOT NULL,
    room_name VARCHAR(100),
    quantity INTEGER DEFAULT 1,

    -- Measurements (in inches)
    width DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    height DECIMAL(10, 2),

    -- Location
    location_x DECIMAL(10, 2),
    location_y DECIMAL(10, 2),
    floor_level INTEGER DEFAULT 1,

    -- Metadata
    confidence_score DECIMAL(5, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fixtures_blueprint_id ON blueprint_fixtures(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_type ON blueprint_fixtures(fixture_type);
CREATE INDEX IF NOT EXISTS idx_fixtures_room ON blueprint_fixtures(room_name);

-- Table: blueprint_rooms
CREATE TABLE IF NOT EXISTS blueprint_rooms (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50),
    floor_level INTEGER DEFAULT 1,
    fixture_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_blueprint_id ON blueprint_rooms(blueprint_id);

-- Table: blueprint_analysis_log
CREATE TABLE IF NOT EXISTS blueprint_analysis_log (
    id SERIAL PRIMARY KEY,
    blueprint_id INTEGER REFERENCES blueprints(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_log_blueprint_id ON blueprint_analysis_log(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_analysis_log_correlation_id ON blueprint_analysis_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_analysis_log_created_at ON blueprint_analysis_log(created_at DESC);

-- Table: fixture_types_reference
CREATE TABLE IF NOT EXISTS fixture_types_reference (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    standard_width DECIMAL(10, 2),
    standard_depth DECIMAL(10, 2),
    standard_height DECIMAL(10, 2),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert common fixture types
INSERT INTO fixture_types_reference (type_name, category, standard_width, standard_depth, standard_height, description)
VALUES
    ('toilet', 'plumbing', 15, 28, 30, 'Standard toilet'),
    ('lavatory', 'plumbing', 20, 18, 8, 'Bathroom sink'),
    ('shower', 'plumbing', 36, 36, 84, 'Shower stall'),
    ('bathtub', 'plumbing', 30, 60, 20, 'Standard bathtub'),
    ('kitchen_sink', 'plumbing', 33, 22, 10, 'Kitchen sink'),
    ('water_heater', 'plumbing', 20, 20, 60, 'Water heater'),
    ('hose_bib', 'plumbing', 6, 6, 6, 'Outdoor faucet'),
    ('floor_drain', 'plumbing', 4, 4, 2, 'Floor drain'),
    ('utility_sink', 'plumbing', 24, 20, 14, 'Utility/laundry sink'),
    ('dishwasher', 'appliance', 24, 24, 34, 'Dishwasher'),
    ('washing_machine', 'appliance', 27, 28, 43, 'Washing machine')
ON CONFLICT (type_name) DO NOTHING;

-- Simple helper functions
CREATE OR REPLACE FUNCTION get_total_fixture_count(blueprint_id_param INTEGER)
RETURNS INTEGER AS $$
    SELECT COALESCE(SUM(quantity), 0)::INTEGER
    FROM blueprint_fixtures
    WHERE blueprint_id = blueprint_id_param;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_fixture_counts(blueprint_id_param INTEGER)
RETURNS TABLE (
    fixture_type VARCHAR(50),
    count BIGINT,
    avg_confidence NUMERIC
) AS $$
    SELECT
        f.fixture_type,
        SUM(f.quantity) as count,
        ROUND(AVG(f.confidence_score), 2) as avg_confidence
    FROM blueprint_fixtures f
    WHERE f.blueprint_id = blueprint_id_param
    GROUP BY f.fixture_type
    ORDER BY count DESC;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_fixtures_by_room(blueprint_id_param INTEGER)
RETURNS TABLE (
    room_name VARCHAR(100),
    fixture_type VARCHAR(50),
    count BIGINT
) AS $$
    SELECT
        COALESCE(f.room_name, 'Unknown') as room_name,
        f.fixture_type,
        SUM(f.quantity) as count
    FROM blueprint_fixtures f
    WHERE f.blueprint_id = blueprint_id_param
    GROUP BY f.room_name, f.fixture_type
    ORDER BY f.room_name, count DESC;
$$ LANGUAGE SQL STABLE;
