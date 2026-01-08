// const Lead = require('../models/Lead'); // TODO: Create models
// const ServiceArea = require('../models/ServiceArea'); // TODO: Create models
const AIService = require('./AIService');
// const NotificationService = require('./NotificationService'); // TODO: Move to integrations
// const Validators = require('../utils/validators'); // TODO: Create validators
const logger = require('../../platform/observability/logger');
const { getTransactionManager } = require('../../platform/config/TransactionManager');
const correlationId = require('../../platform/observability/CorrelationId');
const db = require('../../platform/config/database');
// const { AI } = require('../../platform/config/constants'); // TODO: Create constants

class LeadProcessingService {
  constructor() {
    this.processingCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.duplicateCount = 0;
    this.filteredCount = 0;

    // ✅ NEW: Initialize transaction manager
    this.transactionManager = getTransactionManager(db);
  }

  /**
   * ✅ UPDATED: Process incoming post with transactions and correlation IDs
   */
  async processIncomingPost(postData, options = {}) {
    const startTime = Date.now();

    // ✅ NEW: Get or generate correlation ID
    const corrId = options.correlationId || correlationId.get() || correlationId.generate();

    // Run entire processing in correlation context
    return correlationId.run(corrId, async () => {
      const processingId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      try {
        this.processingCount++;

        logger.info('Processing incoming post', {
          correlationId: corrId,
          processingId: processingId,
          source: postData.group_name,
          textLength: postData.post_text?.length
        });

        // Step 1: Validate input
        const validation = await this.validateInput(postData);
        if (!validation.valid) {
          logger.warn('Invalid lead input', {
            correlationId: corrId,
            processingId: processingId,
            errors: validation.errors
          });
          return {
            success: false,
            errors: validation.errors,
            code: 'VALIDATION_ERROR',
            correlationId: corrId
          };
        }

        // Step 2: Check for duplicates
        const duplicate = await this.checkDuplicate(postData.post_url);
        if (duplicate) {
          this.duplicateCount++;
          logger.info('Duplicate lead detected', {
            correlationId: corrId,
            processingId: processingId,
            post_url: postData.post_url,
            existing_lead_id: duplicate.id
          });
          return {
            success: true,
            duplicate: true,
            lead_id: duplicate.id,
            correlationId: corrId
          };
        }

        // Step 3: Sanitize inputs
        const sanitized = this.sanitizeInputs(postData);

        // Step 4: AI analysis
        const analysis = await this.analyzeWithAI(sanitized, corrId);
        if (!analysis) {
          throw new LeadProcessingError(
            'AI analysis failed',
            'AI_ANALYSIS_FAILED',
            corrId
          );
        }

        // Step 5: Filter non-leads
        if (!analysis.is_lead || analysis.confidence < 30) {
          this.filteredCount++;
          logger.info('Post filtered by AI', {
            correlationId: corrId,
            processingId: processingId,
            confidence: analysis.confidence,
            is_lead: analysis.is_lead,
            reason: 'Low confidence or not a lead'
          });
          return {
            success: true,
            filtered: true,
            reason: 'AI determined this is not a relevant lead',
            confidence: analysis.confidence,
            correlationId: corrId
          };
        }

        // Step 6: Verify service area
        const serviceAreaCheck = await this.verifyServiceArea(analysis);
        if (serviceAreaCheck.adjusted) {
          logger.info('Lead confidence adjusted for service area', {
            correlationId: corrId,
            processingId: processingId,
            originalConfidence: analysis.confidence,
            adjustedConfidence: serviceAreaCheck.confidence,
            inServiceArea: serviceAreaCheck.inServiceArea
          });
          analysis.confidence = serviceAreaCheck.confidence;
        }

        // ✅ NEW: Step 7: Create lead with transaction
        const lead = await this.createLeadWithTransaction(sanitized, analysis, corrId);
        if (!lead) {
          throw new LeadProcessingError(
            'Failed to create lead in database',
            'DATABASE_CREATE_FAILED',
            corrId
          );
        }

        this.successCount++;

        const duration = Date.now() - startTime;

        logger.info('Lead created successfully', {
          correlationId: corrId,
          processingId: processingId,
          lead_id: lead.id,
          city: lead.city,
          job_type: lead.job_type,
          score: lead.ai_score,
          duration: `${duration}ms`
        });

        // Step 8: Send notifications (async, don't wait)
        this.sendNotifications(lead, corrId).catch(error => {
          logger.error('Notification failed but lead was saved', {
            correlationId: corrId,
            processingId: processingId,
            lead_id: lead.id,
            error: error.message
          });
        });

        return {
          success: true,
          lead_id: lead.id,
          is_priority: lead.ai_score >= AI.HIGH_PRIORITY_THRESHOLD,
          score: lead.ai_score,
          job_type: lead.job_type,
          city: lead.city,
          duration: duration,
          correlationId: corrId
        };

      } catch (error) {
        this.errorCount++;

        const duration = Date.now() - startTime;

        logger.error('Lead processing failed', {
          correlationId: corrId,
          processingId: processingId,
          error: error.message,
          code: error.code,
          stack: error.stack,
          duration: `${duration}ms`,
          errorCount: this.errorCount
        });

        throw new LeadProcessingError(
          'Failed to process lead',
          'PROCESSING_FAILED',
          corrId,
          error
        );
      }
    });
  }

