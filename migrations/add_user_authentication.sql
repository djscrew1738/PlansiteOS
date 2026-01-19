-- ============================================================================
-- Migration: Add User Authentication
-- Description: User accounts, sessions, and role-based access control
-- Date: 2026-01-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Create users table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    -- Basic info
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),

    -- Role and permissions
    role VARCHAR(20) DEFAULT 'user',
    permissions JSONB DEFAULT '[]'::jsonb,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,

    -- Security
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    verification_token VARCHAR(255),
    verification_expires TIMESTAMP,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT chk_role CHECK (role IN ('admin', 'manager', 'user', 'guest'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.role IS 'User role: admin, manager, user, guest';
COMMENT ON COLUMN users.permissions IS 'Additional permissions beyond role';

-- ============================================================================
-- 2. Create sessions table (for refresh tokens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    refresh_token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,

    -- Device/Client info
    user_agent TEXT,
    ip_address VARCHAR(45),
    device_type VARCHAR(50),

    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_expires_future CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS 'Active user sessions for refresh token management';

-- ============================================================================
-- 3. Create user_activity_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id INTEGER,
    details JSONB,

    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at DESC);

COMMENT ON TABLE user_activity_log IS 'Audit log of user actions';

-- ============================================================================
-- 4. Update existing tables to add user references
-- ============================================================================

-- Add user_id to leads if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'leads' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_leads_user_id ON leads(user_id);
    END IF;
END $$;

-- Add user_id to blueprints if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blueprints' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE blueprints ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX idx_blueprints_user_id ON blueprints(user_id);
    END IF;
END $$;

-- ============================================================================
-- 5. Create views
-- ============================================================================

-- View: Active users
CREATE OR REPLACE VIEW active_users AS
SELECT
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    is_verified,
    last_login_at,
    created_at
FROM users
WHERE deleted_at IS NULL
    AND is_active = true
ORDER BY last_login_at DESC NULLS LAST;

COMMENT ON VIEW active_users IS 'Active non-deleted users';

-- ============================================================================
-- 6. Create functions
-- ============================================================================

-- Function: Update last login
CREATE OR REPLACE FUNCTION update_user_last_login(
    p_user_id INTEGER,
    p_ip_address VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET
        last_login_at = NOW(),
        last_login_ip = COALESCE(p_ip_address, last_login_ip),
        failed_login_attempts = 0,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_user_last_login IS 'Update user last login timestamp and reset failed attempts';

-- Function: Increment failed login attempts
CREATE OR REPLACE FUNCTION increment_failed_login(
    p_email VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
    lock_minutes INTEGER := 30;
BEGIN
    UPDATE users
    SET
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE
            WHEN failed_login_attempts + 1 >= 5
            THEN NOW() + (lock_minutes || ' minutes')::INTERVAL
            ELSE locked_until
        END,
        updated_at = NOW()
    WHERE email = p_email
      AND deleted_at IS NULL
    RETURNING failed_login_attempts INTO new_count;

    RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_failed_login IS 'Increment failed login attempts and lock account if threshold reached';

-- Function: Check if user is locked
CREATE OR REPLACE FUNCTION is_user_locked(
    p_email VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    is_locked BOOLEAN;
BEGIN
    SELECT
        CASE
            WHEN locked_until IS NOT NULL AND locked_until > NOW() THEN true
            ELSE false
        END
    INTO is_locked
    FROM users
    WHERE email = p_email
      AND deleted_at IS NULL;

    RETURN COALESCE(is_locked, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_user_locked IS 'Check if user account is currently locked';

-- Function: Clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW()
       OR (is_active = true AND last_used_at < NOW() - INTERVAL '30 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clean_expired_sessions IS 'Remove expired and old sessions';

-- ============================================================================
-- 7. Create triggers
-- ============================================================================

-- Trigger: Update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update last_used_at on session use
CREATE OR REPLACE FUNCTION update_session_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_sessions_last_used ON user_sessions;
CREATE TRIGGER update_user_sessions_last_used
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    WHEN (OLD.is_active = true AND NEW.is_active = true)
    EXECUTE FUNCTION update_session_last_used();

-- ============================================================================
-- 8. Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- ============================================================================

-- Hash for 'admin123' using bcrypt
-- You should change this password immediately after first login!
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    is_verified,
    email_verified_at
)
VALUES (
    'admin@ctlplumbing.com',
    '$2a$10$XrQ7I0bXvVvP3LG5C5R8/.k8OXs0n9kNVHDUQ0tG8OhE8Y6YzYZ8O', -- admin123
    'System',
    'Administrator',
    'admin',
    true,
    true,
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- Commit transaction
-- ============================================================================

COMMIT;

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check tables created
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name IN ('users', 'user_sessions', 'user_activity_log');

-- Check default admin user
-- SELECT id, email, role, is_active FROM users WHERE role = 'admin';

-- Test functions
-- SELECT is_user_locked('admin@ctlplumbing.com');
-- SELECT clean_expired_sessions();
