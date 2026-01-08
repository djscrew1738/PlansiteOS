const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../../platform/observability/logger');
const CircuitBreaker = require('../../platform/middleware/CircuitBreaker');
// const { AI } = require('../../platform/config/constants'); // TODO: Create constants

class AIService {
  constructor() {
    this.client = null;
    this.initialized = false;
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalTokensUsed = 0;

    // ✅ NEW: Circuit breaker for Claude API
    this.circuitBreaker = new CircuitBreaker('claude-api', {
      failureThreshold: 5,        // Open after 5 failures
      successThreshold: 3,         // Close after 3 successes in half-open
      resetTimeout: 120000,        // Try again after 2 minutes
      timeout: 60000,              // 60 second timeout for AI calls
      monitoringPeriod: 180000,    // 3 minute rolling window
      onStateChange: this.onCircuitStateChange.bind(this),
      isFailure: this.isClaudeFailure.bind(this)
    });

    // ✅ NEW: Rate limiter for Claude API
    this.rateLimiter = {
      tokens: 50,              // Max 50 requests per minute (adjust based on your tier)
      maxTokens: 50,
      refillRate: 60000,       // Refill every minute
      lastRefill: Date.now()
    };

    this.initialize();
  }

  initialize() {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new AIServiceError(
          'ANTHROPIC_API_KEY not set',
          'MISSING_API_KEY'
        );
      }

