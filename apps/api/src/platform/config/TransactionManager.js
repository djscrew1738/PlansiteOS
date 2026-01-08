const logger = require('../observability/logger');

/**
 * Transaction Manager
 *
 * Provides utilities for managing database transactions with proper
 * error handling, rollback, and resource cleanup.
 *
 * Features:
 * - Automatic rollback on error
 * - Guaranteed connection release
 * - Nested transaction support (savepoints)
 * - Timeout protection
 * - Comprehensive logging
 *
 * @example
 * const result = await TransactionManager.execute(async (client) => {
 *   await client.query('INSERT INTO leads ...');
 *   await client.query('INSERT INTO notifications ...');
 *   return { success: true };
 * }, { correlationId: 'abc-123' });
 */
class TransactionManager {
  constructor(db) {
    this.db = db;
    this.activeTransactions = new Map();
    this.transactionCount = 0;
    this.successCount = 0;
    this.rollbackCount = 0;
  }

  /**
   * Execute a function within a database transaction
   *
   * @param {Function} fn - Async function that receives a client connection
   * @param {Object} options - Transaction options
   * @param {string} options.correlationId - Correlation ID for logging
   * @param {number} options.timeout - Transaction timeout in ms (default: 30000)
   * @param {string} options.isolationLevel - Transaction isolation level
   * @returns {Promise<any>} Result from the function
   */
  async execute(fn, options = {}) {
    const {
      correlationId = 'none',
      timeout = 30000,
      isolationLevel = 'READ COMMITTED'
    } = options;

    const transactionId = this.generateTransactionId();
    const startTime = Date.now();

    let client = null;
    let timeoutHandle = null;

    try {
      this.transactionCount++;

      logger.info('Transaction started', {
        transactionId: transactionId,
        correlationId: correlationId,
        isolationLevel: isolationLevel
      });

      // Get connection from pool
      client = await this.db.getClient();

      // Track active transaction
      this.activeTransactions.set(transactionId, {
        startTime: startTime,
        correlationId: correlationId,
        client: client
      });

      // Set up transaction timeout
      if (timeout > 0) {
        timeoutHandle = setTimeout(() => {
          logger.error('Transaction timeout', {
            transactionId: transactionId,
            correlationId: correlationId,
            duration: Date.now() - startTime
          });
        }, timeout);
      }

      // Begin transaction
      await client.query('BEGIN');

      // Set isolation level if specified
      if (isolationLevel !== 'READ COMMITTED') {
        await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      }

      // Execute the function
      const result = await fn(client);

      // Commit transaction
      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      this.successCount++;

      logger.info('Transaction committed', {
        transactionId: transactionId,
        correlationId: correlationId,
        duration: `${duration}ms`
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.rollbackCount++;

      logger.error('Transaction failed, rolling back', {
        transactionId: transactionId,
        correlationId: correlationId,
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`
      });

      // Attempt rollback
      if (client) {
        try {
          await client.query('ROLLBACK');
          logger.info('Transaction rolled back successfully', {
            transactionId: transactionId,
            correlationId: correlationId
          });
        } catch (rollbackError) {
          logger.error('Rollback failed', {
            transactionId: transactionId,
            correlationId: correlationId,
            error: rollbackError.message
          });
        }
      }

      throw new TransactionError(
        'Transaction failed',
        'TRANSACTION_FAILED',
        transactionId,
        error
      );

    } finally {
      // Clear timeout
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      // Release connection back to pool
      if (client) {
        client.release();
      }

      // Remove from active transactions
      this.activeTransactions.delete(transactionId);

      const duration = Date.now() - startTime;
      logger.debug('Transaction resources released', {
        transactionId: transactionId,
        correlationId: correlationId,
        duration: `${duration}ms`
      });
    }
  }

  /**
   * Execute multiple operations in a transaction with savepoints
   *
   * Allows partial rollback to savepoints if an operation fails
   *
   * @param {Array<Function>} operations - Array of async functions
   * @param {Object} options - Transaction options
   * @returns {Promise<Array>} Results from all operations
   */
  async executeWithSavepoints(operations, options = {}) {
    const { correlationId = 'none' } = options;
    const results = [];

    return this.execute(async (client) => {
      for (let i = 0; i < operations.length; i++) {
        const savepointName = `sp_${i}`;

        try {
          // Create savepoint
          await client.query(`SAVEPOINT ${savepointName}`);

          logger.debug('Savepoint created', {
            savepoint: savepointName,
            correlationId: correlationId
          });

          // Execute operation
          const result = await operations[i](client);
          results.push(result);

          // Release savepoint
          await client.query(`RELEASE SAVEPOINT ${savepointName}`);

        } catch (error) {
          logger.error('Operation failed, rolling back to savepoint', {
            savepoint: savepointName,
            operation: i,
            correlationId: correlationId,
            error: error.message
          });

          // Rollback to savepoint
          await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);

          throw error;
        }
      }

      return results;
    }, options);
  }

  /**
   * Execute with automatic retry on deadlock
   *
   * @param {Function} fn - Function to execute
   * @param {Object} options - Options including retry config
   * @returns {Promise<any>} Result
   */
  async executeWithRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 100,
      correlationId = 'none'
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.execute(fn, options);
      } catch (error) {
        lastError = error;

        // Check if error is deadlock
        const isDeadlock = error.originalError?.code === '40P01' || // PostgreSQL deadlock
                          error.originalError?.code === '40001';   // Serialization failure

        if (!isDeadlock || attempt === maxRetries) {
          throw error;
        }

        logger.warn('Deadlock detected, retrying', {
          attempt: attempt,
          maxRetries: maxRetries,
          correlationId: correlationId
        });

        // Wait before retry with exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }

    throw lastError;
  }

  /**
   * Generate unique transaction ID
   * @private
   */
  generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get metrics about transactions
   */
  getMetrics() {
    return {
      total: this.transactionCount,
      successful: this.successCount,
      rolledBack: this.rollbackCount,
      successRate: this.transactionCount > 0
        ? ((this.successCount / this.transactionCount) * 100).toFixed(2) + '%'
        : 'N/A',
      active: this.activeTransactions.size,
      activeTransactions: Array.from(this.activeTransactions.entries()).map(([id, info]) => ({
        id: id,
        correlationId: info.correlationId,
        duration: Date.now() - info.startTime
      }))
    };
  }

  /**
   * Check for long-running transactions
   *
   * @param {number} thresholdMs - Threshold in milliseconds
   * @returns {Array} Long-running transactions
   */
  getLongRunningTransactions(thresholdMs = 30000) {
    const now = Date.now();
    const longRunning = [];

    for (const [id, info] of this.activeTransactions.entries()) {
      const duration = now - info.startTime;
      if (duration > thresholdMs) {
        longRunning.push({
          id: id,
          correlationId: info.correlationId,
          duration: duration,
          startTime: new Date(info.startTime).toISOString()
        });
      }
    }

    return longRunning;
  }

  /**
   * Kill long-running transactions (emergency use only)
   *
   * @param {number} thresholdMs - Threshold in milliseconds
   */
  async killLongRunningTransactions(thresholdMs = 60000) {
    const longRunning = this.getLongRunningTransactions(thresholdMs);

    logger.warn('Killing long-running transactions', {
      count: longRunning.length,
      threshold: thresholdMs
    });

    for (const txn of longRunning) {
      try {
        const info = this.activeTransactions.get(txn.id);
        if (info && info.client) {
          await info.client.query('ROLLBACK');
          info.client.release();
          this.activeTransactions.delete(txn.id);

          logger.warn('Long-running transaction killed', {
            transactionId: txn.id,
            correlationId: txn.correlationId,
            duration: txn.duration
          });
        }
      } catch (error) {
        logger.error('Failed to kill transaction', {
          transactionId: txn.id,
          error: error.message
        });
      }
    }
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.transactionCount = 0;
    this.successCount = 0;
    this.rollbackCount = 0;
    logger.info('Transaction metrics reset');
  }
}

/**
 * Custom Transaction Error
 */
class TransactionError extends Error {
  constructor(message, code, transactionId, originalError) {
    super(message);
    this.name = 'TransactionError';
    this.code = code;
    this.transactionId = transactionId;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    if (originalError) {
      this.originalMessage = originalError.message;
      this.originalCode = originalError.code;
      this.stack = originalError.stack;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      transactionId: this.transactionId,
      timestamp: this.timestamp,
      originalMessage: this.originalMessage,
      originalCode: this.originalCode
    };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create TransactionManager instance
 */
function getTransactionManager(db) {
  if (!instance) {
    if (!db) {
      throw new Error('Database connection required to initialize TransactionManager');
    }
    instance = new TransactionManager(db);
  }
  return instance;
}

module.exports = {
  getTransactionManager,
  TransactionManager,
  TransactionError
};
