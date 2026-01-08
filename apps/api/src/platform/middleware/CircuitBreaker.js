const logger = require('../observability/logger');

/**
 * Circuit Breaker Pattern Implementation
 *
 * Protects against cascading failures by detecting when an external service
 * is failing and temporarily blocking requests to it.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are blocked
 * - HALF_OPEN: Testing if service has recovered
 *
 * @example
 * const breaker = new CircuitBreaker('twilio-api', {
 *   failureThreshold: 5,
 *   resetTimeout: 60000,
 *   monitoringPeriod: 120000
 * });
 *
 * const result = await breaker.execute(async () => {
 *   return await twilioClient.messages.create({...});
 * });
 */
class CircuitBreaker {
  /**
   * @param {string} name - Identifier for this circuit breaker
   * @param {Object} options - Configuration options
   * @param {number} options.failureThreshold - Number of failures before opening (default: 5)
   * @param {number} options.successThreshold - Number of successes in half-open to close (default: 2)
   * @param {number} options.resetTimeout - Time in ms before attempting reset (default: 60000)
   * @param {number} options.timeout - Request timeout in ms (default: 30000)
   * @param {number} options.monitoringPeriod - Rolling window for failure counting (default: 120000)
   * @param {Function} options.onStateChange - Callback when state changes
   * @param {Function} options.isFailure - Custom function to determine if error should count as failure
   */
  constructor(name, options = {}) {
    this.name = name;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    // Configuration
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.timeout = options.timeout || 30000; // 30 seconds
    this.monitoringPeriod = options.monitoringPeriod || 120000; // 2 minutes

    // Callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.isFailure = options.isFailure || this.defaultIsFailure.bind(this);

    // State tracking
    this.failures = [];
    this.successes = 0;
    this.nextAttemptTime = Date.now();

    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      timeouts: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      stateChanges: []
    };

    logger.info('Circuit breaker initialized', {
      name: this.name,
      config: {
        failureThreshold: this.failureThreshold,
        successThreshold: this.successThreshold,
        resetTimeout: this.resetTimeout,
        timeout: this.timeout
      }
    });
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @param {Object} context - Optional context for logging
   * @returns {Promise} Result of the function
   * @throws {CircuitBreakerError} If circuit is open or execution fails
   */
  async execute(fn, context = {}) {
    this.metrics.totalRequests++;

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        this.metrics.rejectedRequests++;

        logger.warn('Circuit breaker is OPEN, request rejected', {
          name: this.name,
          context: context,
          nextAttempt: new Date(this.nextAttemptTime).toISOString(),
          recentFailures: this.getRecentFailureCount()
        });

        throw new CircuitBreakerError(
          `Circuit breaker ${this.name} is OPEN`,
          'CIRCUIT_OPEN',
          this.name
        );
      }

