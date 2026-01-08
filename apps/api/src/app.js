require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const express = require('express');
const path = require('path');
const logger = require('./platform/observability/logger');
const { correlationIdMiddleware } = require('./platform/middleware/correlationId');
const db = require('./platform/config/database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

// CORS Configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://100.109.158.92:5000',
    'https://ctlplumbingllc.com',
    'https://www.ctlplumbingllc.com',
    process.env.DOMAIN_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-correlation-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationIdMiddleware());

// API Routes
const healthRoutes = require('./routes/health.routes');
const v1Routes = require('./routes/v1');

app.use('/api/health', healthRoutes);
app.use('/api/v1', v1Routes);

// Legacy route for backwards compatibility
try {
  const blueprintsRouter = require('./routes/v1/blueprints.routes');
  app.use('/api/blueprints', blueprintsRouter);
  logger.info('Blueprint routes loaded');
} catch (error) {
  logger.error('Failed to load blueprint routes', {
    error: error.message,
    stack: error.stack
  });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../../storage/uploads')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Express error handler', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    correlationId: req.correlationId
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');

  await db.end();
  logger.info('Database connections closed');

  process.exit(0);
});

// Start server
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    logger.info(`PipelineOS server started`, {
      port: PORT,
      host: HOST,
      tailscaleIp: process.env.TAILSCALE_IP || '100.109.158.92',
      domain: process.env.DOMAIN || 'ctlplumbingllc.com',
      env: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });

    console.log('\n🚀 Server Access URLs:');
    console.log(`   Local:     http://localhost:${PORT}`);
    console.log(`   Tailscale: http://${process.env.TAILSCALE_IP || '100.109.158.92'}:${PORT}`);
    console.log(`   Domain:    https://${process.env.DOMAIN || 'ctlplumbingllc.com'}:${PORT}`);
    console.log('');
  });
}

module.exports = app;
