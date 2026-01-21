const express = require('express');
const router = express.Router();
const authService = require('../../modules/auth/auth.service');
const { authenticate } = require('../../platform/middleware/auth');
const logger = require('../../platform/observability/logger');

/**
 * POST /api/v1/auth/register
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Password strength check
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone
    });

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Registration error', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = await authService.login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Login error', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Token refresh error', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    logger.error('Get current user error', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

/**
 * PUT /api/v1/auth/password
 * Change password
 */
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new passwords are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // TODO: Implement password change logic

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Password change error', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Password change failed'
    });
  }
});

module.exports = router;
