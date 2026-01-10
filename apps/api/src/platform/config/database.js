const { Pool } = require('pg');
const logger = require('../observability/logger');

// Database configuration
const config = {
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if unable to connect
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
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed', {
      error: err.message,
      config: {
        database: process.env.DATABASE_URL?.split('@')[1] || 'Not configured'
      }
    });
  } else {
    logger.info('Database connected successfully', {
      timestamp: res.rows[0].now
    });
  }
});

// Export pool with helper methods
module.exports = {
  // Execute a single query
  query: (text, params) => pool.query(text, params),

  // Get a client from the pool (for transactions)
  getClient: () => pool.connect(),

  // Execute a query with a client
  queryWithClient: async (client, text, params) => {
    return client.query(text, params);
  },

  // Get pool instance
  getPool: () => pool,

  // End pool (for graceful shutdown)
  end: () => pool.end()
};
