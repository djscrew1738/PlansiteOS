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
  // Build allowed origins from environment variables
  const localIP = process.env.LOCAL_IP || '192.168.1.215';
  const tailscaleIP = process.env.TAILSCALE_IP || '100.109.158.92';
  const domain = process.env.DOMAIN || 'cbrnholdings.com';

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8090',
    `http://${localIP}:5173`,
    `http://${localIP}:8090`,
    `http://${tailscaleIP}:5173`,
    `http://${tailscaleIP}:8090`,
    `https://${domain}`,
    `https://www.${domain}`,
    // Legacy domains
    'https://ctlplumbingllc.com',
    'https://www.ctlplumbingllc.com',
    'https://app.ctlplumbingllc.com',
    // Custom CORS origins from env
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
    process.env.DOMAIN_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-correlation-id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

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
app.use((err, req, res, _next) => {
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
    const localIP = process.env.LOCAL_IP || '192.168.1.215';
    const tailscaleIP = process.env.TAILSCALE_IP || '100.109.158.92';
    const domain = process.env.DOMAIN || 'cbrnholdings.com';

    logger.info(`PlansiteOS server started`, {
      port: PORT,
      host: HOST,
      localIP,
      tailscaleIP,
      domain,
      env: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });

    console.log('\n🚀 PlansiteOS Server Started!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 API Access URLs:');
    console.log(`   Local:     http://localhost:${PORT}`);
    console.log(`   Network:   http://${localIP}:${PORT}`);
    console.log(`   Tailscale: http://${tailscaleIP}:${PORT}`);
    console.log(`   Domain:    https://${domain}`);
    console.log('');
    console.log('🔗 API Endpoints:');
    console.log(`   Health:    http://localhost:${PORT}/api/health`);
    console.log(`   API v1:    http://localhost:${PORT}/api/v1`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  });
}

module.exports = app;
