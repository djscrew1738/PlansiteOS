-- ============================================================================
-- Migration: Add Leads Management Support
-- Description: Tables for lead capture, tracking, and service area management
-- Date: 2026-01-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Create leads table
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,

    -- Source information
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    post_url TEXT,
    post_text TEXT NOT NULL,
    location VARCHAR(255),

    -- Contact & Location
    contact_info JSONB,
    city VARCHAR(100),
    county VARCHAR(100),
    zip_code VARCHAR(10),

    -- Job information
    job_type VARCHAR(100),
    job_description TEXT,
    estimated_value DECIMAL(10, 2),
    urgency VARCHAR(20) DEFAULT 'medium',

    -- AI Analysis
    ai_score INTEGER DEFAULT 0,
    ai_analysis JSONB,
    ai_recommended_response TEXT,

    -- Status tracking
    status VARCHAR(20) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to INTEGER,

    -- Follow-up
    contacted_at TIMESTAMP,
    follow_up_at TIMESTAMP,
    closed_at TIMESTAMP,
    closed_reason VARCHAR(100),

    -- Dates from original post
    posted_at TIMESTAMP,

    -- Metadata
    correlation_id VARCHAR(100),
    notes TEXT,
    tags VARCHAR(255)[],
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_status CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost', 'spam')),
    CONSTRAINT chk_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT chk_urgency CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
    CONSTRAINT chk_ai_score CHECK (ai_score >= 0 AND ai_score <= 100)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_county ON leads(county);
