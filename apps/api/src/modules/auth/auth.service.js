const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../platform/config/database');
const logger = require('../../platform/observability/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-CHANGE-IN-PRODUCTION';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Authentication Service
 * Handles user registration, login, token management
 */
class AuthService {
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user and tokens
   */
  async register({ email, password, firstName, lastName, phone }) {
    try {
      // Check if user exists
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email.toLowerCase()]
      );

      if (existing.rows.length > 0) {
        throw new Error('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, first_name, last_name, role, is_active, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName, phone, 'user']
      );

      const user = result.rows[0];

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      logger.info('User registered successfully', {
        user_id: user.id,
        email: user.email
      });

      return {
        user: this._formatUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Registration error', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} User and tokens
   */
  async login({ email, password, ipAddress, userAgent }) {
    try {
      // Check if account is locked
      const isLocked = await this._isUserLocked(email);
      if (isLocked) {
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Get user
      const result = await db.query(
        `SELECT * FROM users
         WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        await this._incrementFailedLogin(email);
        throw new Error('Invalid email or password');
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        await this._incrementFailedLogin(email);
        throw new Error('Invalid email or password');
      }

      // Update last login
      await db.query('SELECT update_user_last_login($1, $2)', [user.id, ipAddress]);

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(
        user,
        { ipAddress, userAgent }
      );

      // Log activity
      await this._logActivity(user.id, 'login', null, null, { ipAddress, userAgent });

      logger.info('User logged in successfully', {
        user_id: user.id,
        email: user.email,
        ip_address: ipAddress
      });

      return {
        user: this._formatUser(user),
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_SECRET);

      // Check if session exists and is active
      const sessionResult = await db.query(
        `SELECT s.*, u.* FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.refresh_token = $1
           AND s.is_active = true
           AND s.expires_at > NOW()
           AND u.deleted_at IS NULL
           AND u.is_active = true`,
        [refreshToken]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Invalid or expired refresh token');
      }

      const user = sessionResult.rows[0];

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update session last used
      await db.query(
        'UPDATE user_sessions SET last_used_at = NOW() WHERE refresh_token = $1',
        [refreshToken]
      );

      logger.info('Access token refreshed', { user_id: user.id });

      return {
        user: this._formatUser(user),
        ...tokens
      };
    } catch (error) {
      logger.error('Token refresh error', { error: error.message });
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user (invalidate refresh token)
   * @param {string} refreshToken - Refresh token to invalidate
   * @returns {Promise<void>}
   */
  async logout(refreshToken) {
    try {
      await db.query(
        'UPDATE user_sessions SET is_active = false WHERE refresh_token = $1',
        [refreshToken]
      );

      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout error', { error: error.message });
    }
  }

  /**
   * Generate access and refresh tokens
   * @param {Object} user - User object
   * @param {Object} sessionData - Session metadata
   * @returns {Promise<Object>} Tokens
   */
  async generateTokens(user, sessionData = {}) {
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate refresh token (long-lived)
    const refreshToken = crypto.randomBytes(64).toString('hex');

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        refreshToken,
        expiresAt,
        sessionData.ipAddress || null,
        sessionData.userAgent || null
      ]
    );

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {Object} Decoded token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this._formatUser(result.rows[0]);
  }

  /**
   * Check if user is locked
   * @private
   */
  async _isUserLocked(email) {
    const result = await db.query(
      'SELECT is_user_locked($1) as is_locked',
      [email.toLowerCase()]
    );

    return result.rows[0].is_locked;
  }

  /**
   * Increment failed login attempts
   * @private
   */
  async _incrementFailedLogin(email) {
    await db.query(
      'SELECT increment_failed_login($1)',
      [email.toLowerCase()]
    );
  }

  /**
   * Log user activity
   * @private
   */
  async _logActivity(userId, action, resource, resourceId, details) {
    await db.query(
      `INSERT INTO user_activity_log (user_id, action, resource, resource_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        action,
        resource,
        resourceId,
        details ? JSON.stringify(details) : null,
        details?.ipAddress || null,
        details?.userAgent || null
      ]
    );
  }

  /**
   * Format user object (remove sensitive data)
   * @private
   */
  _formatUser(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at
    };
  }
}

module.exports = new AuthService();
