const { v4: uuidv4 } = require('uuid');
const { AsyncLocalStorage } = require('async_hooks');

/**
 * Correlation ID Manager
 *
 * Manages request correlation IDs for distributed tracing across
 * services, databases, and external APIs.
 *
 * Uses AsyncLocalStorage to maintain correlation context throughout
 * the async call chain without explicitly passing it everywhere.
 *
 * Features:
 * - Automatic ID generation
 * - Context propagation across async calls
 * - Thread-safe using AsyncLocalStorage
 * - Express middleware included
 * - Logger integration
 *
 * @example
 * // In Express app
 * app.use(CorrelationId.middleware());
 *
 * // Anywhere in the call chain
 * const corrId = CorrelationId.get();
 * logger.info('Processing request', { correlationId: corrId });
 */
class CorrelationId {
  constructor() {
    this.storage = new AsyncLocalStorage();
    this.headerName = 'x-correlation-id';
    this.requestCount = 0;
  }

  /**
   * Generate a new correlation ID
   * @returns {string} UUID v4
   */
  generate() {
    return uuidv4();
  }

  /**
   * Get the current correlation ID from async context
   * @returns {string|null} Correlation ID or null
   */
  get() {
    const store = this.storage.getStore();
    return store?.correlationId || null;
  }

  /**
   * Set correlation ID in async context
   * @param {string} id - Correlation ID
   */
  set(id) {
    const store = this.storage.getStore();
    if (store) {
      store.correlationId = id;
    }
  }

  /**
   * Run a function with a correlation ID context
   *
   * @param {string|null} id - Correlation ID (generates if not provided)
   * @param {Function} fn - Function to run
   * @returns {any} Result of function
   */
  run(id, fn) {
    const correlationId = id || this.generate();
    return this.storage.run({ correlationId }, fn);
  }

  /**
   * Express middleware to extract/generate correlation IDs
   *
   * @param {Object} options - Middleware options
   * @param {string} options.headerName - Header name for correlation ID
   * @param {boolean} options.generateIfMissing - Generate ID if not in request
   * @param {boolean} options.addToResponse - Add correlation ID to response headers
   * @returns {Function} Express middleware
   */
  middleware(options = {}) {
    const {
      headerName = this.headerName,
      generateIfMissing = true,
      addToResponse = true
    } = options;

    return (req, res, next) => {
      this.requestCount++;

      // Extract correlation ID from request header
      let correlationId = req.headers[headerName.toLowerCase()];

      // Generate if missing and configured to do so
      if (!correlationId && generateIfMissing) {
        correlationId = this.generate();
      }

      // Add to response headers if configured
      if (addToResponse && correlationId) {
        res.setHeader(headerName, correlationId);
      }

      // Attach to request object for easy access
      req.correlationId = correlationId;

      // Run the rest of the request in correlation context
      this.storage.run({ correlationId }, () => {
        next();
      });
    };
  }

  /**
   * Get all context data (for debugging)
   * @returns {Object|null} Current context
   */
  getContext() {
    return this.storage.getStore() || null;
  }

  /**
   * Add additional context data
   *
   * @param {string} key - Context key
   * @param {any} value - Context value
   */
  addContext(key, value) {
    const store = this.storage.getStore();
    if (store) {
      store[key] = value;
    }
  }

  /**
   * Get context value
   *
   * @param {string} key - Context key
   * @returns {any} Context value
   */
  getContextValue(key) {
    const store = this.storage.getStore();
    return store?.[key];
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      totalRequests: this.requestCount,
      headerName: this.headerName
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    this.requestCount = 0;
  }
}

// Singleton instance
const correlationId = new CorrelationId();

/**
 * Enhanced logger wrapper that automatically includes correlation ID
 */
class CorrelationLogger {
  constructor(baseLogger) {
    this.baseLogger = baseLogger;
  }

  /**
   * Add correlation ID to metadata
   * @private
   */
  _enrichMetadata(metadata = {}) {
    const corrId = correlationId.get();
    if (corrId) {
      return { ...metadata, correlationId: corrId };
    }
    return metadata;
  }

  info(message, metadata) {
    this.baseLogger.info(message, this._enrichMetadata(metadata));
  }

  error(message, metadata) {
    this.baseLogger.error(message, this._enrichMetadata(metadata));
  }

  warn(message, metadata) {
    this.baseLogger.warn(message, this._enrichMetadata(metadata));
  }

  debug(message, metadata) {
    this.baseLogger.debug(message, this._enrichMetadata(metadata));
  }

  // Proxy all other methods
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.baseLogger;
  }
}

/**
 * Wrap a logger to automatically include correlation IDs
 *
 * @param {Object} logger - Base logger instance
 * @returns {CorrelationLogger} Enhanced logger
 */
function wrapLogger(logger) {
  return new CorrelationLogger(logger);
}

/**
 * Utility to propagate correlation ID to external HTTP requests
 *
 * @example
 * const axios = require('axios');
 * const response = await axios.get('https://api.example.com', {
 *   headers: CorrelationId.getHeaders()
 * });
 */
function getHeaders(customHeaders = {}) {
  const corrId = correlationId.get();
  if (corrId) {
    return {
      ...customHeaders,
      [correlationId.headerName]: corrId
    };
  }
  return customHeaders;
}

/**
 * HOF to wrap async functions with correlation ID context
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 *
 * @example
 * const processLead = withCorrelationId(async (lead) => {
 *   // correlationId is available in context
 *   await saveLead(lead);
 * });
 */
function withCorrelationId(fn) {
  return async (...args) => {
    const corrId = correlationId.get() || correlationId.generate();
    return correlationId.run(corrId, () => fn(...args));
  };
}

/**
 * Decorator for class methods (experimental)
 *
 * @example
 * class MyService {
 *   @traced()
 *   async processData(data) {
 *     // correlationId automatically logged
 *   }
 * }
 */
function traced() {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const corrId = correlationId.get();
      const className = target.constructor.name;

      console.log(`[${corrId}] ${className}.${propertyKey} called`);

      const startTime = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        console.log(`[${corrId}] ${className}.${propertyKey} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[${corrId}] ${className}.${propertyKey} failed in ${duration}ms:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

module.exports = correlationId;
module.exports.CorrelationId = CorrelationId;
module.exports.wrapLogger = wrapLogger;
module.exports.getHeaders = getHeaders;
module.exports.withCorrelationId = withCorrelationId;
module.exports.traced = traced;
