const express = require('express');
const router = express.Router();
const analyticsService = require('../../modules/analytics/analytics.service');
const logger = require('../../platform/observability/logger');

/**
 * GET /api/v1/analytics/stats
 * Get dashboard statistics with trends
 */
router.get('/stats', async (req, res) => {
  try {
    const { dateRange } = req.query;

    const stats = await analyticsService.getDashboardStats({
      dateRange: dateRange || 'last30days'
    });

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching analytics stats', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });

    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/analytics/fixtures
 * Get fixture breakdown by type
 */
router.get('/fixtures', async (req, res) => {
  try {
    const { dateRange, limit } = req.query;

    const fixtures = await analyticsService.getFixtureBreakdown({
      dateRange: dateRange || 'last30days',
      limit: parseInt(limit) || 20
    });

    res.json({
      fixtures,
      total: fixtures.reduce((sum, f) => sum + f.count, 0)
    });
  } catch (error) {
    logger.error('Error fetching fixture breakdown', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      error: 'Failed to fetch fixture data',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/analytics/performance
 * Get performance metrics
 */
router.get('/performance', async (req, res) => {
  try {
    const { dateRange } = req.query;

    const metrics = await analyticsService.getPerformanceMetrics({
      dateRange: dateRange || 'last30days'
    });

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching performance metrics', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      error: 'Failed to fetch performance data',
      message: error.message
    });
  }
});

module.exports = router;
