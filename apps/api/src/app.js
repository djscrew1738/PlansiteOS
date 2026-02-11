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
const DEFAULT_TAILSCALE_IP = process.env.TAILSCALE_IP || '100.115.136.62';
const DEFAULT_MAGICDNS_DOMAIN = process.env.MAGICDNS_DOMAIN || 'acer-ai.taildf2809.ts.net';

function parseCsv(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

// CORS Configuration
app.use((req, res, next) => {
  const configuredCorsOrigins = parseCsv(process.env.CORS_ORIGIN);
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5001',
    'http://localhost:8090',
    `http://${DEFAULT_TAILSCALE_IP}`,
    `http://${DEFAULT_TAILSCALE_IP}:8099`,
    `http://${DEFAULT_MAGICDNS_DOMAIN}`,
    `http://${DEFAULT_MAGICDNS_DOMAIN}:8099`,
    `https://${DEFAULT_MAGICDNS_DOMAIN}`,
    process.env.DOMAIN ? `https://${process.env.DOMAIN}` : null,
    'http://100.109.158.92:8099',
    'https://ctlplumbingllc.com',
    'https://www.ctlplumbingllc.com',
    'https://app.ctlplumbingllc.com',
    process.env.DOMAIN_URL,
    ...configuredCorsOrigins
  ].filter(Boolean));

  const origin = req.headers.origin;

  // Allow all localhost origins in development
  const isLocalhost = origin && origin.match(/^https?:\/\/localhost:\d+$/);
  const isAllowed = allowedOrigins.has(origin) || isLocalhost;

  if (isAllowed || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-correlation-id');
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
const statusRoutes = require('./routes/status.routes');
const v1Routes = require('./routes/v1');

app.use('/api/health', healthRoutes);
app.use('/api/status', statusRoutes);
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
  const displayDomain = process.env.DOMAIN || DEFAULT_MAGICDNS_DOMAIN;

  app.listen(PORT, HOST, () => {
    logger.info(`PipelineOS server started`, {
      port: PORT,
      host: HOST,
      tailscaleIp: DEFAULT_TAILSCALE_IP,
      magicDnsDomain: DEFAULT_MAGICDNS_DOMAIN,
      domain: displayDomain,
      env: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });

    console.log('\n🚀 Server Access URLs:');
    console.log(`   Local:     http://localhost:${PORT}`);
    console.log(`   Tailscale: http://${DEFAULT_TAILSCALE_IP}:${PORT}`);
    console.log(`   MagicDNS:  http://${DEFAULT_MAGICDNS_DOMAIN}:${process.env.CADDY_PORT || '8099'}`);
    console.log(`   Domain:    https://${displayDomain}`);
    console.log('');
  });
}

module.exports = app;
