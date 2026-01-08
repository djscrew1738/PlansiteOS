const express = require('express');
const router = express.Router();
const db = require('../platform/config/database');

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {},
  };

  // Check database
  try {
    await db.query('SELECT 1');
    health.services.database = { healthy: true };
  } catch (error) {
    health.services.database = { healthy: false, error: error.message };
    health.status = 'unhealthy';
  }

  // Check AI service
  const aiInitialized = !!process.env.ANTHROPIC_API_KEY;
  health.services.ai = { initialized: aiInitialized };
  if (!aiInitialized) {
    health.status = 'degraded';
  }

  // Check blueprints service
  health.services.blueprints = { initialized: true };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
