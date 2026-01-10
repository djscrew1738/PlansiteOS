-- ============================================================================
-- Migration: Add Bids Support
-- Description: Tables for bid generation, pricing, and quote management
-- Date: 2026-01-09
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Create fixture_pricing table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fixture_pricing (
    id SERIAL PRIMARY KEY,
    fixture_type VARCHAR(50) NOT NULL REFERENCES fixture_types_reference(fixture_type),

    -- Pricing components
    base_labor_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    base_material_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    installation_hours DECIMAL(5, 2) DEFAULT 1.0,

    -- Pricing tiers
    pricing_tier VARCHAR(20) DEFAULT 'standard',

    -- Complexity multipliers
    complexity_multiplier DECIMAL(4, 2) DEFAULT 1.0,

    -- Additional costs
    permit_required BOOLEAN DEFAULT false,
    permit_cost DECIMAL(10, 2) DEFAULT 0,

    -- Metadata
    description TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_pricing_tier CHECK (pricing_tier IN ('economy', 'standard', 'premium')),
    CONSTRAINT chk_positive_costs CHECK (base_labor_cost >= 0 AND base_material_cost >= 0),
    CONSTRAINT unique_fixture_pricing UNIQUE (fixture_type, pricing_tier)
);

CREATE INDEX IF NOT EXISTS idx_fixture_pricing_fixture_type ON fixture_pricing(fixture_type);
CREATE INDEX IF NOT EXISTS idx_fixture_pricing_tier ON fixture_pricing(pricing_tier);
CREATE INDEX IF NOT EXISTS idx_fixture_pricing_active ON fixture_pricing(is_active);

COMMENT ON TABLE fixture_pricing IS 'Pricing configuration for each fixture type';
COMMENT ON COLUMN fixture_pricing.pricing_tier IS 'Tier: economy, standard, premium';
COMMENT ON COLUMN fixture_pricing.complexity_multiplier IS 'Multiplier for complex installations';

-- ============================================================================
-- 2. Create labor_rates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS labor_rates (
    id SERIAL PRIMARY KEY,
    rate_name VARCHAR(100) NOT NULL,
    rate_type VARCHAR(50) NOT NULL,

    -- Hourly rates
    hourly_rate DECIMAL(10, 2) NOT NULL,
    overtime_multiplier DECIMAL(4, 2) DEFAULT 1.5,
    weekend_multiplier DECIMAL(4, 2) DEFAULT 1.5,

    -- Effective dates
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,

    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_rate_type CHECK (rate_type IN ('journeyman', 'apprentice', 'master', 'helper'))
);

CREATE INDEX IF NOT EXISTS idx_labor_rates_type ON labor_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_labor_rates_effective ON labor_rates(effective_from, effective_to);

COMMENT ON TABLE labor_rates IS 'Labor rates by worker type and time period';

-- ============================================================================
-- 3. Create bids table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    bid_number VARCHAR(50) UNIQUE NOT NULL,
    blueprint_id INTEGER REFERENCES blueprints(id) ON DELETE SET NULL,

    -- Customer information
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,

    -- Project information
    project_name VARCHAR(255) NOT NULL,
    project_address TEXT,
    project_type VARCHAR(50) DEFAULT 'residential',
    project_description TEXT,

    -- Pricing summary
    subtotal_materials DECIMAL(12, 2) DEFAULT 0,
    subtotal_labor DECIMAL(12, 2) DEFAULT 0,
    subtotal_permits DECIMAL(12, 2) DEFAULT 0,
    subtotal_other DECIMAL(12, 2) DEFAULT 0,

    -- Adjustments
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    markup_percent DECIMAL(5, 2) DEFAULT 15,
    tax_percent DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,

    -- Totals
    subtotal DECIMAL(12, 2) DEFAULT 0,
    grand_total DECIMAL(12, 2) DEFAULT 0,

    -- Bid status and workflow
    status VARCHAR(30) DEFAULT 'draft',

    -- Validity
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,

    -- Timeline estimates
    estimated_start_date DATE,
    estimated_duration_days INTEGER,
    estimated_completion_date DATE,

    -- Terms and notes
    terms_and_conditions TEXT,
    internal_notes TEXT,
    customer_notes TEXT,

    -- Tracking
    created_by INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP,
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,

    -- Metadata
    pricing_tier VARCHAR(20) DEFAULT 'standard',
    correlation_id VARCHAR(100),
    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_bid_status CHECK (status IN (
        'draft', 'pending_review', 'approved', 'sent',
        'viewed', 'accepted', 'rejected', 'expired', 'archived'
    )),
    CONSTRAINT chk_project_type CHECK (project_type IN ('residential', 'commercial', 'industrial', 'renovation')),
    CONSTRAINT chk_bid_pricing_tier CHECK (pricing_tier IN ('economy', 'standard', 'premium'))
);