CREATE INDEX IF NOT EXISTS idx_leads_job_type ON leads(job_type);
CREATE INDEX IF NOT EXISTS idx_leads_ai_score ON leads(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_post_url ON leads(post_url);
CREATE INDEX IF NOT EXISTS idx_leads_correlation_id ON leads(correlation_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_at) WHERE follow_up_at IS NOT NULL;

COMMENT ON TABLE leads IS 'Leads captured from Facebook groups and other sources';
COMMENT ON COLUMN leads.source IS 'Source: facebook, manual, referral, website';
COMMENT ON COLUMN leads.status IS 'Workflow status: new, contacted, quoted, won, lost, spam';
COMMENT ON COLUMN leads.ai_score IS 'AI confidence score 0-100';
COMMENT ON COLUMN leads.priority IS 'Priority level based on AI analysis and urgency';
COMMENT ON COLUMN leads.urgency IS 'Customer urgency level';

-- ============================================================================
-- 2. Create service_areas table
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_areas (
    id SERIAL PRIMARY KEY,

    -- Location identifiers
    city VARCHAR(100),
    county VARCHAR(100) NOT NULL,
    zip_codes VARCHAR(10)[],
    state VARCHAR(2) DEFAULT 'TX',

    -- Service availability
    is_primary BOOLEAN DEFAULT false,
    service_level VARCHAR(20) DEFAULT 'standard',
    response_time_hours INTEGER,

    -- Geographic data
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    radius_miles INTEGER,

    -- Metadata
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_service_level CHECK (service_level IN ('standard', 'premium', 'limited')),
    CONSTRAINT unique_city_county UNIQUE (city, county)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_areas_county ON service_areas(county);
CREATE INDEX IF NOT EXISTS idx_service_areas_city ON service_areas(city);
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(active);
CREATE INDEX IF NOT EXISTS idx_service_areas_is_primary ON service_areas(is_primary);

COMMENT ON TABLE service_areas IS 'Geographic service areas for lead prioritization';
COMMENT ON COLUMN service_areas.is_primary IS 'Primary service area gets highest priority';
COMMENT ON COLUMN service_areas.service_level IS 'Level of service offered in this area';
COMMENT ON COLUMN service_areas.response_time_hours IS 'Expected response time in hours';

-- ============================================================================
-- 3. Insert default service areas (DFW - Dallas/Fort Worth)
-- ============================================================================

INSERT INTO service_areas (county, city, is_primary, service_level, response_time_hours, state, active)
VALUES
    -- Primary Johnson County
    ('Johnson', 'Burleson', true, 'premium', 2, 'TX', true),
    ('Johnson', 'Cleburne', true, 'premium', 2, 'TX', true),
    ('Johnson', 'Joshua', true, 'premium', 2, 'TX', true),
    ('Johnson', 'Alvarado', true, 'premium', 2, 'TX', true),
    ('Johnson', 'Godley', true, 'premium', 2, 'TX', true),
    ('Johnson', 'Keene', true, 'premium', 2, 'TX', true),

    -- Tarrant County (Fort Worth area)
    ('Tarrant', 'Fort Worth', true, 'premium', 4, 'TX', true),
    ('Tarrant', 'Arlington', true, 'standard', 4, 'TX', true),
    ('Tarrant', 'Mansfield', true, 'premium', 3, 'TX', true),
    ('Tarrant', 'Crowley', true, 'premium', 3, 'TX', true),
    ('Tarrant', 'Everman', true, 'standard', 4, 'TX', true),

    -- Dallas County
    ('Dallas', 'Dallas', false, 'standard', 6, 'TX', true),
    ('Dallas', 'Grand Prairie', false, 'standard', 5, 'TX', true),
    ('Dallas', 'Cedar Hill', false, 'standard', 4, 'TX', true),
    ('Dallas', 'DeSoto', false, 'standard', 4, 'TX', true),
    ('Dallas', 'Duncanville', false, 'standard', 4, 'TX', true),

    -- Ellis County
    ('Ellis', 'Midlothian', false, 'standard', 4, 'TX', true),
    ('Ellis', 'Waxahachie', false, 'standard', 5, 'TX', true),
    ('Ellis', 'Red Oak', false, 'standard', 5, 'TX', true),

    -- Hill County
    ('Hill', 'Hillsboro', false, 'limited', 8, 'TX', true),
    ('Hill', 'Whitney', false, 'limited', 8, 'TX', true)
ON CONFLICT (city, county) DO NOTHING;

-- ============================================================================
-- 4. Create views for analytics
-- ============================================================================

-- View: Lead pipeline by status
CREATE OR REPLACE VIEW lead_pipeline AS
SELECT
    status,
    COUNT(*) as count,
    AVG(ai_score) as avg_score,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days
FROM leads
GROUP BY status
ORDER BY
    CASE status
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'quoted' THEN 3
        WHEN 'won' THEN 4
        WHEN 'lost' THEN 5
        WHEN 'spam' THEN 6
    END;

COMMENT ON VIEW lead_pipeline IS 'Lead counts and metrics by status';

-- View: Leads by service area
CREATE OR REPLACE VIEW leads_by_service_area AS
SELECT
    COALESCE(l.city, 'Unknown') as city,
    COALESCE(l.county, 'Unknown') as county,
    sa.is_primary,
    sa.service_level,
    COUNT(l.id) as lead_count,
    AVG(l.ai_score) as avg_score,
    COUNT(*) FILTER (WHERE l.status = 'won') as won_count,
    COUNT(*) FILTER (WHERE l.status IN ('new', 'contacted', 'quoted')) as active_count
FROM leads l
LEFT JOIN service_areas sa ON l.city = sa.city AND l.county = sa.county
WHERE l.status != 'spam'
GROUP BY l.city, l.county, sa.is_primary, sa.service_level
ORDER BY lead_count DESC;

COMMENT ON VIEW leads_by_service_area IS 'Lead distribution across service areas';

-- View: High priority leads
CREATE OR REPLACE VIEW high_priority_leads AS
SELECT
    l.id,
    l.city,
    l.county,
    l.job_type,
    l.ai_score,
    l.urgency,
    l.status,
    l.created_at,
    sa.is_primary as in_primary_service_area,
    EXTRACT(EPOCH FROM (NOW() - l.created_at)) / 3600 as age_hours
FROM leads l
LEFT JOIN service_areas sa ON l.city = sa.city AND l.county = sa.county
WHERE l.ai_score >= 70
    AND l.status IN ('new', 'contacted')
    AND l.created_at >= NOW() - INTERVAL '7 days'
ORDER BY l.ai_score DESC, l.created_at DESC;

COMMENT ON VIEW high_priority_leads IS 'High-confidence leads needing attention';

-- ============================================================================
-- 5. Create functions for lead management
-- ============================================================================

-- Function: Update lead status
CREATE OR REPLACE FUNCTION update_lead_status(
    p_lead_id INTEGER,
    p_new_status VARCHAR,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE leads
    SET
        status = p_new_status,
        updated_at = NOW(),
        contacted_at = CASE WHEN p_new_status = 'contacted' AND contacted_at IS NULL
                            THEN NOW() ELSE contacted_at END,
        closed_at = CASE WHEN p_new_status IN ('won', 'lost', 'spam')
                         THEN NOW() ELSE closed_at END
    WHERE id = p_lead_id;

    -- Log activity
    INSERT INTO lead_activity (lead_id, activity_type, description, created_at)
    VALUES (p_lead_id, 'status_change', 'Status changed to ' || p_new_status ||
            CASE WHEN p_notes IS NOT NULL THEN ': ' || p_notes ELSE '' END, NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_lead_status IS 'Update lead status with automatic timestamp handling';

-- Function: Check if location is in service area
CREATE OR REPLACE FUNCTION is_in_service_area(
    p_city VARCHAR,
    p_county VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    area_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM service_areas
        WHERE active = true
            AND (
                (city IS NOT NULL AND LOWER(city) = LOWER(p_city))
                OR LOWER(county) = LOWER(p_county)
            )
    ) INTO area_exists;

    RETURN area_exists;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_in_service_area IS 'Check if city/county is in active service areas';

-- Function: Get service area priority
CREATE OR REPLACE FUNCTION get_service_area_priority(
    p_city VARCHAR,
    p_county VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
    priority INTEGER;
BEGIN
    SELECT
        CASE
            WHEN is_primary THEN 100
            WHEN service_level = 'premium' THEN 75
            WHEN service_level = 'standard' THEN 50
            WHEN service_level = 'limited' THEN 25
            ELSE 10
        END
    INTO priority
    FROM service_areas
    WHERE active = true
        AND (
            (city IS NOT NULL AND LOWER(city) = LOWER(p_city))
            OR LOWER(county) = LOWER(p_county)
        )
    ORDER BY is_primary DESC, service_level DESC
    LIMIT 1;

    RETURN COALESCE(priority, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_service_area_priority IS 'Get priority score for location';

-- ============================================================================
-- 6. Create trigger for auto-updating updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_areas_updated_at ON service_areas;
CREATE TRIGGER update_service_areas_updated_at
    BEFORE UPDATE ON service_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Commit transaction
-- ============================================================================

COMMIT;

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check tables were created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN ('leads', 'service_areas');

-- Check service areas
-- SELECT * FROM service_areas WHERE is_primary = true ORDER BY county, city;

-- Check views
-- SELECT * FROM lead_pipeline;
-- SELECT * FROM leads_by_service_area LIMIT 10;
