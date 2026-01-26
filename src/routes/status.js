/**
 * System Status Routes
 *
 * Endpoints for monitoring system health and status
 */

const express = require('express');
const router = express.Router();
const systemStatus = require('../services/SystemStatusService');
const logger = require('../utils/logger');
const { get: getCorrelationId } = require('../utils/CorrelationId');

/**
 * GET /api/status
 * Get comprehensive system status
 */
router.get('/', async (req, res) => {
  const correlationId = getCorrelationId();

  try {
    const status = await systemStatus.getSystemStatus();

    logger.info('System status requested', {
      correlationId,
      overall: status.overall
    });

    // Return appropriate HTTP status code
    const httpStatus = status.overall === 'healthy' ? 200 :
                       status.overall === 'degraded' ? 200 :
                       503;

    res.status(httpStatus).json({
      success: true,
      correlationId,
      ...status
    });

  } catch (error) {
    logger.error('Failed to get system status', {
      correlationId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      correlationId,
      error: {
        message: 'Failed to retrieve system status',
        code: 'STATUS_CHECK_FAILED'
      }
    });
  }
});

/**
 * GET /api/status/quick
 * Get cached status (fast, no DB queries)
 */
router.get('/quick', (req, res) => {
  const correlationId = getCorrelationId();

  try {
    const status = systemStatus.getCachedStatus();

    res.json({
      success: true,
      correlationId,
      ...status
    });

  } catch (error) {
    logger.error('Failed to get cached status', {
      correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      correlationId,
      error: {
        message: 'Failed to retrieve cached status',
        code: 'CACHED_STATUS_FAILED'
      }
    });
  }
});

/**
 * GET /api/status/database
 * Get detailed database status
 */
router.get('/database', async (req, res) => {
  const correlationId = getCorrelationId();

  try {
    const dbStatus = await systemStatus.checkDatabase();

    res.json({
      success: true,
      correlationId,
      ...dbStatus
    });

  } catch (error) {
    logger.error('Failed to get database status', {
      correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      correlationId,
      error: {
        message: 'Failed to check database status',
        code: 'DATABASE_CHECK_FAILED'
      }
    });
  }
});

/**
 * GET /api/status/ai
 * Get AI service status
 */
router.get('/ai', async (req, res) => {
  const correlationId = getCorrelationId();

  try {
    const aiStatus = await systemStatus.checkAIService();

    res.json({
      success: true,
      correlationId,
      ...aiStatus
    });

  } catch (error) {
    logger.error('Failed to get AI service status', {
      correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      correlationId,
      error: {
        message: 'Failed to check AI service status',
        code: 'AI_CHECK_FAILED'
      }
    });
  }
});

/**
 * GET /api/status/blueprints
 * Get blueprints engine status
 */
router.get('/blueprints', async (req, res) => {
  const correlationId = getCorrelationId();

  try {
    const blueprintsStatus = await systemStatus.checkBlueprintsEngine();

    res.json({
      success: true,
      correlationId,
      ...blueprintsStatus
    });

  } catch (error) {
    logger.error('Failed to get blueprints engine status', {
      correlationId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      correlationId,
      error: {
        message: 'Failed to check blueprints engine status',
        code: 'BLUEPRINTS_CHECK_FAILED'
      }
    });
  }
});

/**
 * GET /api/status/metrics
 * Get system metrics (Prometheus format)
 */
router.get('/metrics', async (req, res) => {
  try {
    const status = await systemStatus.getSystemStatus();

    // Simple Prometheus-compatible metrics
    const metrics = [];

    // System uptime
    metrics.push(`# HELP plansiteos_uptime_seconds System uptime in seconds`);
    metrics.push(`# TYPE plansiteos_uptime_seconds gauge`);
    metrics.push(`plansiteos_uptime_seconds ${status.services.api.uptime}`);

    // Service status (1 = healthy, 0 = unhealthy)
    metrics.push(`# HELP plansiteos_service_status Service health status (1=healthy, 0=unhealthy)`);
    metrics.push(`# TYPE plansiteos_service_status gauge`);
    metrics.push(`plansiteos_service_status{service="api"} ${status.services.api.status === 'healthy' ? 1 : 0}`);
    metrics.push(`plansiteos_service_status{service="database"} ${status.services.database.status === 'healthy' ? 1 : 0}`);
    metrics.push(`plansiteos_service_status{service="ai"} ${status.services.ai.status === 'healthy' ? 1 : 0}`);
    metrics.push(`plansiteos_service_status{service="blueprints"} ${status.services.blueprints.status === 'healthy' ? 1 : 0}`);

    // Blueprint statistics
    if (status.services.blueprints.statistics) {
      const stats = status.services.blueprints.statistics;
      metrics.push(`# HELP plansiteos_blueprints_total Total blueprints by status`);
      metrics.push(`# TYPE plansiteos_blueprints_total gauge`);
      metrics.push(`plansiteos_blueprints_total{status="pending"} ${stats.pending || 0}`);
      metrics.push(`plansiteos_blueprints_total{status="processing"} ${stats.processing || 0}`);
      metrics.push(`plansiteos_blueprints_total{status="completed"} ${stats.completed || 0}`);
      metrics.push(`plansiteos_blueprints_total{status="failed"} ${stats.failed || 0}`);
    }

    // Memory usage
    if (status.services.api.memory) {
      const mem = status.services.api.memory;
      metrics.push(`# HELP plansiteos_memory_usage_bytes Memory usage in bytes`);
      metrics.push(`# TYPE plansiteos_memory_usage_bytes gauge`);
      metrics.push(`plansiteos_memory_usage_bytes{type="rss"} ${mem.rss * 1024 * 1024}`);
      metrics.push(`plansiteos_memory_usage_bytes{type="heap_used"} ${mem.heapUsed * 1024 * 1024}`);
      metrics.push(`plansiteos_memory_usage_bytes{type="heap_total"} ${mem.heapTotal * 1024 * 1024}`);
    }

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.join('\n') + '\n');

  } catch (error) {
    logger.error('Failed to generate metrics', { error: error.message });
    res.status(500).send('# Error generating metrics\n');
  }
});

module.exports = router;
