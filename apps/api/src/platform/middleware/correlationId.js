/**
 * Correlation ID Middleware
 *
 * Express middleware for handling correlation IDs across requests.
 * Automatically extracts, generates, and propagates correlation IDs.
 *
 * Usage:
 *   const { correlationIdMiddleware } = require('./middleware/correlationId');
 *   app.use(correlationIdMiddleware());
 */

const correlationId = require('../observability/CorrelationId');
const logger = require('../observability/logger');

/**
 * Main correlation ID middleware
 *
 * @param {Object} options - Configuration options
 * @param {string} options.headerName - Header name for correlation ID (default: 'x-correlation-id')
 * @param {boolean} options.generateIfMissing - Generate ID if not present (default: true)
 * @param {boolean} options.addToResponse - Add correlation ID to response headers (default: true)
 * @param {boolean} options.logRequests - Log all requests with correlation ID (default: true)
 * @returns {Function} Express middleware
 */
function correlationIdMiddleware(options = {}) {
  const {
    headerName = 'x-correlation-id',
    generateIfMissing = true,
    addToResponse = true,
    logRequests = true
  } = options;

  return (req, res, next) => {
    // Extract correlation ID from request header
    let corrId = req.headers[headerName.toLowerCase()];

    // Generate if missing and configured to do so
    if (!corrId && generateIfMissing) {
      corrId = correlationId.generate();
    }

    // Add to response headers if configured
    if (addToResponse && corrId) {
      res.setHeader(headerName, corrId);
    }

    // Attach to request object for easy access
    req.correlationId = corrId;

    // Log incoming request
    if (logRequests && corrId) {
      logger.info('Incoming request', {
        correlationId: corrId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    }

    // Run the rest of the request in correlation context
    correlationId.run(corrId, () => {
      next();
    });
  };
}

/**
 * Response logging middleware
 *
 * Logs response details with correlation ID
 */
function responseLoggingMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    // Capture original res.json
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      const duration = Date.now() - startTime;

      logger.info('Response sent', {
        correlationId: req.correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });

      return originalJson(data);
    };

    next();
  };
}

/**
 * Error handling middleware with correlation ID
 *
 * Captures errors and includes correlation ID in response
 */
function errorHandlingMiddleware() {
  return (err, req, res, next) => {
    const corrId = req.correlationId || 'unknown';

    logger.error('Request error', {
      correlationId: corrId,
      method: req.method,
      path: req.path,
      error: err.message,
      stack: err.stack,
      statusCode: err.statusCode || 500
    });

    // Send error response with correlation ID
    res.status(err.statusCode || 500).json({
      error: {
        message: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        correlationId: corrId,
        timestamp: new Date().toISOString()
      }
    });
  };
}

/**
 * Middleware to add correlation context to request
 *
 * Adds additional context information that will be available
 * throughout the request lifecycle
 */
function contextMiddleware(getContext) {
  return (req, res, next) => {
    if (typeof getContext === 'function') {
      const context = getContext(req);

      // Add each context value
      Object.entries(context).forEach(([key, value]) => {
        correlationId.addContext(key, value);
      });
    }

    next();
  };
}

/**
 * Health check endpoint that doesn't need correlation ID
 *
 * Bypasses correlation ID middleware for performance
 */
function skipCorrelationId(req, res, next) {
  next();
}

module.exports = {
  correlationIdMiddleware,
  responseLoggingMiddleware,
  errorHandlingMiddleware,
  contextMiddleware,
  skipCorrelationId
};
