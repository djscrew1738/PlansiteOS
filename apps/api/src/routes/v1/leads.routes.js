const express = require('express');
const router = express.Router();
const Lead = require('../../modules/models/Lead');
const ServiceArea = require('../../modules/models/ServiceArea');
const leadProcessingService = require('../../modules/leads/leads.service');
const logger = require('../../platform/observability/logger');

/**
 * GET /api/v1/leads
 * Get all leads with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      minScore,
      city,
      county,
      limit = 50,
      offset = 0
    } = req.query;

    const leads = await Lead.findAll({
      status,
      priority,
      minScore: minScore ? parseInt(minScore) : undefined,
      city,
      county,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      leads,
      count: leads.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error fetching leads', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/leads/high-priority
 * Get high priority leads
 */
router.get('/high-priority', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const leads = await Lead.getHighPriority(parseInt(limit));

    res.json({
      success: true,
      leads,
      count: leads.length
    });
  } catch (error) {
    logger.error('Error fetching high priority leads', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch high priority leads',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/leads/statistics
 * Get lead statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await Lead.getStatistics();

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    logger.error('Error fetching lead statistics', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/leads/:id
 * Get lead by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(parseInt(id));

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      lead
    });
  } catch (error) {
    logger.error('Error fetching lead', {
      error: error.message,
      lead_id: req.params.id,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch lead',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/leads
 * Process incoming lead (from Facebook post, etc.)
 */
router.post('/', async (req, res) => {
  try {
    const result = await leadProcessingService.processIncomingPost(req.body, {
      correlationId: req.correlationId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    if (result.duplicate) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        lead_id: result.lead_id,
        message: 'Duplicate lead detected'
      });
    }

    if (result.filtered) {
      return res.status(200).json({
        success: true,
        filtered: true,
        reason: result.reason,
        confidence: result.confidence
      });
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error processing lead', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to process lead',
      message: error.message,
      code: error.code
    });
  }
});

/**
 * PATCH /api/v1/leads/:id
 * Update lead
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.update(parseInt(id), req.body);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      lead
    });
  } catch (error) {
    logger.error('Error updating lead', {
      error: error.message,
      lead_id: req.params.id,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update lead',
      message: error.message
    });
  }
});

/**
 * PATCH /api/v1/leads/:id/status
 * Update lead status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const lead = await Lead.updateStatus(parseInt(id), status, notes);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      lead
    });
  } catch (error) {
    logger.error('Error updating lead status', {
      error: error.message,
      lead_id: req.params.id,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to update lead status',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/leads/:id
 * Delete lead
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Lead.delete(parseInt(id));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting lead', {
      error: error.message,
      lead_id: req.params.id,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete lead',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/leads/service-areas
 * Get all service areas
 */
router.get('/service-areas/all', async (req, res) => {
  try {
    const { active, isPrimary } = req.query;

    const areas = await ServiceArea.findAll({
      active: active === 'true',
      isPrimary: isPrimary ? isPrimary === 'true' : undefined
    });

    res.json({
      success: true,
      serviceAreas: areas,
      count: areas.length
    });
  } catch (error) {
    logger.error('Error fetching service areas', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch service areas',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/leads/metrics
 * Get lead processing metrics
 */
router.get('/metrics/processing', async (req, res) => {
  try {
    const metrics = leadProcessingService.getMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error('Error fetching processing metrics', {
      error: error.message,
      correlationId: req.correlationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch metrics',
      message: error.message
    });
  }
});

module.exports = router;