  async validateInput(postData) {
    try {
      const errors = [];

      // Required fields
      if (!postData) {
        errors.push('Post data is required');
        return { valid: false, errors };
      }

      if (!postData.post_text || typeof postData.post_text !== 'string') {
        errors.push('post_text is required and must be a string');
      } else if (postData.post_text.length < 10) {
        errors.push('post_text must be at least 10 characters');
      } else if (postData.post_text.length > 10000) {
        errors.push('post_text exceeds maximum length of 10000 characters');
      }

      if (!postData.post_url || typeof postData.post_url !== 'string') {
        errors.push('post_url is required and must be a string');
      } else if (!Validators.isValidUrl(postData.post_url)) {
        errors.push('post_url must be a valid URL');
      }

      // Optional but validated if present
      if (postData.author && typeof postData.author !== 'string') {
        errors.push('author must be a string');
      }

      if (postData.group_name && typeof postData.group_name !== 'string') {
        errors.push('group_name must be a string');
      }

      if (postData.timestamp) {
        const date = new Date(postData.timestamp);
        if (isNaN(date.getTime())) {
          errors.push('timestamp must be a valid ISO 8601 date string');
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };

    } catch (error) {
      logger.error('Input validation error', {
        error: error.message
      });

      return {
        valid: false,
        errors: ['Validation error: ' + error.message]
      };
    }
  }

  async checkDuplicate(postUrl) {
    try {
      if (!postUrl) {
        return null;
      }

      const existing = await Lead.findByUrl(postUrl);
      return existing || null;

    } catch (error) {
      logger.error('Duplicate check failed', {
        error: error.message,
        post_url: postUrl
      });

      // Don't fail the whole process on duplicate check error
      return null;
    }
  }

  sanitizeInputs(postData) {
    try {
      return {
        post_text: Validators.sanitizeString(postData.post_text, 10000),
        post_url: postData.post_url.trim(),
        author: Validators.sanitizeString(postData.author || 'Unknown', 100),
        timestamp: postData.timestamp || new Date().toISOString(),
        group_name: Validators.sanitizeString(postData.group_name || 'Unknown', 200),
      };
    } catch (error) {
      logger.error('Input sanitization error', {
        error: error.message
      });

      throw new LeadProcessingError(
        'Failed to sanitize inputs',
        'SANITIZATION_ERROR',
        correlationId.get(),
        error
      );
    }
  }

  /**
   * ✅ UPDATED: Pass correlation ID to AI service
   */
  async analyzeWithAI(sanitized, corrId) {
    try {
      const analysis = await AIService.analyzePost(
        sanitized.post_text,
        sanitized.group_name,
        { correlationId: corrId }
      );

      if (!analysis) {
        throw new Error('AI analysis returned null');
      }

      return analysis;

    } catch (error) {
      logger.error('AI analysis failed in processing', {
        error: error.message,
        code: error.code
      });

      // For AI errors, we might want to save the lead anyway with low confidence
      if (error.code === 'RATE_LIMIT' || error.code === 'TIMEOUT') {
        logger.warn('Using fallback analysis due to AI error');
        return {
          is_lead: true, // Err on side of caution
          confidence: 40, // Low confidence
          job_type: 'unknown',
          city: null,
          county: null,
          contact_info: null,
          urgency: 'low',
          summary: 'AI analysis unavailable - manual review required',
          recommended_response: 'Licensed plumber in DFW area. Call 999-999-9999 for quote.'
        };
      }

      throw error;
    }
  }

  async verifyServiceArea(analysis) {
    try {
      if (!analysis.city && !analysis.county) {
        // No location info, can't verify
        return {
          adjusted: false,
          confidence: analysis.confidence,
          inServiceArea: null
        };
      }

      const inServiceArea = await ServiceArea.matchesServiceArea(
        analysis.city,
        analysis.county
      );

      if (!inServiceArea) {
        logger.info('Lead outside primary service area', {
          city: analysis.city,
          county: analysis.county
        });

        // Lower confidence for out-of-area leads
        const adjustedConfidence = Math.min(analysis.confidence, 50);

        return {
          adjusted: true,
          confidence: adjustedConfidence,
          inServiceArea: false
        };
      }

      return {
        adjusted: false,
        confidence: analysis.confidence,
        inServiceArea: true
      };

    } catch (error) {
      logger.error('Service area verification failed', {
        error: error.message
      });

      // Don't adjust on error
      return {
        adjusted: false,
        confidence: analysis.confidence,
        inServiceArea: null
      };
    }
  }

  /**
   * ✅ NEW: Create lead with transaction
   *
   * Ensures atomic operation:
   * - Lead record created
   * - Notification queued
   * - Activity logged
   *
   * If any step fails, entire transaction rolls back
   */
  async createLeadWithTransaction(sanitized, analysis, corrId) {
    try {
      return await this.transactionManager.execute(async (client) => {
        // Step 1: Create lead record
        const leadResult = await client.query(
          `INSERT INTO leads (
            source, post_url, post_text, location, city, county,
            contact_info, posted_at, ai_score, ai_analysis, job_type,
            status, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING *`,
          [
            'facebook',
            sanitized.post_url,
            sanitized.post_text,
            sanitized.group_name,
            analysis.city,
            analysis.county,
            analysis.contact_info,
            sanitized.timestamp,
            analysis.confidence,
            JSON.stringify(analysis),
            analysis.job_type,
            'new'
          ]
        );

        const lead = leadResult.rows[0];

        logger.debug('Lead record created', {
          correlationId: corrId,
          lead_id: lead.id
        });

        // Step 2: Queue notification if high priority
        if (analysis.confidence >= AI.HIGH_PRIORITY_THRESHOLD) {
          await client.query(
            `INSERT INTO notification_queue (
              lead_id, type, priority, status, created_at
            )
            VALUES ($1, $2, $3, $4, NOW())`,
            [
              lead.id,
              'high_priority_alert',
              analysis.confidence,
              'pending'
            ]
          );

          logger.debug('Notification queued', {
            correlationId: corrId,
            lead_id: lead.id,
            type: 'high_priority_alert'
          });
        }

        // Step 3: Log activity
        await client.query(
          `INSERT INTO lead_activity (
            lead_id, activity_type, description, correlation_id, created_at
          )
          VALUES ($1, $2, $3, $4, NOW())`,
          [
            lead.id,
            'created',
            'Lead created from Facebook post',
            corrId
          ]
        );

        logger.debug('Activity logged', {
          correlationId: corrId,
          lead_id: lead.id
        });

        // Return the lead with proper mapping
        return {
          id: lead.id,
          source: lead.source,
          post_url: lead.post_url,
          post_text: lead.post_text,
          city: lead.city,
          county: lead.county,
          contact_info: lead.contact_info,
          ai_score: lead.ai_score,
          ai_analysis: typeof lead.ai_analysis === 'string'
            ? JSON.parse(lead.ai_analysis)
            : lead.ai_analysis,
          job_type: lead.job_type,
          status: lead.status,
          created_at: lead.created_at
        };

      }, { correlationId: corrId, timeout: 10000 });

    } catch (error) {
      logger.error('Lead creation transaction failed', {
        correlationId: corrId,
        error: error.message,
        code: error.code
      });

      throw new LeadProcessingError(
        'Failed to create lead',
        'LEAD_CREATE_ERROR',
        corrId,
        error
      );
    }
  }

  /**
   * ✅ UPDATED: Pass correlation ID to notification service
   */
  async sendNotifications(lead, corrId) {
    try {
      if (lead.ai_score >= AI.HIGH_PRIORITY_THRESHOLD) {
        await NotificationService.sendHighPriorityAlert(lead);

        logger.info('High-priority notification sent', {
          correlationId: corrId,
          lead_id: lead.id
        });
      }
    } catch (error) {
      // Already logged in NotificationService
      throw error;
    }
  }

  getMetrics() {
    const total = this.processingCount;
    const successRate = total > 0
      ? ((this.successCount / total) * 100).toFixed(2) + '%'
      : '0%';
    const errorRate = total > 0
      ? ((this.errorCount / total) * 100).toFixed(2) + '%'
      : '0%';

    return {
      total: total,
      successful: this.successCount,
      errors: this.errorCount,
      duplicates: this.duplicateCount,
      filtered: this.filteredCount,
      successRate: successRate,
      errorRate: errorRate,
      transactions: this.transactionManager.getMetrics()
    };
  }

  resetMetrics() {
    this.processingCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.duplicateCount = 0;
    this.filteredCount = 0;
    this.transactionManager.resetMetrics();

    logger.info('Lead processing metrics reset');
  }
}

// Custom Lead Processing Error class
class LeadProcessingError extends Error {
  constructor(message, code, correlationId, originalError) {
    super(message);
    this.name = 'LeadProcessingError';
    this.code = code;
    this.correlationId = correlationId;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    if (originalError) {
      this.originalMessage = originalError.message;
      this.originalCode = originalError.code;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      originalMessage: this.originalMessage,
      originalCode: this.originalCode
    };
  }
}

module.exports = new LeadProcessingService();
module.exports.LeadProcessingError = LeadProcessingError;
