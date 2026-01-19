const express = require('express');
const router = express.Router();

// Import route modules
const blueprintsRoutes = require('./blueprints.routes');
const bidsRoutes = require('./bids.routes');
const analyticsRoutes = require('./analytics.routes');
const leadsRoutes = require('./leads.routes');
// const responsesRoutes = require('./responses.routes');

// Mount routes
router.use('/blueprints', blueprintsRoutes);
router.use('/bids', bidsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/leads', leadsRoutes);
// router.use('/responses', responsesRoutes);

// API v1 info
router.get('/', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'PipelineOS API',
    endpoints: {
      blueprints: '/api/v1/blueprints',
      bids: '/api/v1/bids',
      analytics: '/api/v1/analytics',
      leads: '/api/v1/leads',
      // responses: '/api/v1/responses',
    },
    documentation: '/api/docs',
    health: '/api/health',
  });
});

module.exports = router;
