-- 002_bids_schema.up.sql
-- Bid pricing, quote workflow, and helper functions.

CREATE TABLE IF NOT EXISTS fixture_pricing (
  id SERIAL PRIMARY KEY,
  fixture_type VARCHAR(50) NOT NULL REFERENCES fixture_types_reference(fixture_type),
  base_labor_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  base_material_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  installation_hours NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
  pricing_tier VARCHAR(20) NOT NULL DEFAULT 'standard',
  complexity_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
  permit_required BOOLEAN NOT NULL DEFAULT false,
  permit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fixture_pricing_tier CHECK (pricing_tier IN ('economy', 'standard', 'premium')),
  CONSTRAINT chk_fixture_pricing_costs CHECK (
    base_labor_cost >= 0
    AND base_material_cost >= 0
    AND permit_cost >= 0
  ),
  CONSTRAINT unique_fixture_pricing UNIQUE (fixture_type, pricing_tier)
);

CREATE INDEX IF NOT EXISTS idx_fixture_pricing_fixture_type ON fixture_pricing(fixture_type);
CREATE INDEX IF NOT EXISTS idx_fixture_pricing_pricing_tier ON fixture_pricing(pricing_tier);
CREATE INDEX IF NOT EXISTS idx_fixture_pricing_active ON fixture_pricing(is_active);

DROP TRIGGER IF EXISTS update_fixture_pricing_updated_at ON fixture_pricing;
CREATE TRIGGER update_fixture_pricing_updated_at
BEFORE UPDATE ON fixture_pricing
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS labor_rates (
  id SERIAL PRIMARY KEY,
  rate_name VARCHAR(100) NOT NULL,
  rate_type VARCHAR(50) NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL,
  overtime_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.5,
  weekend_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.5,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_labor_rate_type CHECK (rate_type IN ('journeyman', 'apprentice', 'master', 'helper'))
);

CREATE INDEX IF NOT EXISTS idx_labor_rates_type ON labor_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_labor_rates_effective_period ON labor_rates(effective_from, effective_to);

DROP TRIGGER IF EXISTS update_labor_rates_updated_at ON labor_rates;
CREATE TRIGGER update_labor_rates_updated_at
BEFORE UPDATE ON labor_rates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  bid_number VARCHAR(50) UNIQUE NOT NULL,
  blueprint_id INTEGER REFERENCES blueprints(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  project_name VARCHAR(255) NOT NULL,
  project_address TEXT,
  project_type VARCHAR(50) NOT NULL DEFAULT 'residential',
  project_description TEXT,
  subtotal_materials NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal_labor NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal_permits NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal_other NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  markup_percent NUMERIC(5, 2) NOT NULL DEFAULT 15,
  tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  estimated_start_date DATE,
  estimated_duration_days INTEGER,
  estimated_completion_date DATE,
  terms_and_conditions TEXT,
  internal_notes TEXT,
  customer_notes TEXT,
  created_by INTEGER,
  approved_by INTEGER,
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  pricing_tier VARCHAR(20) NOT NULL DEFAULT 'standard',
  correlation_id VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_bids_status CHECK (
    status IN (
      'draft',
      'pending_review',
      'approved',
      'sent',
      'viewed',
      'accepted',
      'rejected',
      'expired',
      'archived'
    )
  ),
  CONSTRAINT chk_bids_project_type CHECK (
    project_type IN ('residential', 'commercial', 'industrial', 'renovation')
  ),
  CONSTRAINT chk_bids_pricing_tier CHECK (pricing_tier IN ('economy', 'standard', 'premium'))
);