      if (process.env.ANTHROPIC_API_KEY.length < 20) {
        throw new AIServiceError(
          'ANTHROPIC_API_KEY appears invalid',
          'INVALID_API_KEY'
        );
      }

      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });

      this.initialized = true;

      logger.info('AI Service initialized successfully', {
        model: AI.MODEL || 'claude-3-5-sonnet-20241022',
        circuitBreaker: 'enabled',
        maxTokens: AI.MAX_TOKENS || 1024
      });

    } catch (error) {
      this.initialized = false;

      logger.error('AI Service initialization failed', {
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * ✅ NEW: Circuit breaker state change handler
   */
  onCircuitStateChange(oldState, newState, breaker) {
    logger.warn('Claude API circuit breaker state changed', {
      from: oldState,
      to: newState,
      recentFailures: breaker.getRecentFailureCount()
    });

    if (newState === 'OPEN') {
      logger.error('⚠️ CRITICAL: Claude API circuit breaker OPEN - AI analysis unavailable', {
        nextAttempt: breaker.nextAttemptTime,
        recentFailures: breaker.getRecentFailureCount()
      });

      // Could send alert via NotificationService here
      const NotificationService = require('./NotificationService');
      NotificationService.sendCriticalAlert(
        'Claude API circuit breaker OPEN - AI analysis unavailable'
      ).catch(err => {
        logger.error('Failed to send circuit breaker alert', {
          error: err.message
        });
      });
    } else if (newState === 'CLOSED') {
      logger.info('✓ Claude API circuit breaker CLOSED - AI analysis restored');
    }
  }

  /**
   * ✅ NEW: Determine if error should trigger circuit breaker
   */
  isClaudeFailure(error) {
    // Don't open circuit for client errors (our fault)
    const clientErrors = [
      'INVALID_INPUT',
      'VALIDATION_ERROR',
      'MISSING_API_KEY',
      'INVALID_API_KEY'
    ];

    if (clientErrors.includes(error.code)) {
      return false;
    }

    // Don't open circuit for rate limits (we handle separately)
    if (error.code === 'RATE_LIMIT' || error.status === 429) {
      return false;
    }

    // Open circuit for server errors and network issues
    const serverErrors = [
      500, 502, 503, 504,  // HTTP server errors
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'TIMEOUT',
      'overloaded_error',
      'api_error'
    ];

    return serverErrors.includes(error.status) ||
           serverErrors.includes(error.code) ||
           serverErrors.includes(error.type) ||
           error.name === 'CircuitBreakerError';
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

      logger.warn('AI Service rate limit exceeded', {
        waitTime: waitTime,
        nextRefill: new Date(this.rateLimiter.lastRefill + this.rateLimiter.refillRate).toISOString()
      });

      throw new AIServiceError(
        `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        'RATE_LIMIT'
      );
    }

    // Consume a token
    this.rateLimiter.tokens--;

    logger.debug('Rate limiter token consumed', {
      tokensRemaining: this.rateLimiter.tokens
    });
  }

  /**
   * ✅ UPDATED: Analyze post with circuit breaker and retry logic
   */
  async analyzePost(postText, groupName = 'Unknown', options = {}) {
    const startTime = Date.now();
    const correlationId = options.correlationId || 'none';

    try {
      this.requestCount++;

      // Validate inputs
      if (!postText || typeof postText !== 'string') {
        throw new AIServiceError(
          'Post text is required and must be a string',
          'INVALID_INPUT'
        );
      }

      if (postText.length < 10) {
        throw new AIServiceError(
          'Post text too short for analysis',
          'INVALID_INPUT'
        );
      }

      if (!this.initialized) {
        throw new AIServiceError(
          'AI Service not initialized',
          'NOT_INITIALIZED'
        );
      }

      logger.info('Analyzing post with AI', {
        correlationId: correlationId,
        textLength: postText.length,
        groupName: groupName,
        circuitState: this.circuitBreaker.state
      });

      // ✅ NEW: Check rate limit
      await this.checkRateLimit();

      // Prepare prompt
      const prompt = this.buildAnalysisPrompt(postText, groupName);

      // ✅ NEW: Execute with circuit breaker protection
      const response = await this.circuitBreaker.execute(async () => {
        return await this.client.messages.create({
          model: AI.MODEL || 'claude-3-5-sonnet-20241022',
          max_tokens: AI.MAX_TOKENS || 1024,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });
      }, { correlationId, groupName });

      // Parse response
      const analysis = this.parseAIResponse(response);

      // Track token usage
      if (response.usage) {
        this.totalTokensUsed += response.usage.input_tokens + response.usage.output_tokens;
      }

      const duration = Date.now() - startTime;

      this.successCount++;

      logger.info('AI analysis completed', {
        correlationId: correlationId,
        confidence: analysis.confidence,
        is_lead: analysis.is_lead,
        job_type: analysis.job_type,
        duration: `${duration}ms`,
        tokens_used: response.usage?.input_tokens + response.usage?.output_tokens
      });

      return analysis;

    } catch (error) {
      this.errorCount++;

      const duration = Date.now() - startTime;

      logger.error('AI analysis failed', {
        correlationId: correlationId,
        error: error.message,
        code: error.code,
        type: error.type,
        status: error.status,
        duration: `${duration}ms`,
        circuitState: this.circuitBreaker.state
      });

      // Handle specific Anthropic errors
      if (error.status === 429) {
        throw new AIServiceError(
          'Claude API rate limit exceeded',
          'RATE_LIMIT',
          error
        );
      } else if (error.status === 401) {
        throw new AIServiceError(
          'Invalid Claude API key',
          'AUTH_FAILED',
          error
        );
      } else if (error.status === 400) {
        throw new AIServiceError(
          'Invalid request to Claude API',
          'INVALID_REQUEST',
          error
        );
      } else if (error.status >= 500) {
        throw new AIServiceError(
          'Claude API server error',
          'API_ERROR',
          error
        );
      } else if (error.type === 'overloaded_error') {
        throw new AIServiceError(
          'Claude API is overloaded',
          'OVERLOADED',
          error
        );
      }

      throw new AIServiceError(
        'Failed to analyze post',
        'ANALYSIS_FAILED',
        error
      );
    }
  }

  buildAnalysisPrompt(postText, groupName) {
    return `You are a lead qualification AI for a plumbing company in the Dallas-Fort Worth area.

Analyze the following Facebook post from the group "${groupName}" and determine if it's a potential plumbing lead.

POST TEXT:
${postText}

Provide your analysis in the following JSON format:
{
  "is_lead": boolean,
  "confidence": number (0-100),
  "job_type": string ("drain", "water_heater", "leak", "installation", "repair", "emergency", "inspection", "other", or "unknown"),
  "city": string or null,
  "county": string or null,
  "contact_info": string or null,
  "urgency": string ("low", "medium", "high"),
  "summary": string (brief summary of the need),
  "recommended_response": string (suggested professional response to the post)
}

Guidelines:
- is_lead: true if this is someone looking for plumbing services
- confidence: your certainty level (0-100)
- job_type: categorize the type of plumbing work needed
- city/county: extract location if mentioned
- contact_info: extract any phone numbers or emails
- urgency: assess how quickly they need service
- summary: 1-2 sentences describing the situation
- recommended_response: Professional, friendly response offering services

Respond ONLY with the JSON object, no additional text.`;
  }

  parseAIResponse(response) {
    try {
      // Extract content from Claude's response
      const content = response.content[0]?.text;

      if (!content) {
        throw new Error('No content in AI response');
      }

      // Try to parse JSON
      let analysis;
      try {
        // Sometimes Claude wraps JSON in markdown code blocks
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                         content.match(/```\n([\s\S]*?)\n```/);

        const jsonText = jsonMatch ? jsonMatch[1] : content;
        analysis = JSON.parse(jsonText);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON', {
          error: parseError.message,
          content: content.substring(0, 500)
        });

        throw new AIServiceError(
          'Invalid JSON response from AI',
          'PARSE_ERROR',
          parseError
        );
      }

      // Validate required fields
      const required = ['is_lead', 'confidence', 'job_type', 'urgency', 'summary'];
      const missing = required.filter(field => analysis[field] === undefined);

      if (missing.length > 0) {
        throw new AIServiceError(
          `AI response missing fields: ${missing.join(', ')}`,
          'INCOMPLETE_RESPONSE'
        );
      }

      // Normalize and validate values
      return {
        is_lead: Boolean(analysis.is_lead),
        confidence: Math.max(0, Math.min(100, Number(analysis.confidence) || 0)),
        job_type: String(analysis.job_type || 'unknown').toLowerCase(),
        city: analysis.city || null,
        county: analysis.county || null,
        contact_info: analysis.contact_info || null,
        urgency: ['low', 'medium', 'high'].includes(analysis.urgency)
          ? analysis.urgency
          : 'low',
        summary: String(analysis.summary || 'No summary provided'),
        recommended_response: String(analysis.recommended_response || 'Thank you for reaching out. We would be happy to help with your plumbing needs.')
      };

    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      throw new AIServiceError(
        'Failed to parse AI response',
        'PARSE_ERROR',
        error
      );
    }
  }

  getHealth() {
    const circuitStatus = this.circuitBreaker.getStatus();

    return {
      initialized: this.initialized,
      requestCount: this.requestCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      successRate: this.requestCount > 0
        ? ((this.successCount / this.requestCount) * 100).toFixed(2) + '%'
        : 'N/A',
      totalTokensUsed: this.totalTokensUsed,
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

  getMetrics() {
    return {
      requests: {
        total: this.requestCount,
        successful: this.successCount,
        failed: this.errorCount
      },
      tokens: {
        total: this.totalTokensUsed,
        estimated_cost: (this.totalTokensUsed / 1000000 * 3).toFixed(4) // Rough estimate
      },
      circuit: this.circuitBreaker.getStatus()
    };
  }

  resetMetrics() {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.totalTokensUsed = 0;

    logger.info('AI Service metrics reset');
  }
}

// Custom AI Service Error class
class AIServiceError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    if (originalError) {
      this.originalMessage = originalError.message;
      this.originalCode = originalError.code;
      this.type = originalError.type;
      this.status = originalError.status;
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
      type: this.type,
      status: this.status
    };
  }
}

module.exports = new AIService();
module.exports.AIServiceError = AIServiceError;