      // Transition to half-open to test recovery
      this.transitionTo('HALF_OPEN');
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);

      // Record success
      this.onSuccess();

      return result;

    } catch (error) {
      // Determine if this error should trigger circuit breaker
      if (this.isFailure(error)) {
        this.onFailure(error, context);
      }

      throw error;
    }
  }

  /**
   * Execute function with timeout
   * @private
   */
  async executeWithTimeout(fn) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => {
          this.metrics.timeouts++;
          reject(new CircuitBreakerError(
            `Request timeout after ${this.timeout}ms`,
            'TIMEOUT',
            this.name
          ));
        }, this.timeout)
      )
    ]);
  }

  /**
   * Handle successful execution
   * @private
   */
  onSuccess() {
    this.metrics.successfulRequests++;
    this.metrics.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.successes++;

      logger.info('Circuit breaker success in HALF_OPEN', {
        name: this.name,
        successes: this.successes,
        threshold: this.successThreshold
      });

      if (this.successes >= this.successThreshold) {
        this.transitionTo('CLOSED');
      }
    } else if (this.state === 'CLOSED') {
      // Clean up old failures
      this.cleanupOldFailures();
    }
  }

  /**
   * Handle failed execution
   * @private
   */
  onFailure(error, context = {}) {
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = Date.now();

    const failure = {
      timestamp: Date.now(),
      error: error.message,
      code: error.code,
      context: context
    };

    this.failures.push(failure);

    logger.error('Circuit breaker recorded failure', {
      name: this.name,
      state: this.state,
      error: error.message,
      code: error.code,
      recentFailures: this.getRecentFailureCount(),
      context: context
    });

    if (this.state === 'HALF_OPEN') {
      // Any failure in half-open state reopens the circuit
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      // Clean up old failures
      this.cleanupOldFailures();

      // Check if we should open the circuit
      const recentFailures = this.getRecentFailureCount();

      if (recentFailures >= this.failureThreshold) {
        logger.warn('Failure threshold reached', {
          name: this.name,
          recentFailures: recentFailures,
          threshold: this.failureThreshold
        });

        this.transitionTo('OPEN');
      }
    }
  }

  /**
   * Transition to a new state
   * @private
   */
  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;

    const stateChange = {
      from: oldState,
      to: newState,
      timestamp: Date.now()
    };

    this.metrics.stateChanges.push(stateChange);

    logger.warn('Circuit breaker state changed', {
      name: this.name,
      from: oldState,
      to: newState,
      recentFailures: this.getRecentFailureCount()
    });

    // Handle state-specific logic
    if (newState === 'OPEN') {
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      this.successes = 0;

      logger.error('Circuit breaker OPENED', {
        name: this.name,
        nextAttempt: new Date(this.nextAttemptTime).toISOString(),
        resetTimeout: this.resetTimeout,
        recentFailures: this.getRecentFailureCount()
      });
    } else if (newState === 'CLOSED') {
      this.failures = [];
      this.successes = 0;

      logger.info('Circuit breaker CLOSED - service recovered', {
        name: this.name
      });
    } else if (newState === 'HALF_OPEN') {
      this.successes = 0;

      logger.info('Circuit breaker HALF_OPEN - testing service', {
        name: this.name
      });
    }

    // Call user callback
    try {
      this.onStateChange(oldState, newState, this);
    } catch (error) {
      logger.error('Circuit breaker state change callback failed', {
        name: this.name,
        error: error.message
      });
    }
  }

  /**
   * Clean up failures older than monitoring period
   * @private
   */
  cleanupOldFailures() {
    const cutoff = Date.now() - this.monitoringPeriod;
    this.failures = this.failures.filter(f => f.timestamp > cutoff);
  }

  /**
   * Get count of recent failures within monitoring period
   * @private
   */
  getRecentFailureCount() {
    this.cleanupOldFailures();
    return this.failures.length;
  }

  /**
   * Default function to determine if error should count as failure
   * @private
   */
  defaultIsFailure(error) {
    // Don't count validation errors or client errors as circuit breaker failures
    const ignoredCodes = [
      'VALIDATION_ERROR',
      'INVALID_INPUT',
      'INVALID_MESSAGE',
      'EMPTY_MESSAGE',
      'INVALID_TO_NUMBER',
      'INVALID_FROM_NUMBER'
    ];

    if (ignoredCodes.includes(error.code)) {
      return false;
    }

    // Count network errors, timeouts, and server errors
    return true;
  }

  /**
   * Manually reset the circuit breaker (use with caution)
   */
  reset() {
    logger.info('Circuit breaker manually reset', {
      name: this.name,
      previousState: this.state
    });

    this.transitionTo('CLOSED');
  }

  /**
   * Manually open the circuit breaker
   */
  open() {
    logger.warn('Circuit breaker manually opened', {
      name: this.name,
      previousState: this.state
    });

    this.transitionTo('OPEN');
  }

  /**
   * Get current status and metrics
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      isOpen: this.state === 'OPEN',
      nextAttemptTime: this.state === 'OPEN' ? new Date(this.nextAttemptTime).toISOString() : null,
      recentFailures: this.getRecentFailureCount(),
      config: {
        failureThreshold: this.failureThreshold,
        successThreshold: this.successThreshold,
        resetTimeout: this.resetTimeout,
        timeout: this.timeout,
        monitoringPeriod: this.monitoringPeriod
      },
      metrics: {
        ...this.metrics,
        successRate: this.metrics.totalRequests > 0
          ? ((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
          : 'N/A',
        failureRate: this.metrics.totalRequests > 0
          ? ((this.metrics.failedRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
          : 'N/A',
        rejectionRate: this.metrics.totalRequests > 0
          ? ((this.metrics.rejectedRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
          : 'N/A',
        recentStateChanges: this.metrics.stateChanges.slice(-5).map(sc => ({
          from: sc.from,
          to: sc.to,
          timestamp: new Date(sc.timestamp).toISOString()
        }))
      }
    };
  }

  /**
   * Get health check information
   */
  getHealth() {
    const status = this.getStatus();

    return {
      healthy: status.state === 'CLOSED',
      state: status.state,
      degraded: status.state === 'HALF_OPEN',
      down: status.state === 'OPEN',
      recentFailures: status.recentFailures,
      metrics: status.metrics
    };
  }
}

/**
 * Custom Circuit Breaker Error
 */
class CircuitBreakerError extends Error {
  constructor(message, code, breakerName) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.code = code;
    this.breakerName = breakerName;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      breakerName: this.breakerName,
      timestamp: this.timestamp
    };
  }
}

module.exports = CircuitBreaker;
module.exports.CircuitBreakerError = CircuitBreakerError;