CREATE INDEX IF NOT EXISTS idx_bids_bid_number ON bids(bid_number);
CREATE INDEX IF NOT EXISTS idx_bids_blueprint_id ON bids(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_customer_email ON bids(customer_email);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_valid_until ON bids(valid_until);
CREATE INDEX IF NOT EXISTS idx_bids_correlation_id ON bids(correlation_id);

COMMENT ON TABLE bids IS 'Project bids/quotes generated from blueprint analysis';
COMMENT ON COLUMN bids.bid_number IS 'Unique bid reference number (e.g., BID-2026-0001)';
COMMENT ON COLUMN bids.status IS 'Workflow status of the bid';

-- ============================================================================
-- 4. Create bid_line_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bid_line_items (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,

    -- Item identification
    line_number INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL,

    -- Fixture reference (if applicable)
    fixture_type VARCHAR(50) REFERENCES fixture_types_reference(fixture_type),
    fixture_id INTEGER REFERENCES blueprint_fixtures(id) ON DELETE SET NULL,

    -- Item details
    description TEXT NOT NULL,
    room_location VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'each',

    -- Pricing
    unit_material_cost DECIMAL(10, 2) DEFAULT 0,
    unit_labor_cost DECIMAL(10, 2) DEFAULT 0,
    unit_total DECIMAL(10, 2) DEFAULT 0,

    line_material_total DECIMAL(10, 2) DEFAULT 0,
    line_labor_total DECIMAL(10, 2) DEFAULT 0,
    line_total DECIMAL(10, 2) DEFAULT 0,

    -- Labor details
    labor_hours DECIMAL(6, 2) DEFAULT 0,
    labor_rate DECIMAL(10, 2) DEFAULT 0,

    -- Adjustments
    adjustment_percent DECIMAL(5, 2) DEFAULT 0,
    adjustment_reason TEXT,

    -- Notes
    notes TEXT,
    is_optional BOOLEAN DEFAULT false,
    is_included BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_item_type CHECK (item_type IN (
        'fixture', 'material', 'labor', 'permit', 'equipment',
        'disposal', 'travel', 'misc', 'discount', 'markup'
    )),
    CONSTRAINT chk_positive_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_bid_line_items_bid_id ON bid_line_items(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_line_items_fixture_type ON bid_line_items(fixture_type);
CREATE INDEX IF NOT EXISTS idx_bid_line_items_item_type ON bid_line_items(item_type);

COMMENT ON TABLE bid_line_items IS 'Individual line items on a bid';
COMMENT ON COLUMN bid_line_items.is_optional IS 'Optional items not included in base total';

-- ============================================================================
-- 5. Create bid_activity_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bid_activity_log (
    id SERIAL PRIMARY KEY,
    bid_id INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,

    activity_type VARCHAR(50) NOT NULL,
    description TEXT,

    old_status VARCHAR(30),
    new_status VARCHAR(30),

    user_id INTEGER,
    correlation_id VARCHAR(100),
    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_bid_activity_type CHECK (activity_type IN (
        'created', 'updated', 'line_item_added', 'line_item_removed', 'line_item_updated',
        'status_changed', 'sent', 'viewed', 'accepted', 'rejected',
        'approved', 'archived', 'cloned', 'regenerated'
    ))
);

CREATE INDEX IF NOT EXISTS idx_bid_activity_log_bid_id ON bid_activity_log(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_activity_log_activity_type ON bid_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_bid_activity_log_created_at ON bid_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bid_activity_log_correlation_id ON bid_activity_log(correlation_id);

COMMENT ON TABLE bid_activity_log IS 'Audit trail of bid activities';

-- ============================================================================
-- 6. Create views for bid management
-- ============================================================================

-- View: Bid summary with line item counts
CREATE OR REPLACE VIEW bid_summary AS
SELECT
    b.id as bid_id,
    b.bid_number,
    b.project_name,
    b.customer_name,
    b.status,
    b.pricing_tier,
    b.grand_total,
    b.valid_until,
    b.created_at,
    COUNT(bli.id) as line_item_count,
    SUM(CASE WHEN bli.item_type = 'fixture' THEN 1 ELSE 0 END) as fixture_count,
    SUM(CASE WHEN bli.is_optional THEN 1 ELSE 0 END) as optional_item_count,
    bp.project_name as blueprint_project_name,
    bp.file_name as blueprint_file_name
FROM bids b
LEFT JOIN bid_line_items bli ON bli.bid_id = b.id AND bli.is_included = true
LEFT JOIN blueprints bp ON bp.id = b.blueprint_id
GROUP BY b.id, bp.project_name, bp.file_name;

COMMENT ON VIEW bid_summary IS 'Summary view of bids with item counts';

-- View: Bid line items with fixture details
CREATE OR REPLACE VIEW bid_line_items_detailed AS
SELECT
    bli.*,
    ftr.display_name as fixture_display_name,
    ftr.category as fixture_category,
    fp.base_labor_cost as pricing_labor,
    fp.base_material_cost as pricing_material
FROM bid_line_items bli
LEFT JOIN fixture_types_reference ftr ON ftr.fixture_type = bli.fixture_type
LEFT JOIN fixture_pricing fp ON fp.fixture_type = bli.fixture_type;

COMMENT ON VIEW bid_line_items_detailed IS 'Line items with fixture reference data';

-- View: Pricing overview by fixture type
CREATE OR REPLACE VIEW pricing_overview AS
SELECT
    ftr.fixture_type,
    ftr.display_name,
    ftr.category,
    fp.pricing_tier,
    fp.base_labor_cost,
    fp.base_material_cost,
    fp.installation_hours,
    fp.complexity_multiplier,
    (fp.base_labor_cost + fp.base_material_cost) as total_base_cost
FROM fixture_types_reference ftr
LEFT JOIN fixture_pricing fp ON fp.fixture_type = ftr.fixture_type AND fp.is_active = true
ORDER BY ftr.category, ftr.display_name, fp.pricing_tier;

COMMENT ON VIEW pricing_overview IS 'Overview of fixture pricing';

-- ============================================================================
-- 7. Create functions for bid management
-- ============================================================================

-- Function: Generate next bid number
CREATE OR REPLACE FUNCTION generate_bid_number()
RETURNS VARCHAR AS $$
DECLARE
    current_year INTEGER;
    next_sequence INTEGER;
    new_bid_number VARCHAR;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(bid_number FROM 'BID-' || current_year || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_sequence
    FROM bids
    WHERE bid_number LIKE 'BID-' || current_year || '-%';

    new_bid_number := 'BID-' || current_year || '-' || LPAD(next_sequence::TEXT, 4, '0');

    RETURN new_bid_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_bid_number() IS 'Generate sequential bid number (BID-YYYY-NNNN)';

-- Function: Calculate bid totals
CREATE OR REPLACE FUNCTION calculate_bid_totals(p_bid_id INTEGER)
RETURNS TABLE (
    subtotal_materials DECIMAL,
    subtotal_labor DECIMAL,
    subtotal_permits DECIMAL,
    subtotal_other DECIMAL,
    subtotal DECIMAL,
    discount_amount DECIMAL,
    markup_amount DECIMAL,
    tax_amount DECIMAL,
    grand_total DECIMAL
) AS $$
DECLARE
    v_discount_percent DECIMAL;
    v_markup_percent DECIMAL;
    v_tax_percent DECIMAL;
    v_subtotal_materials DECIMAL;
    v_subtotal_labor DECIMAL;
    v_subtotal_permits DECIMAL;
    v_subtotal_other DECIMAL;
    v_subtotal DECIMAL;
    v_discount_amount DECIMAL;
    v_markup_amount DECIMAL;
    v_after_discount DECIMAL;
    v_after_markup DECIMAL;
    v_tax_amount DECIMAL;
    v_grand_total DECIMAL;
BEGIN
    -- Get bid settings
    SELECT b.discount_percent, b.markup_percent, b.tax_percent
    INTO v_discount_percent, v_markup_percent, v_tax_percent
    FROM bids b WHERE b.id = p_bid_id;

    -- Calculate subtotals by category
    SELECT
        COALESCE(SUM(CASE WHEN item_type IN ('fixture', 'material') THEN line_material_total ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN item_type IN ('fixture', 'labor') THEN line_labor_total ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN item_type = 'permit' THEN line_total ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN item_type IN ('equipment', 'disposal', 'travel', 'misc') THEN line_total ELSE 0 END), 0)
    INTO v_subtotal_materials, v_subtotal_labor, v_subtotal_permits, v_subtotal_other
    FROM bid_line_items
    WHERE bid_id = p_bid_id AND is_included = true;

    -- Calculate subtotal
    v_subtotal := v_subtotal_materials + v_subtotal_labor + v_subtotal_permits + v_subtotal_other;

    -- Calculate discount
    v_discount_amount := ROUND(v_subtotal * (COALESCE(v_discount_percent, 0) / 100), 2);
    v_after_discount := v_subtotal - v_discount_amount;

    -- Calculate markup
    v_markup_amount := ROUND(v_after_discount * (COALESCE(v_markup_percent, 0) / 100), 2);
    v_after_markup := v_after_discount + v_markup_amount;

    -- Calculate tax
    v_tax_amount := ROUND(v_after_markup * (COALESCE(v_tax_percent, 0) / 100), 2);

    -- Grand total
    v_grand_total := v_after_markup + v_tax_amount;

    RETURN QUERY SELECT
        v_subtotal_materials,
        v_subtotal_labor,
        v_subtotal_permits,
        v_subtotal_other,
        v_subtotal,
        v_discount_amount,
        v_markup_amount,
        v_tax_amount,
        v_grand_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_bid_totals(INTEGER) IS 'Calculate all totals for a bid';

-- Function: Update bid totals (call after line item changes)
CREATE OR REPLACE FUNCTION update_bid_totals(p_bid_id INTEGER)
RETURNS VOID AS $$
DECLARE
    totals RECORD;
BEGIN
    SELECT * INTO totals FROM calculate_bid_totals(p_bid_id);

    UPDATE bids SET
        subtotal_materials = totals.subtotal_materials,
        subtotal_labor = totals.subtotal_labor,
        subtotal_permits = totals.subtotal_permits,
        subtotal_other = totals.subtotal_other,
        subtotal = totals.subtotal,
        discount_amount = totals.discount_amount,
        tax_amount = totals.tax_amount,
        grand_total = totals.grand_total,
        updated_at = NOW()
    WHERE id = p_bid_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_bid_totals(INTEGER) IS 'Recalculate and update bid totals';

-- Function: Get fixture pricing
CREATE OR REPLACE FUNCTION get_fixture_price(
    p_fixture_type VARCHAR,
    p_pricing_tier VARCHAR DEFAULT 'standard'
)
RETURNS TABLE (
    base_labor_cost DECIMAL,
    base_material_cost DECIMAL,
    installation_hours DECIMAL,
    complexity_multiplier DECIMAL,
    total_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        fp.base_labor_cost,
        fp.base_material_cost,
        fp.installation_hours,
        fp.complexity_multiplier,
        (fp.base_labor_cost + fp.base_material_cost) * fp.complexity_multiplier as total_cost
    FROM fixture_pricing fp
    WHERE fp.fixture_type = p_fixture_type
      AND fp.pricing_tier = p_pricing_tier
      AND fp.is_active = true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_fixture_price(VARCHAR, VARCHAR) IS 'Get pricing for a fixture type and tier';

-- ============================================================================
-- 8. Create triggers
-- ============================================================================

-- Trigger: Auto-update updated_at on bids
DROP TRIGGER IF EXISTS update_bids_updated_at ON bids;
CREATE TRIGGER update_bids_updated_at
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on bid_line_items
DROP TRIGGER IF EXISTS update_bid_line_items_updated_at ON bid_line_items;
CREATE TRIGGER update_bid_line_items_updated_at
    BEFORE UPDATE ON bid_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on fixture_pricing
DROP TRIGGER IF EXISTS update_fixture_pricing_updated_at ON fixture_pricing;
CREATE TRIGGER update_fixture_pricing_updated_at
    BEFORE UPDATE ON fixture_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on labor_rates
DROP TRIGGER IF EXISTS update_labor_rates_updated_at ON labor_rates;
CREATE TRIGGER update_labor_rates_updated_at
    BEFORE UPDATE ON labor_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. Insert default fixture pricing data
-- ============================================================================

INSERT INTO fixture_pricing (fixture_type, pricing_tier, base_labor_cost, base_material_cost, installation_hours, complexity_multiplier, permit_required, description) VALUES
    -- Economy tier
    ('lavatory', 'economy', 150.00, 75.00, 1.5, 1.0, false, 'Basic bathroom sink installation'),
    ('sink', 'economy', 175.00, 85.00, 1.5, 1.0, false, 'Basic sink installation'),
    ('toilet', 'economy', 175.00, 125.00, 2.0, 1.0, false, 'Basic toilet installation'),
    ('shower', 'economy', 400.00, 200.00, 4.0, 1.2, true, 'Basic shower installation'),
    ('bathtub', 'economy', 350.00, 250.00, 4.0, 1.2, true, 'Basic bathtub installation'),
    ('water_heater', 'economy', 300.00, 400.00, 3.0, 1.0, true, 'Basic water heater installation'),
    ('kitchen_sink', 'economy', 200.00, 100.00, 2.0, 1.0, false, 'Basic kitchen sink installation'),
    ('dishwasher', 'economy', 150.00, 50.00, 1.5, 1.0, false, 'Basic dishwasher hookup'),
    ('washing_machine', 'economy', 125.00, 40.00, 1.0, 1.0, false, 'Basic washing machine hookup'),
    ('floor_drain', 'economy', 200.00, 75.00, 2.0, 1.0, false, 'Basic floor drain installation'),
    ('hose_bib', 'economy', 100.00, 35.00, 1.0, 1.0, false, 'Basic hose bib installation'),
    ('utility_sink', 'economy', 175.00, 100.00, 2.0, 1.0, false, 'Basic utility sink installation'),

    -- Standard tier
    ('lavatory', 'standard', 225.00, 150.00, 2.0, 1.0, false, 'Standard bathroom sink installation'),
    ('sink', 'standard', 250.00, 175.00, 2.0, 1.0, false, 'Standard sink installation'),
    ('toilet', 'standard', 250.00, 225.00, 2.5, 1.0, false, 'Standard toilet installation'),
    ('urinal', 'standard', 275.00, 200.00, 2.5, 1.1, false, 'Standard urinal installation'),
    ('shower', 'standard', 600.00, 400.00, 6.0, 1.2, true, 'Standard shower installation'),
    ('bathtub', 'standard', 500.00, 450.00, 5.0, 1.2, true, 'Standard bathtub installation'),
    ('water_heater', 'standard', 400.00, 650.00, 4.0, 1.0, true, 'Standard water heater installation'),
    ('kitchen_sink', 'standard', 300.00, 200.00, 2.5, 1.0, false, 'Standard kitchen sink installation'),
    ('dishwasher', 'standard', 200.00, 75.00, 2.0, 1.0, false, 'Standard dishwasher hookup'),
    ('washing_machine', 'standard', 175.00, 60.00, 1.5, 1.0, false, 'Standard washing machine hookup'),
    ('floor_drain', 'standard', 275.00, 125.00, 2.5, 1.0, false, 'Standard floor drain installation'),
    ('hose_bib', 'standard', 150.00, 55.00, 1.5, 1.0, false, 'Standard hose bib installation'),
    ('utility_sink', 'standard', 250.00, 175.00, 2.5, 1.0, false, 'Standard utility sink installation'),
    ('water_closet', 'standard', 250.00, 225.00, 2.5, 1.0, false, 'Standard water closet installation'),
    ('drinking_fountain', 'standard', 300.00, 350.00, 3.0, 1.1, false, 'Standard drinking fountain installation'),

    -- Premium tier
    ('lavatory', 'premium', 350.00, 300.00, 2.5, 1.1, false, 'Premium bathroom sink installation'),
    ('sink', 'premium', 375.00, 325.00, 2.5, 1.1, false, 'Premium sink installation'),
    ('toilet', 'premium', 375.00, 400.00, 3.0, 1.1, false, 'Premium toilet installation'),
    ('urinal', 'premium', 400.00, 350.00, 3.0, 1.1, false, 'Premium urinal installation'),
    ('shower', 'premium', 900.00, 700.00, 8.0, 1.3, true, 'Premium shower installation with custom work'),
    ('bathtub', 'premium', 750.00, 800.00, 7.0, 1.3, true, 'Premium bathtub installation'),
    ('water_heater', 'premium', 550.00, 1200.00, 5.0, 1.1, true, 'Premium tankless water heater installation'),
    ('kitchen_sink', 'premium', 450.00, 400.00, 3.0, 1.1, false, 'Premium kitchen sink installation'),
    ('dishwasher', 'premium', 275.00, 100.00, 2.5, 1.1, false, 'Premium dishwasher hookup'),
    ('washing_machine', 'premium', 225.00, 80.00, 2.0, 1.0, false, 'Premium washing machine hookup'),
    ('floor_drain', 'premium', 400.00, 200.00, 3.0, 1.1, false, 'Premium floor drain installation'),
    ('hose_bib', 'premium', 225.00, 85.00, 2.0, 1.0, false, 'Premium frost-proof hose bib'),
    ('utility_sink', 'premium', 375.00, 300.00, 3.0, 1.1, false, 'Premium utility sink installation')
ON CONFLICT (fixture_type, pricing_tier) DO UPDATE SET
    base_labor_cost = EXCLUDED.base_labor_cost,
    base_material_cost = EXCLUDED.base_material_cost,
    installation_hours = EXCLUDED.installation_hours,
    complexity_multiplier = EXCLUDED.complexity_multiplier,
    permit_required = EXCLUDED.permit_required,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert default labor rates
INSERT INTO labor_rates (rate_name, rate_type, hourly_rate, overtime_multiplier, weekend_multiplier, is_default, is_active) VALUES
    ('Master Plumber', 'master', 95.00, 1.5, 1.5, false, true),
    ('Journeyman Plumber', 'journeyman', 75.00, 1.5, 1.5, true, true),
    ('Apprentice Plumber', 'apprentice', 45.00, 1.5, 1.5, false, true),
    ('Helper', 'helper', 30.00, 1.5, 1.5, false, true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE labor_rates IS 'Default labor rates by worker classification';

-- ============================================================================
-- Commit transaction
-- ============================================================================

COMMIT;

-- ============================================================================
-- Verification queries (run manually)
-- ============================================================================

-- Check tables created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'bid%' OR table_name LIKE '%pricing%' OR table_name = 'labor_rates';

-- Check pricing data
-- SELECT * FROM pricing_overview ORDER BY category, fixture_type, pricing_tier;

-- Test bid number generation
-- SELECT generate_bid_number();

-- Test pricing lookup
-- SELECT * FROM get_fixture_price('toilet', 'standard');
