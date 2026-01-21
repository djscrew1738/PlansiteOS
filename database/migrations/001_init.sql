-- ============================================================================
-- PlansiteOS Database Schema v3.1
-- Migration: 001_init.sql
-- Description: Initial database setup for microservices architecture
-- ============================================================================

BEGIN;

-- ============================================================================
-- Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_correlation_id()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'corr_' || encode(gen_random_bytes(12), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Core Tables: Projects
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_client_email ON projects(client_email);

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE projects IS 'Construction projects being estimated';

-- ============================================================================
-- Core Tables: Blueprints (Parsing Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50),
    minio_bucket VARCHAR(100) DEFAULT 'blueprints',
    minio_key TEXT,
    page_count INTEGER DEFAULT 1,

    -- Processing status
    status VARCHAR(50) DEFAULT 'pending',
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,

    -- Parse results
    total_pages_processed INTEGER DEFAULT 0,
    total_fixtures INTEGER DEFAULT 0,
    total_rooms INTEGER DEFAULT 0,
    parse_data JSONB DEFAULT '{}',
    error_message TEXT,

    -- Tracing
    correlation_id VARCHAR(100) DEFAULT generate_correlation_id(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_blueprint_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE INDEX idx_blueprints_project_id ON blueprints(project_id);
CREATE INDEX idx_blueprints_status ON blueprints(status);
CREATE INDEX idx_blueprints_correlation_id ON blueprints(correlation_id);
CREATE INDEX idx_blueprints_created_at ON blueprints(created_at DESC);

CREATE TRIGGER update_blueprints_updated_at
    BEFORE UPDATE ON blueprints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE blueprints IS 'Blueprint files uploaded for analysis';

-- ============================================================================
-- Core Tables: Blueprint Pages
-- ============================================================================

CREATE TABLE IF NOT EXISTS blueprint_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    page_type VARCHAR(50),  -- 'floor_plan', 'elevation', 'section', 'detail', 'schedule'
    title VARCHAR(255),

    -- Image storage
    image_path TEXT,
    thumbnail_path TEXT,
    width_px INTEGER,
    height_px INTEGER,

    -- Scale information
    scale_ratio VARCHAR(50),  -- e.g., '1/4" = 1'-0"'
    scale_factor DECIMAL(10, 6),

    -- Metadata
    ocr_text TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(blueprint_id, page_number)
);

CREATE INDEX idx_blueprint_pages_blueprint_id ON blueprint_pages(blueprint_id);
CREATE INDEX idx_blueprint_pages_page_type ON blueprint_pages(page_type);

COMMENT ON TABLE blueprint_pages IS 'Individual pages extracted from blueprint PDFs';

-- ============================================================================
-- Core Tables: Rooms (Vision Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    page_id UUID REFERENCES blueprint_pages(id) ON DELETE SET NULL,

    name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50),  -- 'bathroom', 'kitchen', 'bedroom', 'utility', etc.
    floor_level INTEGER DEFAULT 1,

    -- Dimensions (in feet)
    width DECIMAL(10, 2),
    length DECIMAL(10, 2),
    height DECIMAL(10, 2) DEFAULT 8.0,
    area_sqft DECIMAL(10, 2),

    -- Bounding box on page (pixels)
    bbox_x INTEGER,
    bbox_y INTEGER,
    bbox_width INTEGER,
    bbox_height INTEGER,

    -- Detection metadata
    confidence_score DECIMAL(5, 4),
    detection_model VARCHAR(100),

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rooms_blueprint_id ON rooms(blueprint_id);
CREATE INDEX idx_rooms_room_type ON rooms(room_type);

COMMENT ON TABLE rooms IS 'Rooms detected in blueprints by vision service';

-- ============================================================================
-- Core Tables: Fixtures (Vision Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixtures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    page_id UUID REFERENCES blueprint_pages(id) ON DELETE SET NULL,

    fixture_type VARCHAR(50) NOT NULL,
    fixture_subtype VARCHAR(50),
    manufacturer VARCHAR(100),
    model VARCHAR(100),

    -- Quantity
    quantity INTEGER DEFAULT 1,

    -- Dimensions (in inches)
    width DECIMAL(10, 2),
    depth DECIMAL(10, 2),
    height DECIMAL(10, 2),

    -- Position on page (pixels)
    position_x INTEGER,
    position_y INTEGER,

    -- Segmentation mask (from SAM2)
    mask_path TEXT,
    mask_area INTEGER,

    -- Detection metadata
    confidence_score DECIMAL(5, 4),
    detection_model VARCHAR(100),

    -- Cost reference
    estimated_unit_cost DECIMAL(12, 2),

    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fixtures_blueprint_id ON fixtures(blueprint_id);
CREATE INDEX idx_fixtures_room_id ON fixtures(room_id);
CREATE INDEX idx_fixtures_fixture_type ON fixtures(fixture_type);
CREATE INDEX idx_fixtures_confidence ON fixtures(confidence_score DESC);

COMMENT ON TABLE fixtures IS 'Plumbing fixtures detected in blueprints';

-- ============================================================================
-- Core Tables: Cost Estimates (Estimation Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cost_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,

    estimate_type VARCHAR(50) DEFAULT 'full',  -- 'full', 'quick', 'detailed'
    status VARCHAR(50) DEFAULT 'draft',
    version INTEGER DEFAULT 1,

    -- Cost breakdown
    material_cost DECIMAL(14, 2) DEFAULT 0,
    labor_cost DECIMAL(14, 2) DEFAULT 0,
    equipment_cost DECIMAL(14, 2) DEFAULT 0,
    permit_cost DECIMAL(14, 2) DEFAULT 0,
    overhead_cost DECIMAL(14, 2) DEFAULT 0,
    contingency_cost DECIMAL(14, 2) DEFAULT 0,
    subtotal DECIMAL(14, 2) DEFAULT 0,
    tax_amount DECIMAL(14, 2) DEFAULT 0,
    total_cost DECIMAL(14, 2) DEFAULT 0,

    -- Margin
    margin_percent DECIMAL(5, 2) DEFAULT 15.00,
    final_price DECIMAL(14, 2) DEFAULT 0,

    -- XGBoost prediction metadata
    model_version VARCHAR(50),
    prediction_confidence DECIMAL(5, 4),
    feature_importances JSONB DEFAULT '{}',

    -- Location adjustments
    region VARCHAR(100),
    location_factor DECIMAL(5, 4) DEFAULT 1.0,

    -- Timestamps
    estimated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,

    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_estimate_status CHECK (status IN ('draft', 'pending_review', 'approved', 'sent', 'accepted', 'rejected'))
);

CREATE INDEX idx_cost_estimates_project_id ON cost_estimates(project_id);
CREATE INDEX idx_cost_estimates_blueprint_id ON cost_estimates(blueprint_id);
CREATE INDEX idx_cost_estimates_status ON cost_estimates(status);
CREATE INDEX idx_cost_estimates_created_at ON cost_estimates(created_at DESC);

CREATE TRIGGER update_cost_estimates_updated_at
    BEFORE UPDATE ON cost_estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cost_estimates IS 'Cost estimates generated by estimation service';

-- ============================================================================
-- Core Tables: Line Items (Estimation Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS estimate_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES cost_estimates(id) ON DELETE CASCADE,
    fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,

    category VARCHAR(50) NOT NULL,  -- 'material', 'labor', 'equipment', 'permit'
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'each',
    unit_cost DECIMAL(12, 2) NOT NULL,
    total_cost DECIMAL(14, 2) NOT NULL,

    -- For labor items
    labor_hours DECIMAL(8, 2),
    labor_rate DECIMAL(10, 2),

    -- Sorting
    sort_order INTEGER DEFAULT 0,

    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_estimate_line_items_estimate_id ON estimate_line_items(estimate_id);
CREATE INDEX idx_estimate_line_items_category ON estimate_line_items(category);

COMMENT ON TABLE estimate_line_items IS 'Individual line items in cost estimates';

-- ============================================================================
-- Core Tables: Rendered Outputs (Rendering Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rendered_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
    estimate_id UUID REFERENCES cost_estimates(id) ON DELETE CASCADE,

    output_type VARCHAR(50) NOT NULL,  -- 'annotated_blueprint', 'fixture_overlay', 'cost_report', 'proposal'
    format VARCHAR(20) NOT NULL,  -- 'pdf', 'png', 'svg', 'json'

    -- File storage
    file_path TEXT,
    minio_bucket VARCHAR(100) DEFAULT 'outputs',
    minio_key TEXT,
    file_size BIGINT,

    -- Render metadata
    render_options JSONB DEFAULT '{}',
    render_duration_ms INTEGER,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_render_status CHECK (status IN ('pending', 'rendering', 'completed', 'failed'))
);

CREATE INDEX idx_rendered_outputs_blueprint_id ON rendered_outputs(blueprint_id);
CREATE INDEX idx_rendered_outputs_estimate_id ON rendered_outputs(estimate_id);
CREATE INDEX idx_rendered_outputs_output_type ON rendered_outputs(output_type);

COMMENT ON TABLE rendered_outputs IS 'Rendered outputs from rendering service';

-- ============================================================================
-- Core Tables: Conversations (Assistant Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,

    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',

    -- Metadata
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_conversations_blueprint_id ON conversations(blueprint_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE conversations IS 'Chat conversations with AI assistant';

-- ============================================================================
-- Core Tables: Messages (Assistant Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    role VARCHAR(20) NOT NULL,  -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,

    -- Token usage
    prompt_tokens INTEGER,
    completion_tokens INTEGER,

    -- RAG context
    context_sources JSONB DEFAULT '[]',

    -- Metadata
    model_version VARCHAR(100),
    generation_time_ms INTEGER,

    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_message_role CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_role ON messages(role);

COMMENT ON TABLE messages IS 'Individual messages in conversations';

-- ============================================================================
-- Reference Tables: Fixture Types
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixture_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'bathroom', 'kitchen', 'utility', 'outdoor'

    -- Standard dimensions (inches)
    typical_width DECIMAL(10, 2),
    typical_depth DECIMAL(10, 2),
    typical_height DECIMAL(10, 2),

    -- Cost data
    base_material_cost DECIMAL(12, 2),
    base_labor_hours DECIMAL(6, 2),

    description TEXT,
    icon_name VARCHAR(50),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed fixture types
INSERT INTO fixture_types (type_code, display_name, category, typical_width, typical_depth, typical_height, base_material_cost, base_labor_hours, icon_name) VALUES
    ('toilet', 'Toilet', 'bathroom', 15, 28, 30, 350.00, 3.0, 'toilet'),
    ('lavatory', 'Lavatory/Bathroom Sink', 'bathroom', 20, 18, 8, 250.00, 2.5, 'lavatory'),
    ('bathtub', 'Bathtub', 'bathroom', 30, 60, 20, 800.00, 6.0, 'bathtub'),
    ('shower', 'Shower', 'bathroom', 36, 36, 84, 1200.00, 8.0, 'shower'),
    ('urinal', 'Urinal', 'bathroom', 14, 14, 24, 400.00, 2.5, 'urinal'),
    ('kitchen_sink', 'Kitchen Sink', 'kitchen', 33, 22, 10, 450.00, 3.5, 'kitchen-sink'),
    ('dishwasher', 'Dishwasher', 'kitchen', 24, 24, 34, 150.00, 2.0, 'dishwasher'),
    ('garbage_disposal', 'Garbage Disposal', 'kitchen', 6, 6, 12, 180.00, 1.5, 'garbage-disposal'),
    ('utility_sink', 'Utility Sink', 'utility', 24, 20, 14, 300.00, 2.5, 'utility-sink'),
    ('washing_machine', 'Washing Machine', 'utility', 27, 28, 43, 100.00, 1.5, 'washing-machine'),
    ('water_heater', 'Water Heater', 'utility', 20, 20, 60, 1500.00, 6.0, 'water-heater'),
    ('floor_drain', 'Floor Drain', 'utility', 4, 4, 2, 75.00, 1.0, 'floor-drain'),
    ('hose_bib', 'Hose Bib', 'outdoor', 6, 6, 6, 50.00, 1.0, 'hose-bib'),
    ('drinking_fountain', 'Drinking Fountain', 'public', 14, 14, 36, 600.00, 3.0, 'fountain')
ON CONFLICT (type_code) DO NOTHING;

COMMENT ON TABLE fixture_types IS 'Reference data for fixture types and typical costs';

-- ============================================================================
-- Reference Tables: Labor Rates by Region
-- ============================================================================

CREATE TABLE IF NOT EXISTS labor_rates (
    id SERIAL PRIMARY KEY,
    region VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    trade VARCHAR(50) NOT NULL,  -- 'plumber', 'electrician', 'hvac', 'general'

    hourly_rate DECIMAL(10, 2) NOT NULL,
    overtime_multiplier DECIMAL(4, 2) DEFAULT 1.5,

    effective_date DATE NOT NULL,
    expiration_date DATE,

    source VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(region, trade, effective_date)
);

-- Seed some labor rates
INSERT INTO labor_rates (region, state, trade, hourly_rate, effective_date, source) VALUES
    ('National Average', NULL, 'plumber', 75.00, '2024-01-01', 'BLS'),
    ('California', 'CA', 'plumber', 95.00, '2024-01-01', 'BLS'),
    ('Texas', 'TX', 'plumber', 65.00, '2024-01-01', 'BLS'),
    ('New York', 'NY', 'plumber', 100.00, '2024-01-01', 'BLS'),
    ('Florida', 'FL', 'plumber', 60.00, '2024-01-01', 'BLS')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE labor_rates IS 'Regional labor rates for cost estimation';

-- ============================================================================
-- Logging Tables: Processing Jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    job_type VARCHAR(50) NOT NULL,  -- 'parse', 'detect', 'estimate', 'render'
    service_name VARCHAR(50) NOT NULL,

    -- References
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'queued',
    priority INTEGER DEFAULT 50,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    -- Timing
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,

    -- Input/output
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,

    -- Tracing
    correlation_id VARCHAR(100),
    parent_job_id UUID REFERENCES processing_jobs(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT chk_job_status CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_job_type ON processing_jobs(job_type);
CREATE INDEX idx_processing_jobs_blueprint_id ON processing_jobs(blueprint_id);
CREATE INDEX idx_processing_jobs_correlation_id ON processing_jobs(correlation_id);
CREATE INDEX idx_processing_jobs_queued_at ON processing_jobs(queued_at);

COMMENT ON TABLE processing_jobs IS 'Background processing jobs across all services';

-- ============================================================================
-- Logging Tables: Audit Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,

    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,  -- 'create', 'update', 'delete', 'view'

    actor_type VARCHAR(50),  -- 'user', 'service', 'system'
    actor_id VARCHAR(100),

    old_values JSONB,
    new_values JSONB,

    ip_address INET,
    user_agent TEXT,

    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_correlation_id ON audit_log(correlation_id);

COMMENT ON TABLE audit_log IS 'Audit trail for all entity changes';

-- ============================================================================
-- Views
-- ============================================================================

-- Project summary view
CREATE OR REPLACE VIEW project_summary AS
SELECT
    p.id AS project_id,
    p.name AS project_name,
    p.status AS project_status,
    p.created_at,
    COUNT(DISTINCT b.id) AS blueprint_count,
    COUNT(DISTINCT f.id) AS fixture_count,
    COALESCE(SUM(ce.total_cost), 0) AS total_estimated_cost,
    MAX(ce.created_at) AS latest_estimate_at
FROM projects p
LEFT JOIN blueprints b ON b.project_id = p.id
LEFT JOIN fixtures f ON f.blueprint_id = b.id
LEFT JOIN cost_estimates ce ON ce.project_id = p.id AND ce.status = 'approved'
GROUP BY p.id, p.name, p.status, p.created_at;

COMMENT ON VIEW project_summary IS 'Summary view of projects with counts and costs';

-- Blueprint analysis view
CREATE OR REPLACE VIEW blueprint_analysis AS
SELECT
    b.id AS blueprint_id,
    b.file_name,
    b.status,
    b.total_fixtures,
    b.total_rooms,
    b.created_at,
    COUNT(DISTINCT r.id) AS detected_rooms,
    COUNT(DISTINCT f.id) AS detected_fixtures,
    ROUND(AVG(f.confidence_score), 4) AS avg_confidence,
    jsonb_object_agg(
        COALESCE(f.fixture_type, 'unknown'),
        COUNT(f.id)
    ) FILTER (WHERE f.fixture_type IS NOT NULL) AS fixture_counts
FROM blueprints b
LEFT JOIN rooms r ON r.blueprint_id = b.id
LEFT JOIN fixtures f ON f.blueprint_id = b.id
GROUP BY b.id, b.file_name, b.status, b.total_fixtures, b.total_rooms, b.created_at;

COMMENT ON VIEW blueprint_analysis IS 'Analysis summary for blueprints';

-- ============================================================================
-- Functions
-- ============================================================================

-- Get fixture counts for a blueprint
CREATE OR REPLACE FUNCTION get_blueprint_fixture_counts(p_blueprint_id UUID)
RETURNS TABLE (
    fixture_type VARCHAR,
    count BIGINT,
    avg_confidence DECIMAL,
    total_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.fixture_type,
        COUNT(*) AS count,
        ROUND(AVG(f.confidence_score), 4) AS avg_confidence,
        ROUND(SUM(f.estimated_unit_cost * f.quantity), 2) AS total_cost
    FROM fixtures f
    WHERE f.blueprint_id = p_blueprint_id
    GROUP BY f.fixture_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Calculate estimate totals
CREATE OR REPLACE FUNCTION calculate_estimate_totals(p_estimate_id UUID)
RETURNS VOID AS $$
DECLARE
    v_material DECIMAL;
    v_labor DECIMAL;
    v_equipment DECIMAL;
    v_permit DECIMAL;
    v_subtotal DECIMAL;
    v_overhead DECIMAL;
    v_contingency DECIMAL;
    v_tax DECIMAL;
    v_total DECIMAL;
    v_margin DECIMAL;
    v_final DECIMAL;
BEGIN
    -- Sum line items by category
    SELECT
        COALESCE(SUM(CASE WHEN category = 'material' THEN total_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'labor' THEN total_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'equipment' THEN total_cost ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'permit' THEN total_cost ELSE 0 END), 0)
    INTO v_material, v_labor, v_equipment, v_permit
    FROM estimate_line_items
    WHERE estimate_id = p_estimate_id;

    -- Calculate totals
    v_subtotal := v_material + v_labor + v_equipment + v_permit;
    v_overhead := v_subtotal * 0.10;  -- 10% overhead
    v_contingency := v_subtotal * 0.05;  -- 5% contingency
    v_tax := v_material * 0.08;  -- 8% tax on materials
    v_total := v_subtotal + v_overhead + v_contingency + v_tax;

    -- Get margin and calculate final price
    SELECT margin_percent INTO v_margin FROM cost_estimates WHERE id = p_estimate_id;
    v_final := v_total * (1 + v_margin / 100);

    -- Update estimate
    UPDATE cost_estimates SET
        material_cost = v_material,
        labor_cost = v_labor,
        equipment_cost = v_equipment,
        permit_cost = v_permit,
        overhead_cost = v_overhead,
        contingency_cost = v_contingency,
        subtotal = v_subtotal,
        tax_amount = v_tax,
        total_cost = v_total,
        final_price = v_final,
        updated_at = NOW()
    WHERE id = p_estimate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grants (adjust based on your user setup)
-- ============================================================================

-- Example: Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO plansiteos_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO plansiteos_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO plansiteos_app;

COMMIT;

-- ============================================================================
-- Verification
-- ============================================================================

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;
