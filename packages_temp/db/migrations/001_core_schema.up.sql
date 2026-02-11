-- 001_core_schema.up.sql
-- Core schema for blueprints, leads, and operational tracing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL DEFAULT 'facebook',
  post_url TEXT UNIQUE,
  post_text TEXT,
  location VARCHAR(255),
  city VARCHAR(100),
  county VARCHAR(100),
  contact_info TEXT,
  posted_at TIMESTAMPTZ,
  ai_score INTEGER NOT NULL DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_analysis JSONB,
  job_type VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  correlation_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_correlation_id ON leads(correlation_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS blueprints (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  project_name VARCHAR(255),
  project_address TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  original_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  analysis_started_at TIMESTAMPTZ,
  analysis_completed_at TIMESTAMPTZ,
  total_fixtures INTEGER NOT NULL DEFAULT 0,
  analysis_data JSONB,
  error_message TEXT,
  correlation_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_blueprints_status CHECK (
    status IN (
      'pending',
      'processing',
      'completed',
      'failed',
      'processed-dxf'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_blueprints_project_id ON blueprints(project_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON blueprints(status);
CREATE INDEX IF NOT EXISTS idx_blueprints_correlation_id ON blueprints(correlation_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_created_at ON blueprints(created_at DESC);

DROP TRIGGER IF EXISTS update_blueprints_updated_at ON blueprints;
CREATE TRIGGER update_blueprints_updated_at
BEFORE UPDATE ON blueprints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS blueprint_rooms (
  id SERIAL PRIMARY KEY,
  blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  room_name VARCHAR(100) NOT NULL,
  room_type VARCHAR(50),
  floor_level VARCHAR(20) DEFAULT '1',
  width NUMERIC(10, 2),
  length NUMERIC(10, 2),
  area NUMERIC(10, 2),
  measurement_unit VARCHAR(10) DEFAULT 'feet',
  fixture_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_rooms_blueprint_id ON blueprint_rooms(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_rooms_room_type ON blueprint_rooms(room_type);

CREATE TABLE IF NOT EXISTS blueprint_fixtures (
  id SERIAL PRIMARY KEY,
  blueprint_id INTEGER NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  fixture_type VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  room_name VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  width NUMERIC(10, 2),
  depth NUMERIC(10, 2),
  height NUMERIC(10, 2),
  measurement_unit VARCHAR(10) NOT NULL DEFAULT 'inches',
  position_x NUMERIC(10, 2),
  position_y NUMERIC(10, 2),
  confidence_score NUMERIC(5, 2),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_fixtures_blueprint_id ON blueprint_fixtures(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_fixtures_fixture_type ON blueprint_fixtures(fixture_type);
CREATE INDEX IF NOT EXISTS idx_blueprint_fixtures_room_name ON blueprint_fixtures(room_name);

CREATE TABLE IF NOT EXISTS blueprint_analysis_log (
  id SERIAL PRIMARY KEY,
  blueprint_id INTEGER REFERENCES blueprints(id) ON DELETE SET NULL,
  analysis_type VARCHAR(50) NOT NULL DEFAULT 'vision',
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  correlation_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_log_blueprint_id ON blueprint_analysis_log(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_log_correlation_id ON blueprint_analysis_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_analysis_log_created_at ON blueprint_analysis_log(created_at DESC);

CREATE TABLE IF NOT EXISTS fixture_types_reference (
  fixture_type VARCHAR(50) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  typical_width_inches NUMERIC(10, 2),
  typical_depth_inches NUMERIC(10, 2),
  typical_height_inches NUMERIC(10, 2),
  category VARCHAR(50),
  description TEXT,
  icon_name VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO fixture_types_reference (
  fixture_type,
  display_name,
  typical_width_inches,
  typical_depth_inches,
  typical_height_inches,
  category,
  description,
  icon_name
) VALUES
  ('lavatory', 'Lavatory/Bathroom Sink', 20, 18, 32, 'bathroom', 'Bathroom sink', 'lavatory'),
  ('sink', 'Sink', 24, 21, 36, 'kitchen', 'Generic sink', 'sink'),
  ('toilet', 'Toilet', 15, 28, 29, 'bathroom', 'Standard toilet', 'toilet'),
  ('urinal', 'Urinal', 14, 14, 24, 'bathroom', 'Commercial urinal', 'urinal'),
  ('shower', 'Shower', 36, 36, 84, 'bathroom', 'Shower enclosure', 'shower'),
  ('bathtub', 'Bathtub', 60, 32, 20, 'bathroom', 'Bathtub', 'bathtub'),
  ('water_heater', 'Water Heater', 20, 20, 48, 'equipment', 'Water heater', 'water-heater'),
  ('hose_bib', 'Hose Bib', 4, 6, 12, 'outdoor', 'Outdoor faucet', 'hose-bib'),
  ('floor_drain', 'Floor Drain', 4, 4, 2, 'drainage', 'Floor drain', 'floor-drain'),
  ('water_closet', 'Water Closet', 15, 28, 29, 'bathroom', 'Water closet', 'water-closet'),
  ('kitchen_sink', 'Kitchen Sink', 33, 22, 8, 'kitchen', 'Kitchen sink', 'kitchen-sink'),
  ('dishwasher', 'Dishwasher', 24, 24, 34, 'kitchen', 'Dishwasher connection', 'dishwasher'),
  ('washing_machine', 'Washing Machine', 27, 30, 43, 'laundry', 'Washing machine connection', 'washing-machine'),
  ('utility_sink', 'Utility Sink', 24, 20, 34, 'utility', 'Utility sink', 'utility-sink'),
  ('drinking_fountain', 'Drinking Fountain', 14, 14, 36, 'public', 'Drinking fountain', 'fountain'),
  ('other', 'Other Fixture', NULL, NULL, NULL, 'other', 'Unclassified fixture', 'other')
ON CONFLICT (fixture_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS notification_queue (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  priority INTEGER NOT NULL DEFAULT 50,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  correlation_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_notification_queue_status CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  )
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_lead_id ON notification_queue(lead_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_correlation_id ON notification_queue(correlation_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_at
  ON notification_queue(scheduled_at)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS update_notification_queue_updated_at ON notification_queue;
CREATE TRIGGER update_notification_queue_updated_at
BEFORE UPDATE ON notification_queue
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS lead_activity (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  user_id INTEGER,
  correlation_id VARCHAR(100),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_lead_id ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_activity_type ON lead_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activity_correlation_id ON lead_activity(correlation_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created_at ON lead_activity(created_at DESC);

CREATE TABLE IF NOT EXISTS transaction_log (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) NOT NULL,
  correlation_id VARCHAR(100),
  operation VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transaction_log_transaction_id ON transaction_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_log_correlation_id ON transaction_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_transaction_log_status ON transaction_log(status);
CREATE INDEX IF NOT EXISTS idx_transaction_log_created_at ON transaction_log(created_at DESC);

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
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_log_correlation_id ON request_log(correlation_id);
CREATE INDEX IF NOT EXISTS idx_request_log_status_code ON request_log(status_code);
CREATE INDEX IF NOT EXISTS idx_request_log_created_at ON request_log(created_at DESC);

CREATE OR REPLACE FUNCTION get_total_fixture_count(p_blueprint_id INTEGER)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(quantity), 0)::INTEGER
  FROM blueprint_fixtures
  WHERE blueprint_id = p_blueprint_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_fixture_counts(p_blueprint_id INTEGER)
RETURNS TABLE (
  fixture_type VARCHAR(50),
  count BIGINT,
  avg_confidence NUMERIC
) AS $$
  SELECT
    f.fixture_type,
    SUM(f.quantity) AS count,
    ROUND(AVG(f.confidence_score), 2) AS avg_confidence
  FROM blueprint_fixtures f
  WHERE f.blueprint_id = p_blueprint_id
  GROUP BY f.fixture_type
  ORDER BY count DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_fixtures_by_room(p_blueprint_id INTEGER)
RETURNS TABLE (
  room_name VARCHAR(100),
  fixture_type VARCHAR(50),
  count BIGINT,
  total_width NUMERIC,
  total_depth NUMERIC
) AS $$
  SELECT
    COALESCE(f.room_name, 'Unknown') AS room_name,
    f.fixture_type,
    SUM(f.quantity) AS count,
    ROUND(SUM(COALESCE(f.width, 0) * f.quantity), 2) AS total_width,
    ROUND(SUM(COALESCE(f.depth, 0) * f.quantity), 2) AS total_depth
  FROM blueprint_fixtures f
  WHERE f.blueprint_id = p_blueprint_id
  GROUP BY f.room_name, f.fixture_type
  ORDER BY room_name ASC, count DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_activity_by_correlation_id(p_correlation_id VARCHAR)
RETURNS TABLE (
  activity_id INTEGER,
  lead_id INTEGER,
  activity_type VARCHAR,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
  SELECT
    la.id,
    la.lead_id,
    la.activity_type,
    la.description,
    la.created_at
  FROM lead_activity la
  WHERE la.correlation_id = p_correlation_id
  ORDER BY la.created_at DESC;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_request_trace(p_correlation_id VARCHAR)
RETURNS TABLE (
  source VARCHAR,
  event_type VARCHAR,
  message TEXT,
  created_at TIMESTAMPTZ
) AS $$
  SELECT
    'request'::VARCHAR AS source,
    'http_request'::VARCHAR AS event_type,
    COALESCE(rl.method, '') || ' ' || COALESCE(rl.path, '') AS message,
    rl.created_at
  FROM request_log rl
  WHERE rl.correlation_id = p_correlation_id

  UNION ALL

  SELECT
    'transaction'::VARCHAR AS source,
    'db_transaction'::VARCHAR AS event_type,
    tl.operation::TEXT AS message,
    tl.created_at
  FROM transaction_log tl
  WHERE tl.correlation_id = p_correlation_id

  UNION ALL

  SELECT
    'activity'::VARCHAR AS source,
    la.activity_type::VARCHAR AS event_type,
    COALESCE(la.description, '') AS message,
    la.created_at
  FROM lead_activity la
  WHERE la.correlation_id = p_correlation_id
  ORDER BY created_at ASC;
$$ LANGUAGE sql STABLE;
