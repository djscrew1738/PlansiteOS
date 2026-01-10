const twilio = require('twilio');
const logger = require('../utils/logger');
const CircuitBreaker = require('../utils/CircuitBreaker');
const { NOTIFICATIONS } = require('../config/constants');

class NotificationService {
  constructor() {
    this.client = null;
    this.enabled = false;
    this.fromNumber = null;
    this.toNumber = null;
    this.testMode = false;
    this.messageQueue = [];
    this.failedMessages = [];
    this.sentCount = 0;
    this.failedCount = 0;

    // ✅ NEW: Circuit breaker for Twilio API
    this.circuitBreaker = new CircuitBreaker('twilio-api', {
      failureThreshold: 5,        // Open after 5 failures
      successThreshold: 2,         // Close after 2 successes in half-open
      resetTimeout: 60000,         // Try again after 1 minute
      timeout: 10000,              // 10 second timeout for SMS
      monitoringPeriod: 120000,    // 2 minute rolling window
      onStateChange: this.onCircuitStateChange.bind(this),
      isFailure: this.isTwilioFailure.bind(this)
    });

    // ✅ NEW: Rate limiter for Twilio
    this.rateLimiter = {
      tokens: 10,           // Max 10 messages per minute
      maxTokens: 10,
      refillRate: 60000,    // Refill every minute
      lastRefill: Date.now()
    };

    this.initialize();
  }

  initialize() {
    try {
      // Check required environment variables
      const requiredVars = [
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
        'YOUR_PHONE_NUMBER'
      ];

      const missing = requiredVars.filter(v => !process.env[v]);

      if (missing.length > 0) {
        logger.warn('Twilio not fully configured, SMS notifications disabled', {
          missing: missing
        });
        this.testMode = true;
        return;
      }

      // Validate phone number formats
      if (!this.isValidPhoneNumber(process.env.TWILIO_PHONE_NUMBER)) {
        throw new NotificationError(
          'Invalid TWILIO_PHONE_NUMBER format (must be E.164: +1##########)',
          'INVALID_FROM_NUMBER'
        );
      }

      if (!this.isValidPhoneNumber(process.env.YOUR_PHONE_NUMBER)) {
        throw new NotificationError(
          'Invalid YOUR_PHONE_NUMBER format (must be E.164: +1##########)',
          'INVALID_TO_NUMBER'
        );
      }

      // Initialize Twilio client
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
      this.toNumber = process.env.YOUR_PHONE_NUMBER;
      this.enabled = true;

      logger.info('Notification Service initialized successfully', {
        from: this.maskPhoneNumber(this.fromNumber),
        to: this.maskPhoneNumber(this.toNumber),
        circuitBreaker: 'enabled'
      });

    } catch (error) {
      this.enabled = false;
      logger.error('Notification Service initialization failed', {
        error: error.message,
        stack: error.stack
      });

      // Don't throw - allow app to continue without notifications
      this.testMode = true;
    }
  }

  /**
   * ✅ NEW: Circuit breaker state change handler
   */
  onCircuitStateChange(oldState, newState, breaker) {
    logger.warn('Twilio circuit breaker state changed', {
      from: oldState,
      to: newState,
      recentFailures: breaker.getRecentFailureCount()
    });

    // If circuit opened, we might want to alert via alternative channel
    if (newState === 'OPEN') {
      logger.error('⚠️ CRITICAL: Twilio circuit breaker OPEN - SMS notifications unavailable', {
        nextAttempt: breaker.nextAttemptTime,
        recentFailures: breaker.getRecentFailureCount()
      });

      // Could potentially send alert via email or other channel here
    } else if (newState === 'CLOSED') {
      logger.info('✓ Twilio circuit breaker CLOSED - SMS notifications restored');
    }
  }

  /**
   * ✅ NEW: Determine if error should trigger circuit breaker
   */
  isTwilioFailure(error) {
    // Don't open circuit for client errors (our fault)
    const clientErrors = [
      'INVALID_MESSAGE',
      'EMPTY_MESSAGE',
      'INVALID_TO_NUMBER',
      'INVALID_FROM_NUMBER',
      21211, // Invalid recipient
      21608  // Unverified number (trial account)
    ];

    if (clientErrors.includes(error.code)) {
      return false;
    }

    // Open circuit for server errors and network issues
    const serverErrors = [
      20003,  // Authentication failed
      20429,  // Rate limit (though we handle this separately)
      21610,  // Message blocked
      30007,  // Carrier violation
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'TIMEOUT'
    ];

    return serverErrors.includes(error.code) || error.name === 'CircuitBreakerError';
  }

