const { Pool } = require('pg');
const logger = require('../observability/logger');

// Database configuration
const config = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  min: 2, // Minimum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if unable to connect
  allowExitOnIdle: false, // Keep pool alive even when idle
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Create connection pool
const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err, _client) => {
  logger.error('Unexpected error on idle client', {
    error: err.message,
    stack: err.stack
  });
  // Don't exit on idle client errors - let the pool recover
});

// Handle connection events
pool.on('connect', (client) => {
  logger.debug('New database client connected');
});

pool.on('acquire', (client) => {
  logger.debug('Database client acquired from pool');
});

pool.on('remove', (client) => {
  logger.debug('Database client removed from pool');
});

// Test connection on startup with retry
const testConnection = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await pool.query('SELECT NOW() as now, current_database() as db, current_user as user');
      logger.info('Database connected successfully', {
        database: res.rows[0].db,
        user: res.rows[0].user,
        timestamp: res.rows[0].now,
        poolSize: pool.totalCount,
        attemptNumber: i + 1
      });
      return true;
    } catch (err) {
      logger.error(`Database connection attempt ${i + 1}/${retries} failed`, {
        error: err.message,
        config: {
          database: process.env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'Not configured',
          host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'
        }
      });

      if (i < retries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff, max 10s
        logger.info(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        logger.error('All database connection attempts failed. Application may not function correctly.');
      }
    }
  }
  return false;
};

// Run connection test
testConnection();

// Query with retry logic for transient errors
const queryWithRetry = async (text, params, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      // Check if error is transient (connection issues, timeouts)
      const isTransient = err.code === 'ECONNRESET' ||
                          err.code === 'ECONNREFUSED' ||
                          err.code === '57P01' || // admin_shutdown
                          err.code === '57P02' || // crash_shutdown
                          err.code === '57P03';   // cannot_connect_now

      if (isTransient && i < retries - 1) {
        const waitTime = Math.min(100 * Math.pow(2, i), 2000); // Exponential backoff, max 2s
        logger.warn(`Query failed with transient error, retrying in ${waitTime}ms...`, {
          error: err.message,
          code: err.code,
          attempt: i + 1
        });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw err;
      }
    }
  }
};

// Export pool with helper methods
module.exports = {
  // Execute a single query
  query: (text, params) => pool.query(text, params),

  // Execute query with automatic retry for transient errors
  queryWithRetry,

  // Get a client from the pool (for transactions)
  getClient: () => pool.connect(),

  // Execute a query with a client
  queryWithClient: async (client, text, params) => {
    return client.query(text, params);
  },

  // Get pool instance
  getPool: () => pool,

  // Health check
  async healthCheck() {
    try {
      const result = await pool.query('SELECT 1 as healthy, NOW() as timestamp');
      return {
        healthy: true,
        timestamp: result.rows[0].timestamp,
        poolSize: pool.totalCount,
        idleConnections: pool.idleCount,
        waitingClients: pool.waitingCount
      };
    } catch (err) {
      logger.error('Database health check failed', { error: err.message });
      return {
        healthy: false,
        error: err.message
      };
    }
  },

  // Get pool stats
  getPoolStats() {
    return {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
  },

  // End pool (for graceful shutdown)
  end: () => pool.end()
};
