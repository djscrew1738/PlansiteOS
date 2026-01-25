const express = require('express');
const router = express.Router();
const systemStatusService = require('../services/system-status.service');
const logger = require('../platform/observability/logger');

/**
 * GET /api/status
 * Get comprehensive system status
 */
router.get('/', async (req, res) => {
  try {
    const status = await systemStatusService.getSystemStatus();

    // Set appropriate cache headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Return appropriate HTTP status code based on overall health
    const httpStatus = status.overall.status === 'healthy' ? 200
      : status.overall.status === 'degraded' ? 200
      : 503;

    res.status(httpStatus).json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get system status', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system status',
      correlationId: req.correlationId
    });
  }
});

/**
 * GET /api/status/server
 * Get server-specific metrics
 */
router.get('/server', async (req, res) => {
  try {
    const serverStatus = await systemStatusService.getServerStatus();

    res.json({
      success: true,
      data: serverStatus
    });
  } catch (error) {
    logger.error('Failed to get server status', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve server status'
    });
  }
});

/**
 * GET /api/status/database
 * Get database-specific metrics
 */
router.get('/database', async (req, res) => {
  try {
    const dbStatus = await systemStatusService.getDatabaseStatus();

    const httpStatus = dbStatus.status === 'healthy' ? 200 : 503;

    res.status(httpStatus).json({
      success: true,
      data: dbStatus
    });
  } catch (error) {
    logger.error('Failed to get database status', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve database status'
    });
  }
});

/**
 * GET /api/status/ai
 * Get AI service status
 */
router.get('/ai', async (req, res) => {
  try {
    const aiStatus = await systemStatusService.getAIServiceStatus();

    const httpStatus = aiStatus.status === 'healthy' ? 200 : 503;

    res.status(httpStatus).json({
      success: true,
      data: aiStatus
    });
  } catch (error) {
    logger.error('Failed to get AI service status', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve AI service status'
    });
  }
});

/**
 * GET /api/status/blueprints
 * Get blueprint engine status and analytics
 */
router.get('/blueprints', async (req, res) => {
  try {
    const blueprintStatus = await systemStatusService.getBlueprintEngineStatus();

    res.json({
      success: true,
      data: blueprintStatus
    });
  } catch (error) {
    logger.error('Failed to get blueprint engine status', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blueprint engine status'
    });
  }
});

/**
 * GET /api/status/analytics
 * Get analytics engine status
 */
router.get('/analytics', async (req, res) => {
  try {
    const analyticsStatus = await systemStatusService.getAnalyticsStatus();

    res.json({
      success: true,
      data: analyticsStatus
    });
  } catch (error) {
    logger.error('Failed to get analytics status', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics status'
    });
  }
});

module.exports = router;
