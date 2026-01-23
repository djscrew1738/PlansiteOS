-- Add missing columns to projects table for analytics

ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for status column
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
