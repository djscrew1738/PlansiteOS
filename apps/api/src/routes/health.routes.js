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
    uptime: process.uptime(),
    status: 'healthy',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {},
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        unit: 'MB'
      },
      cpu: process.cpuUsage(),
      pid: process.pid,
      nodeVersion: process.version
    }
  };

  // Check database with detailed stats
  try {
    const dbHealth = await db.healthCheck();
    health.services.database = dbHealth;

    if (!dbHealth.healthy) {
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.services.database = { healthy: false, error: error.message };
    health.status = 'unhealthy';
  }

  // Check AI service
  const aiInitialized = !!process.env.ANTHROPIC_API_KEY;
  health.services.ai = {
    initialized: aiInitialized,
    provider: 'Anthropic Claude',
    status: aiInitialized ? 'ready' : 'not configured'
  };
  if (!aiInitialized) {
    health.status = 'degraded';
  }

  // Check notification services
  const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const sendgridConfigured = !!process.env.SENDGRID_API_KEY;

  health.services.notifications = {
    sms: {
      configured: twilioConfigured,
      provider: 'Twilio'
    },
    email: {
      configured: sendgridConfigured,
      provider: 'SendGrid'
    }
  };

  // Check file upload service
  const uploadDir = process.env.UPLOAD_DIR || './uploads/blueprints';
  health.services.fileUpload = {
    initialized: true,
    directory: uploadDir,
    maxFileSize: `${process.env.MAX_FILE_SIZE_MB || 50}MB`
  };

  // Network configuration
  health.network = {
    localIP: process.env.LOCAL_IP || '192.168.1.215',
    tailscaleIP: process.env.TAILSCALE_IP || '100.109.158.92',
    domain: process.env.DOMAIN || 'cbrnholdings.com'
  };

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
