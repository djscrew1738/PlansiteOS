const express = require('express');
const router = express.Router();
const bidsService = require('./bids.service');
const logger = require('../../platform/observability/logger');
const correlationId = require('../../platform/observability/CorrelationId');
const {
  generateBidSchema,
  updateBidSchema,
  updateStatusSchema,
  addLineItemSchema,
  queryParamsSchema,
  idParamSchema,
  pricingQuerySchema
} = require('../../schemas/bid.schema');

/**
 * Validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        }
      });
    }

    req[property] = value;
    next();
  };
};

/**
 * Error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================================
// Bid Routes
// ============================================================================

/**
 * POST /api/v1/bids/generate
 * Generate a new bid from a blueprint
 */
router.post('/generate', validate(generateBidSchema), asyncHandler(async (req, res) => {
  const corrId = correlationId.get();

  logger.info('Bid generation request received', {
    correlationId: corrId,
    blueprintId: req.body.blueprintId,
    pricingTier: req.body.pricingTier
  });

  const result = await bidsService.generateFromBlueprint(req.body.blueprintId, {
    ...req.body,
    correlationId: corrId
  });

  res.status(201).json({
    success: true,
    data: result.bid,
    meta: {
      generationTime: result.generationTime,
      correlationId: corrId
    }
  });
}));

/**
 * GET /api/v1/bids
 * List all bids with pagination and filtering
 */
router.get('/', validate(queryParamsSchema, 'query'), asyncHandler(async (req, res) => {
  const result = await bidsService.getAllBids(req.query);

  res.json({
    success: true,
    data: result.bids,
    pagination: result.pagination
  });
}));

/**
 * GET /api/v1/bids/statistics
 * Get bid statistics
 */
router.get('/statistics', asyncHandler(async (req, res) => {
  const stats = await bidsService.getStatistics();

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * GET /api/v1/bids/pricing
 * Get pricing configuration
 */
router.get('/pricing', validate(pricingQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const pricing = await bidsService.getPricing(req.query.tier);

  res.json({
    success: true,
    data: pricing
  });
}));

/**
 * GET /api/v1/bids/:id
 * Get a single bid by ID
 */
router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const bid = await bidsService.getBidById(req.params.id);

  res.json({
    success: true,
    data: bid
  });
}));

/**
 * PUT /api/v1/bids/:id
 * Update a bid
 */
router.put('/:id',
  validate(idParamSchema, 'params'),
  validate(updateBidSchema),
  asyncHandler(async (req, res) => {
    const bid = await bidsService.updateBid(req.params.id, req.body);

    res.json({
      success: true,
      data: bid,
      message: 'Bid updated successfully'
    });
  })
);

/**
 * PATCH /api/v1/bids/:id/status
 * Update bid status
 */
router.patch('/:id/status',
  validate(idParamSchema, 'params'),
  validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const bid = await bidsService.updateStatus(req.params.id, req.body.status);

    res.json({
      success: true,
      data: bid,
      message: `Bid status updated to ${req.body.status}`
    });
  })
);

/**
 * POST /api/v1/bids/:id/clone
 * Clone an existing bid
 */
router.post('/:id/clone', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  const corrId = correlationId.get();

  logger.info('Bid clone request received', {
    correlationId: corrId,
    sourceBidId: req.params.id
  });

  const bid = await bidsService.cloneBid(req.params.id);

  res.status(201).json({
    success: true,
    data: bid,
    message: 'Bid cloned successfully'
  });
}));

/**
 * DELETE /api/v1/bids/:id
 * Delete a bid (draft only)
 */
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(async (req, res) => {
  await bidsService.deleteBid(req.params.id);

  res.json({
    success: true,
    message: 'Bid deleted successfully'
  });
}));

// ============================================================================
// Line Item Routes
// ============================================================================

/**
 * POST /api/v1/bids/:id/line-items
 * Add a line item to a bid
 */
router.post('/:id/line-items',
  validate(idParamSchema, 'params'),
  validate(addLineItemSchema),
  asyncHandler(async (req, res) => {
    const lineItem = await bidsService.addLineItem(req.params.id, {
      item_type: req.body.itemType,
      fixture_type: req.body.fixtureType,
      description: req.body.description,
      room_location: req.body.roomLocation,
      quantity: req.body.quantity,
      unit: req.body.unit,
      unit_material_cost: req.body.unitMaterialCost,
      unit_labor_cost: req.body.unitLaborCost,
      labor_hours: req.body.laborHours,
      notes: req.body.notes,
      is_optional: req.body.isOptional,
      is_included: req.body.isIncluded
    });

    res.status(201).json({
      success: true,
      data: lineItem,
      message: 'Line item added successfully'
    });
  })
);

/**
 * DELETE /api/v1/bids/:id/line-items/:lineItemId
 * Remove a line item from a bid
 */
router.delete('/:id/line-items/:lineItemId', asyncHandler(async (req, res) => {
  const { id, lineItemId } = req.params;

  // Validate params
  const bidIdResult = idParamSchema.validate({ id });
  const lineItemIdResult = idParamSchema.validate({ id: lineItemId });

  if (bidIdResult.error || lineItemIdResult.error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid ID parameter'
      }
    });
  }

  await bidsService.removeLineItem(parseInt(id), parseInt(lineItemId));

  res.json({
    success: true,
    message: 'Line item removed successfully'
  });
}));

// ============================================================================
// Error Handler
// ============================================================================

router.use((err, req, res, next) => {
  const corrId = correlationId.get();

  // Handle known errors
  if (err.name === 'BidError') {
    const statusCodes = {
      'NOT_FOUND': 404,
      'BLUEPRINT_NOT_FOUND': 404,
      'ANALYSIS_INCOMPLETE': 400,
      'NO_FIXTURES': 400,
      'INVALID_STATUS': 400,
      'INVALID_TRANSITION': 400,
      'GENERATION_FAILED': 500
    };

    const statusCode = statusCodes[err.code] || 500;

    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        correlationId: corrId
      }
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        correlationId: corrId
      }
    });
  }

  // Log unexpected errors
  logger.error('Unhandled error in bids routes', {
    correlationId: corrId,
    error: err.message,
    stack: err.stack
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      correlationId: corrId
    }
  });
});

module.exports = router;