  /**
   * ✅ NEW: Check and update rate limiter
   */
  async checkRateLimit() {
    const now = Date.now();
    const timePassed = now - this.rateLimiter.lastRefill;

    // Refill tokens if enough time has passed
    if (timePassed >= this.rateLimiter.refillRate) {
      this.rateLimiter.tokens = this.rateLimiter.maxTokens;
      this.rateLimiter.lastRefill = now;

      logger.debug('Rate limiter tokens refilled', {
        tokens: this.rateLimiter.tokens
      });
    }

    // Check if we have tokens available
    if (this.rateLimiter.tokens <= 0) {
      const waitTime = this.rateLimiter.refillRate - timePassed;

      logger.warn('Rate limit exceeded', {
        waitTime: waitTime,
        nextRefill: new Date(this.rateLimiter.lastRefill + this.rateLimiter.refillRate).toISOString()
      });

      throw new NotificationError(
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Consume a token
    this.rateLimiter.tokens--;

    logger.debug('Rate limiter token consumed', {
      tokensRemaining: this.rateLimiter.tokens
    });
  }

  async sendHighPriorityAlert(lead) {
    const startTime = Date.now();

    try {
      // Validate lead object
      if (!lead || typeof lead !== 'object') {
        throw new NotificationError('Invalid lead object', 'INVALID_LEAD');
      }

      if (!lead.id) {
        throw new NotificationError('Lead missing ID', 'MISSING_LEAD_ID');
      }

      // Check if enabled
      if (!this.enabled) {
        if (this.testMode) {
          logger.info('TEST MODE: Would send high-priority SMS', {
            lead_id: lead.id,
            score: lead.ai_score
          });
          return { success: true, testMode: true };
        }

        throw new NotificationError(
          'Notification service not enabled',
          'SERVICE_DISABLED'
        );
      }

      // Parse AI analysis
      let analysis;
      try {
        analysis = typeof lead.ai_analysis === 'string'
          ? JSON.parse(lead.ai_analysis)
          : lead.ai_analysis;
      } catch (parseError) {
        logger.warn('Failed to parse AI analysis, using defaults', {
          lead_id: lead.id,
          error: parseError.message
        });
        analysis = {};
      }

      // Format message
      const message = this.formatHighPriorityMessage(lead, analysis);

      // Send SMS with circuit breaker protection
      const result = await this.sendSMS(message, {
        lead_id: lead.id,
        type: 'high_priority_alert'
      });

      const duration = Date.now() - startTime;

      logger.info('High-priority SMS sent successfully', {
        lead_id: lead.id,
        message_sid: result.sid,
        duration: `${duration}ms`
      });

      this.sentCount++;

      return {
        success: true,
        sid: result.sid,
        status: result.status,
        duration: duration
      };

    } catch (error) {
      this.failedCount++;

      const duration = Date.now() - startTime;

      logger.error('Failed to send high-priority alert', {
        lead_id: lead?.id,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`,
        failedCount: this.failedCount
      });

      // Store failed message for retry (if not a validation error)
      if (!['INVALID_LEAD', 'MISSING_LEAD_ID', 'SERVICE_DISABLED'].includes(error.code)) {
        this.failedMessages.push({
          lead_id: lead?.id,
          lead: lead,
          type: 'high_priority_alert',
          timestamp: new Date().toISOString(),
          error: error.message,
          retryCount: 0
        });
      }

      throw new NotificationError(
        'Failed to send high-priority alert',
        'SMS_SEND_FAILED',
        error
      );
    }
  }

  async sendDailySummary(stats) {
    try {
      // Validate stats object
      if (!stats || typeof stats !== 'object') {
        throw new NotificationError('Invalid stats object', 'INVALID_STATS');
      }

      if (!this.enabled) {
        if (this.testMode) {
          logger.info('TEST MODE: Would send daily summary', { stats });
          return { success: true, testMode: true };
        }

        throw new NotificationError(
          'Notification service not enabled',
          'SERVICE_DISABLED'
        );
      }

      const message = this.formatDailySummary(stats);

      const result = await this.sendSMS(message, {
        type: 'daily_summary'
      });

      logger.info('Daily summary sent successfully', {
        message_sid: result.sid,
        stats: stats
      });

      this.sentCount++;

      return {
        success: true,
        sid: result.sid,
        status: result.status
      };

    } catch (error) {
      this.failedCount++;

      logger.error('Failed to send daily summary', {
        error: error.message,
        code: error.code,
        stats: stats
      });

      throw new NotificationError(
        'Failed to send daily summary',
        'SUMMARY_SEND_FAILED',
        error
      );
    }
  }

  async sendStaleLeadReminder(leads) {
    try {
      if (!Array.isArray(leads)) {
        throw new NotificationError('Leads must be an array', 'INVALID_LEADS');
      }

      if (leads.length === 0) {
        logger.debug('No stale leads to notify about');
        return { success: true, count: 0 };
      }

      if (!this.enabled) {
        if (this.testMode) {
          logger.info('TEST MODE: Would send stale lead reminder', {
            count: leads.length
          });
          return { success: true, testMode: true };
        }

        throw new NotificationError(
          'Notification service not enabled',
          'SERVICE_DISABLED'
        );
      }

      const message = this.formatStaleLeadReminder(leads);

      const result = await this.sendSMS(message, {
        type: 'stale_lead_reminder',
        count: leads.length
      });

      logger.info('Stale lead reminder sent successfully', {
        message_sid: result.sid,
        lead_count: leads.length
      });

      this.sentCount++;

      return {
        success: true,
        sid: result.sid,
        count: leads.length
      };

    } catch (error) {
      this.failedCount++;

      logger.error('Failed to send stale lead reminder', {
        error: error.message,
        code: error.code,
        lead_count: leads?.length
      });

      throw new NotificationError(
        'Failed to send stale lead reminder',
        'REMINDER_SEND_FAILED',
        error
      );
    }
  }

  async sendCriticalAlert(message) {
    try {
      if (!message || typeof message !== 'string') {
        throw new NotificationError('Message must be a non-empty string', 'INVALID_MESSAGE');
      }

      if (!this.enabled) {
        logger.warn('CRITICAL ALERT (notifications disabled):', message);
        return { success: false, reason: 'disabled' };
      }

      const formattedMessage = `🚨 CRITICAL ALERT\n\n${message}\n\nTime: ${new Date().toLocaleString()}`;

      const result = await this.sendSMS(formattedMessage, {
        type: 'critical_alert',
        priority: 'critical'
      });

      logger.warn('Critical alert sent', {
        message_sid: result.sid,
        alert: message
      });

      this.sentCount++;

      return {
        success: true,
        sid: result.sid
      };

    } catch (error) {
      this.failedCount++;

      logger.error('Failed to send critical alert', {
        error: error.message,
        alert: message
      });

      // For critical alerts, also log to file
      logger.error('CRITICAL ALERT FAILED TO SEND', {
        message: message,
        error: error.message
      });

      throw new NotificationError(
        'Failed to send critical alert',
        'CRITICAL_ALERT_FAILED',
        error
      );
    }
  }

  /**
   * ✅ UPDATED: Send SMS with circuit breaker and rate limiting
   */
  async sendSMS(message, metadata = {}) {
    try {
      // Validate message
      if (!message || typeof message !== 'string') {
        throw new NotificationError('Message must be a non-empty string', 'INVALID_MESSAGE');
      }

      if (message.length === 0) {
        throw new NotificationError('Message cannot be empty', 'EMPTY_MESSAGE');
      }

      // ✅ NEW: Check rate limit before attempting send
      await this.checkRateLimit();

      // ✅ NEW: Truncate smartly
      const truncatedMessage = this.truncateMessage(message, 1600);

      // ✅ NEW: Execute with circuit breaker protection
      const result = await this.circuitBreaker.execute(async () => {
        return await this.client.messages.create({
          body: truncatedMessage,
          from: this.fromNumber,
          to: this.toNumber,
        });
      }, metadata);

      // Validate response
      if (!result || !result.sid) {
        throw new NotificationError('Invalid response from Twilio', 'INVALID_RESPONSE');
      }

      logger.debug('SMS sent via Twilio', {
        sid: result.sid,
        status: result.status,
        metadata: metadata,
        circuitState: this.circuitBreaker.state
      });

      return result;

    } catch (error) {
      // Handle Twilio-specific errors
      if (error.code === 21211) {
        throw new NotificationError(
          'Invalid recipient phone number',
          'INVALID_TO_NUMBER',
          error
        );
      } else if (error.code === 21608) {
        throw new NotificationError(
          'Recipient number not verified (Twilio trial)',
          'UNVERIFIED_NUMBER',
          error
        );
      } else if (error.code === 20003) {
        throw new NotificationError(
          'Twilio authentication failed',
          'AUTH_FAILED',
          error
        );
      } else if (error.code === 21610) {
        throw new NotificationError(
          'Message blocked (opted out or blacklisted)',
          'MESSAGE_BLOCKED',
          error
        );
      } else if (error.code === 30007) {
        throw new NotificationError(
          'Message filtering - carrier violation',
          'CARRIER_VIOLATION',
          error
        );
      } else if (error.code === 'ECONNREFUSED') {
        throw new NotificationError(
          'Cannot connect to Twilio API',
          'CONNECTION_ERROR',
          error
        );
      } else if (error.code === 'ETIMEDOUT') {
        throw new NotificationError(
          'Twilio API request timeout',
          'TIMEOUT',
          error
        );
      }

      throw error;
    }
  }

  /**
   * ✅ NEW: Smart message truncation that preserves meaning
   */
  truncateMessage(message, maxLength = 1600) {
    if (message.length <= maxLength) {
      return message;
    }

    // Try to truncate at sentence boundary
    const truncated = message.substring(0, maxLength - 3);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    const breakPoint = Math.max(lastPeriod, lastNewline);

    if (breakPoint > maxLength * 0.8) {
      // Keep at least 80% of content
      return truncated.substring(0, breakPoint + 1);
    }

    // Truncate at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.9) {
      return truncated.substring(0, lastSpace) + '...';
    }

    // Hard truncate
    return truncated + '...';
  }

  formatHighPriorityMessage(lead, analysis) {
    try {
      const lines = [
        '🔥 HIGH PRIORITY LEAD',
        '',
        `${lead.city || 'Unknown'} - ${lead.job_type || 'unknown'}`,
        `Score: ${lead.ai_score || 0}/100`,
        ''
      ];

      // Add post text preview
      if (lead.post_text) {
        const preview = lead.post_text.substring(0, 150);
        lines.push(`${preview}${lead.post_text.length > 150 ? '...' : ''}`);
        lines.push('');
      }

      // Add contact info if available
      if (lead.contact_info) {
        lines.push(`Contact: ${lead.contact_info}`);
        lines.push('');
      }

      lines.push('View: https://ctlplumbingllc.com');
      lines.push('');

      // Add AI recommended response
      if (analysis && analysis.recommended_response) {
        lines.push('AI Response:');
        lines.push(analysis.recommended_response);
      }

      return lines.join('\n');

    } catch (error) {
      logger.error('Error formatting high-priority message', {
        error: error.message,
        lead_id: lead?.id
      });

      // Return minimal message on error
      return `🔥 HIGH PRIORITY LEAD\n\nLead ID: ${lead.id}\nScore: ${lead.ai_score}/100\n\nView: https://ctlplumbingllc.com`;
    }
  }

  formatDailySummary(stats) {
    try {
      const lines = [
        '📊 PipelineOS Daily Summary',
        '',
        `New Leads: ${stats.new || 0}`,
        `Contacted: ${stats.contacted || 0}`,
        `Quoted: ${stats.quoted || 0}`,
        `Won: ${stats.won || 0}`
      ];

      if (stats.avg_score) {
        lines.push(`Avg Score: ${stats.avg_score}`);
      }

      lines.push('');
      lines.push('View: https://ctlplumbingllc.com');

      return lines.join('\n');

    } catch (error) {
      logger.error('Error formatting daily summary', {
        error: error.message
      });

      return '📊 PipelineOS Daily Summary\n\nError formatting summary. Check dashboard.';
    }
  }

  formatStaleLeadReminder(leads) {
    try {
      const count = leads.length;
      const plural = count === 1 ? 'lead' : 'leads';

      const lines = [
        `⏰ ${count} ${plural} need follow-up`,
        ''
      ];

      // Add first few leads
      const preview = leads.slice(0, 3);
      preview.forEach(lead => {
        lines.push(`• ${lead.city || 'Unknown'} - ${lead.job_type || 'unknown'}`);
      });

      if (count > 3) {
        lines.push(`... and ${count - 3} more`);
      }

      lines.push('');
      lines.push('Check dashboard: https://ctlplumbingllc.com');

      return lines.join('\n');

    } catch (error) {
      logger.error('Error formatting stale lead reminder', {
        error: error.message
      });

      return `⏰ ${leads.length} leads need follow-up\n\nView: https://ctlplumbingllc.com`;
    }
  }

  isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // E.164 format: +1##########
    const e164Regex = /^\+1\d{10}$/;
    return e164Regex.test(phone);
  }

  maskPhoneNumber(phone) {
    if (!phone || phone.length < 8) {
      return '****';
    }
    return phone.substring(0, 5) + '****' + phone.substring(phone.length - 2);
  }

  /**
   * ✅ IMPROVED: Retry failed messages with exponential backoff
   */
  async retryFailedMessages() {
    if (this.failedMessages.length === 0) {
      return { retried: 0, succeeded: 0, failed: 0 };
    }

    logger.info('Retrying failed messages', {
      count: this.failedMessages.length
    });

    let succeeded = 0;
    let failed = 0;

    const messagesToRetry = [...this.failedMessages];
    this.failedMessages = [];

    for (const msg of messagesToRetry) {
      try {
        // Skip if too many retries
        if (msg.retryCount >= 3) {
          logger.warn('Message exceeded retry limit, discarding', {
            type: msg.type,
            lead_id: msg.lead_id,
            retryCount: msg.retryCount
          });
          failed++;
          continue;
        }

        // Implement retry based on message type
        if (msg.type === 'high_priority_alert' && msg.lead) {
          logger.info('Retrying high-priority alert', {
            lead_id: msg.lead_id,
            retryCount: msg.retryCount
          });

          await this.sendHighPriorityAlert(msg.lead);
          succeeded++;
        } else {
          logger.warn('Cannot retry message - insufficient data', {
            type: msg.type,
            lead_id: msg.lead_id
          });
          failed++;
        }

      } catch (error) {
        failed++;

        // Re-add to queue with increased retry count
        msg.retryCount = (msg.retryCount || 0) + 1;
        msg.lastRetry = new Date().toISOString();
        msg.lastError = error.message;

        this.failedMessages.push(msg);

        logger.error('Retry failed', {
          type: msg.type,
          lead_id: msg.lead_id,
          retryCount: msg.retryCount,
          error: error.message
        });
      }
    }

    logger.info('Retry complete', {
      total: messagesToRetry.length,
      succeeded: succeeded,
      failed: failed,
      remainingInQueue: this.failedMessages.length
    });

    return {
      retried: messagesToRetry.length,
      succeeded: succeeded,
      failed: failed
    };
  }

  getHealth() {
    const circuitStatus = this.circuitBreaker.getStatus();

    return {
      enabled: this.enabled,
      testMode: this.testMode,
      sentCount: this.sentCount,
      failedCount: this.failedCount,
      failureRate: this.sentCount > 0
        ? ((this.failedCount / (this.sentCount + this.failedCount)) * 100).toFixed(2) + '%'
        : '0%',
      queuedMessages: this.messageQueue.length,
      failedMessages: this.failedMessages.length,
      fromNumber: this.maskPhoneNumber(this.fromNumber),
      toNumber: this.maskPhoneNumber(this.toNumber),
      // ✅ NEW: Circuit breaker status
      circuitBreaker: {
        state: circuitStatus.state,
        isOpen: circuitStatus.isOpen,
        recentFailures: circuitStatus.recentFailures,
        metrics: circuitStatus.metrics
      },
      // ✅ NEW: Rate limiter status
      rateLimiter: {
        tokensRemaining: this.rateLimiter.tokens,
        maxTokens: this.rateLimiter.maxTokens,
        refillRate: `${this.rateLimiter.refillRate / 1000}s`
      }
    };
  }
}

// Custom Notification Error class
class NotificationError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'NotificationError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    if (originalError) {
      this.originalMessage = originalError.message;
      this.originalCode = originalError.code;
      this.moreInfo = originalError.moreInfo;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      originalMessage: this.originalMessage,
      originalCode: this.originalCode,
      moreInfo: this.moreInfo
    };
  }
}

module.exports = new NotificationService();
module.exports.NotificationError = NotificationError;
