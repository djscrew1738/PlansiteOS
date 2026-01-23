require('dotenv').config({ path: '../../../.env' });

const app = require('./app');
const logger = require('./platform/observability/logger');

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info('PipelineOS API server started', {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    tailscaleIp: process.env.TAILSCALE_IP,
    domain: process.env.DOMAIN,
  });

  console.log('\n🚀 PipelineOS API Server');
  console.log(`   Local:     http://localhost:${PORT}`);
  if (process.env.TAILSCALE_IP) {
    console.log(`   Tailscale: http://${process.env.TAILSCALE_IP}:${PORT}`);
  }
  if (process.env.DOMAIN) {
    console.log(`   Domain:    https://${process.env.DOMAIN}`);
  }
  console.log('');
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  server.close(async () => {
    logger.info('HTTP server closed');

    // Close database connections
    const db = require('./platform/config/database');
    await db.end();
    logger.info('Database connections closed');

    process.exit(0);
  });

  // Force close after 30s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});
