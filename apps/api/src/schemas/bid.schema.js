const Joi = require('joi');

/**
 * Bid Generation Schema
 */
const generateBidSchema = Joi.object({
  blueprintId: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Blueprint ID must be a number',
      'number.positive': 'Blueprint ID must be positive',
      'any.required': 'Blueprint ID is required'
    }),
  projectName: Joi.string().max(255).optional(),
  projectAddress: Joi.string().max(500).optional(),
  projectType: Joi.string().valid('residential', 'commercial', 'industrial', 'renovation').default('residential'),
  projectDescription: Joi.string().max(2000).optional(),
  customerName: Joi.string().max(255).optional(),
  customerEmail: Joi.string().email().max(255).optional(),
  customerPhone: Joi.string().max(50).optional(),
  customerAddress: Joi.string().max(500).optional(),
  pricingTier: Joi.string().valid('economy', 'standard', 'premium').default('standard'),
  markupPercent: Joi.number().min(0).max(100).default(15),
  discountPercent: Joi.number().min(0).max(100).default(0),
  taxPercent: Joi.number().min(0).max(50).default(0),
  validDays: Joi.number().integer().min(1).max(365).default(30),
  termsAndConditions: Joi.string().max(10000).optional()
});

/**
 * Update Bid Schema
 */
const updateBidSchema = Joi.object({
  projectName: Joi.string().max(255).optional(),
  projectAddress: Joi.string().max(500).optional(),
  projectType: Joi.string().valid('residential', 'commercial', 'industrial', 'renovation').optional(),
  projectDescription: Joi.string().max(2000).optional().allow(''),
  customerName: Joi.string().max(255).optional().allow(''),
  customerEmail: Joi.string().email().max(255).optional().allow(''),
  customerPhone: Joi.string().max(50).optional().allow(''),
  customerAddress: Joi.string().max(500).optional().allow(''),
  markupPercent: Joi.number().min(0).max(100).optional(),
  discountPercent: Joi.number().min(0).max(100).optional(),
  taxPercent: Joi.number().min(0).max(50).optional(),
  validUntil: Joi.date().iso().optional(),
  termsAndConditions: Joi.string().max(10000).optional().allow(''),
  internalNotes: Joi.string().max(5000).optional().allow(''),
  customerNotes: Joi.string().max(5000).optional().allow(''),
  estimatedStartDate: Joi.date().iso().optional().allow(null),
  estimatedDurationDays: Joi.number().integer().min(1).max(365).optional().allow(null)
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Update Status Schema
 */
const updateStatusSchema = Joi.object({
  status: Joi.string().valid(
    'draft', 'pending_review', 'approved', 'sent',
    'viewed', 'accepted', 'rejected', 'expired', 'archived'
  ).required().messages({
    'any.only': 'Invalid status value',
    'any.required': 'Status is required'
  })
});

/**
 * Add Line Item Schema
 */
const addLineItemSchema = Joi.object({
  itemType: Joi.string().valid(
    'fixture', 'material', 'labor', 'permit', 'equipment',
    'disposal', 'travel', 'misc', 'discount', 'markup'
  ).default('misc'),
  fixtureType: Joi.string().max(50).optional().when('itemType', {
    is: 'fixture',
    then: Joi.required()
  }),
  description: Joi.string().max(500).required().messages({
    'any.required': 'Description is required',
    'string.max': 'Description must not exceed 500 characters'
  }),
  roomLocation: Joi.string().max(100).optional(),
  quantity: Joi.number().integer().min(1).max(9999).default(1),
  unit: Joi.string().max(20).default('each'),
  unitMaterialCost: Joi.number().min(0).max(999999.99).default(0),
  unitLaborCost: Joi.number().min(0).max(999999.99).default(0),
  laborHours: Joi.number().min(0).max(9999).default(0),
  notes: Joi.string().max(1000).optional().allow(''),
  isOptional: Joi.boolean().default(false),
  isIncluded: Joi.boolean().default(true)
});

/**
 * Update Line Item Schema
 */
const updateLineItemSchema = Joi.object({
  description: Joi.string().max(500).optional(),
  roomLocation: Joi.string().max(100).optional().allow(''),
  quantity: Joi.number().integer().min(1).max(9999).optional(),
  unit: Joi.string().max(20).optional(),
  unitMaterialCost: Joi.number().min(0).max(999999.99).optional(),
  unitLaborCost: Joi.number().min(0).max(999999.99).optional(),
  laborHours: Joi.number().min(0).max(9999).optional(),
  notes: Joi.string().max(1000).optional().allow(''),
  isOptional: Joi.boolean().optional(),
  isIncluded: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Query Parameters Schema
 */
const queryParamsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(
    'draft', 'pending_review', 'approved', 'sent',
    'viewed', 'accepted', 'rejected', 'expired', 'archived'
  ).optional(),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string().valid('created_at', 'updated_at', 'grand_total', 'bid_number', 'project_name').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * ID Parameter Schema
 */
const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID must be a number',
    'number.positive': 'ID must be positive',
    'any.required': 'ID is required'
  })
});

/**
 * Pricing Query Schema
 */
const pricingQuerySchema = Joi.object({
  tier: Joi.string().valid('economy', 'standard', 'premium').optional()
});

module.exports = {
  generateBidSchema,
  updateBidSchema,
  updateStatusSchema,
  addLineItemSchema,
  updateLineItemSchema,
  queryParamsSchema,
  idParamSchema,
  pricingQuerySchema
};