CREATE INDEX IF NOT EXISTS idx_bids_bid_number ON bids(bid_number);
CREATE INDEX IF NOT EXISTS idx_bids_blueprint_id ON bids(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_customer_email ON bids(customer_email);
CREATE INDEX IF NOT EXISTS idx_bids_valid_until ON bids(valid_until);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_correlation_id ON bids(correlation_id);

DROP TRIGGER IF EXISTS update_bids_updated_at ON bids;
CREATE TRIGGER update_bids_updated_at
BEFORE UPDATE ON bids
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS bid_line_items (
  id SERIAL PRIMARY KEY,
  bid_id INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  fixture_type VARCHAR(50) REFERENCES fixture_types_reference(fixture_type),
  fixture_id INTEGER REFERENCES blueprint_fixtures(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  room_location VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit VARCHAR(20) NOT NULL DEFAULT 'each',
  unit_material_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit_labor_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  line_material_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  line_labor_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  labor_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  labor_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  adjustment_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  adjustment_reason TEXT,
  notes TEXT,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  is_included BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_bid_line_items_type CHECK (
    item_type IN (
      'fixture',
      'material',
      'labor',
      'permit',
      'equipment',
      'disposal',
      'travel',
      'misc',
      'discount',
      'markup'
    )
  ),
  CONSTRAINT unique_bid_line_number UNIQUE (bid_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_bid_line_items_bid_id ON bid_line_items(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_line_items_fixture_type ON bid_line_items(fixture_type);
CREATE INDEX IF NOT EXISTS idx_bid_line_items_item_type ON bid_line_items(item_type);

DROP TRIGGER IF EXISTS update_bid_line_items_updated_at ON bid_line_items;
CREATE TRIGGER update_bid_line_items_updated_at
BEFORE UPDATE ON bid_line_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS bid_activity_log (
  id SERIAL PRIMARY KEY,
  bid_id INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  old_status VARCHAR(30),
  new_status VARCHAR(30),
  user_id INTEGER,
  correlation_id VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bid_activity_log_bid_id ON bid_activity_log(bid_id);
CREATE INDEX IF NOT EXISTS idx_bid_activity_log_activity_type ON bid_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_bid_activity_log_created_at ON bid_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bid_activity_log_correlation_id ON bid_activity_log(correlation_id);

INSERT INTO fixture_pricing (
  fixture_type,
  pricing_tier,
  base_labor_cost,
  base_material_cost,
  installation_hours,
  complexity_multiplier,
  permit_required,
  permit_cost,
  description
) VALUES
  ('lavatory', 'standard', 225.00, 150.00, 2.0, 1.00, false, 0, 'Standard bathroom sink installation'),
  ('sink', 'standard', 250.00, 175.00, 2.0, 1.00, false, 0, 'Standard sink installation'),
  ('toilet', 'standard', 250.00, 225.00, 2.5, 1.00, false, 0, 'Standard toilet installation'),
  ('urinal', 'standard', 275.00, 200.00, 2.5, 1.10, false, 0, 'Standard urinal installation'),
  ('shower', 'standard', 600.00, 400.00, 6.0, 1.20, true, 125.00, 'Standard shower installation'),
  ('bathtub', 'standard', 500.00, 450.00, 5.0, 1.20, true, 125.00, 'Standard bathtub installation'),
  ('water_heater', 'standard', 400.00, 650.00, 4.0, 1.00, true, 185.00, 'Standard water heater installation'),
  ('kitchen_sink', 'standard', 300.00, 200.00, 2.5, 1.00, false, 0, 'Standard kitchen sink installation'),
  ('dishwasher', 'standard', 200.00, 75.00, 2.0, 1.00, false, 0, 'Standard dishwasher hookup'),
  ('washing_machine', 'standard', 175.00, 60.00, 1.5, 1.00, false, 0, 'Standard washing machine hookup'),
  ('floor_drain', 'standard', 275.00, 125.00, 2.5, 1.00, false, 0, 'Standard floor drain installation'),
  ('hose_bib', 'standard', 150.00, 55.00, 1.5, 1.00, false, 0, 'Standard hose bib installation'),
  ('utility_sink', 'standard', 250.00, 175.00, 2.5, 1.00, false, 0, 'Standard utility sink installation'),
  ('water_closet', 'standard', 250.00, 225.00, 2.5, 1.00, false, 0, 'Standard water closet installation'),
  ('drinking_fountain', 'standard', 300.00, 350.00, 3.0, 1.10, false, 0, 'Standard drinking fountain installation'),
  ('toilet', 'economy', 175.00, 125.00, 2.0, 1.00, false, 0, 'Economy toilet installation'),
  ('toilet', 'premium', 375.00, 400.00, 3.0, 1.10, false, 0, 'Premium toilet installation')
ON CONFLICT (fixture_type, pricing_tier) DO UPDATE SET
  base_labor_cost = EXCLUDED.base_labor_cost,
  base_material_cost = EXCLUDED.base_material_cost,
  installation_hours = EXCLUDED.installation_hours,
  complexity_multiplier = EXCLUDED.complexity_multiplier,
  permit_required = EXCLUDED.permit_required,
  permit_cost = EXCLUDED.permit_cost,
  description = EXCLUDED.description,
  updated_at = NOW();

INSERT INTO labor_rates (
  rate_name,
  rate_type,
  hourly_rate,
  overtime_multiplier,
  weekend_multiplier,
  is_default,
  is_active
) VALUES
  ('Master Plumber', 'master', 95.00, 1.5, 1.5, false, true),
  ('Journeyman Plumber', 'journeyman', 75.00, 1.5, 1.5, true, true),
  ('Apprentice Plumber', 'apprentice', 45.00, 1.5, 1.5, false, true),
  ('Helper', 'helper', 30.00, 1.5, 1.5, false, true)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION generate_bid_number()
RETURNS VARCHAR AS $$
DECLARE
  current_year TEXT;
  next_sequence INTEGER;
BEGIN
  current_year := TO_CHAR(CURRENT_DATE, 'YYYY');

  SELECT
    COALESCE(
      MAX((regexp_match(bid_number, '^BID-' || current_year || '-([0-9]+)$'))[1]::INTEGER),
      0
    ) + 1
  INTO next_sequence
  FROM bids
  WHERE bid_number LIKE 'BID-' || current_year || '-%';

  RETURN 'BID-' || current_year || '-' || LPAD(next_sequence::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_bid_totals(p_bid_id INTEGER)
RETURNS TABLE (
  subtotal_materials NUMERIC,
  subtotal_labor NUMERIC,
  subtotal_permits NUMERIC,
  subtotal_other NUMERIC,
  subtotal NUMERIC,
  discount_amount NUMERIC,
  markup_amount NUMERIC,
  tax_amount NUMERIC,
  grand_total NUMERIC
) AS $$
DECLARE
  v_discount_percent NUMERIC;
  v_markup_percent NUMERIC;
  v_tax_percent NUMERIC;
  v_subtotal_materials NUMERIC;
  v_subtotal_labor NUMERIC;
  v_subtotal_permits NUMERIC;
  v_subtotal_other NUMERIC;
  v_subtotal NUMERIC;
  v_discount_amount NUMERIC;
  v_markup_amount NUMERIC;
  v_after_discount NUMERIC;
  v_after_markup NUMERIC;
  v_tax_amount NUMERIC;
  v_grand_total NUMERIC;
BEGIN
  SELECT
    COALESCE(discount_percent, 0),
    COALESCE(markup_percent, 0),
    COALESCE(tax_percent, 0)
  INTO
    v_discount_percent,
    v_markup_percent,
    v_tax_percent
  FROM bids
  WHERE id = p_bid_id;

  SELECT
    COALESCE(SUM(CASE WHEN item_type IN ('fixture', 'material') THEN line_material_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN item_type IN ('fixture', 'labor') THEN line_labor_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN item_type = 'permit' THEN line_total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN item_type IN ('equipment', 'disposal', 'travel', 'misc') THEN line_total ELSE 0 END), 0)
  INTO
    v_subtotal_materials,
    v_subtotal_labor,
    v_subtotal_permits,
    v_subtotal_other
  FROM bid_line_items
  WHERE bid_id = p_bid_id
    AND is_included = true;

  v_subtotal := v_subtotal_materials + v_subtotal_labor + v_subtotal_permits + v_subtotal_other;

  v_discount_amount := ROUND(v_subtotal * (v_discount_percent / 100), 2);
  v_after_discount := v_subtotal - v_discount_amount;

  v_markup_amount := ROUND(v_after_discount * (v_markup_percent / 100), 2);
  v_after_markup := v_after_discount + v_markup_amount;

  v_tax_amount := ROUND(v_after_markup * (v_tax_percent / 100), 2);
  v_grand_total := v_after_markup + v_tax_amount;

  RETURN QUERY
  SELECT
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

CREATE OR REPLACE FUNCTION update_bid_totals(p_bid_id INTEGER)
RETURNS VOID AS $$
DECLARE
  totals RECORD;
BEGIN
  SELECT * INTO totals FROM calculate_bid_totals(p_bid_id);

  UPDATE bids
  SET
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
