const cron = require('node-cron');
const NotificationService = require('./NotificationService');
const Lead = require('../models/Lead');
const logger = require('../utils/logger');
const { CLEANUP } = require('../config/constants');

// ✅ FIXED: Use centralized database connection instead of creating new pool
const db = require('../config/database');

class CronService {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
    this.jobExecutions = {};
  }

  start() {
    try {
      if (this.isRunning) {
        logger.warn('Cron service already running');
        return;
      }

      logger.info('Starting cron jobs...');

      // Daily summary at configured time
      this.scheduleJob(
        'daily-summary',
        `0 20 * * *`, // 8 PM daily
        this.runDailySummary.bind(this),
        'Daily Summary'
      );

      // Clean up old leads at 2 AM
      this.scheduleJob(
        'cleanup-old-leads',
        '0 2 * * *',
        this.runLeadCleanup.bind(this),
        'Lead Cleanup'
      );

      // Check stale leads at 10 AM
      this.scheduleJob(
        'stale-leads-check',
        '0 10 * * *',
        this.runStaleLeadsCheck.bind(this),
        'Stale Leads Check'
      );

      // Health check every hour
      this.scheduleJob(
        'health-check',
        '0 * * * *',
        this.runHealthCheck.bind(this),
        'Health Check'
      );

      // Metrics collection every 15 minutes
      this.scheduleJob(
        'metrics-collection',
        '*/15 * * * *',
        this.runMetricsCollection.bind(this),
        'Metrics Collection'
      );

      this.isRunning = true;
      logger.info('✓ Cron jobs started successfully', {
        jobCount: this.jobs.length
      });

    } catch (error) {
      logger.error('Failed to start cron jobs', {
        error: error.message,
        stack: error.stack
      });
      throw new CronError('Cron service failed to start', 'START_FAILED', error);
    }
  }

  scheduleJob(id, schedule, handler, name) {
    try {
      // Validate cron schedule
      if (!cron.validate(schedule)) {
        throw new Error(`Invalid cron schedule: ${schedule}`);
      }

      const job = cron.schedule(schedule, async () => {
        await this.executeJob(id, handler, name);
      }, {
        scheduled: true,
        timezone: process.env.TZ || 'America/Chicago'
      });

      this.jobs.push({
        id: id,
        name: name,
        schedule: schedule,
        job: job
      });

      this.jobExecutions[id] = {
        lastRun: null,
        lastDuration: null,
        lastStatus: null,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0
      };

      logger.info('Cron job scheduled', {
        id: id,
        name: name,
        schedule: schedule
      });

    } catch (error) {
      logger.error('Failed to schedule cron job', {
        id: id,
        name: name,
        error: error.message
      });
      throw error;
    }
  }

  async executeJob(id, handler, name) {
    // ✅ NEW: Prevent job overlap
    if (this.jobExecutions[id]?.running) {
      logger.warn(`Job ${name} already running, skipping`, { id: id });
      return;
    }

    const startTime = Date.now();

    try {
      logger.info(`Starting cron job: ${name}`, { id: id });

      this.jobExecutions[id].running = true;
      this.jobExecutions[id].totalRuns++;

      await handler();

      const duration = Date.now() - startTime;

      this.jobExecutions[id].lastRun = new Date().toISOString();
      this.jobExecutions[id].lastDuration = duration;
      this.jobExecutions[id].lastStatus = 'success';
      this.jobExecutions[id].successfulRuns++;

      logger.info(`Cron job completed: ${name}`, {
        id: id,
        duration: `${duration}ms`
      });

    } catch (error) {
      const duration = Date.now() - startTime;

      this.jobExecutions[id].lastRun = new Date().toISOString();
      this.jobExecutions[id].lastDuration = duration;
      this.jobExecutions[id].lastStatus = 'failed';
      this.jobExecutions[id].lastError = error.message;
      this.jobExecutions[id].failedRuns++;

      logger.error(`Cron job failed: ${name}`, {
        id: id,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });

      // Send alert for critical job failures
      if (['daily-summary', 'health-check'].includes(id)) {
        try {
          await NotificationService.sendCriticalAlert(
            `Cron job failed: ${name}\nError: ${error.message}`
          );
        } catch (notifError) {
          logger.error('Failed to send cron failure alert', {
            error: notifError.message
          });
        }
      }
    } finally {
      this.jobExecutions[id].running = false;
    }
  }

  async runDailySummary() {
    try {
      logger.info('Running daily summary...');

      const stats = await Lead.getStats(1); // Last 24 hours

      if (!stats) {
        throw new Error('Failed to retrieve lead stats');
      }

      logger.info('Daily stats collected', stats);

      // Only send if there's activity
      if (stats.total > 0) {
        await NotificationService.sendDailySummary(stats);
      } else {
        logger.info('No activity today, skipping daily summary SMS');
      }

      // Log to metrics
      await this.logMetric('daily_leads', stats.total);

    } catch (error) {
      logger.error('Daily summary failed', {
        error: error.message
      });
      throw error;
    }
  }

  async runLeadCleanup() {
    try {
      logger.info('Running lead cleanup...');

      const archivedCount = await Lead.archiveOld(CLEANUP.ARCHIVE_AFTER_DAYS);

      logger.info('Lead cleanup completed', {
        archivedCount: archivedCount
      });

      if (archivedCount > 0) {
        await this.logMetric('leads_archived', archivedCount);
      }

    } catch (error) {
      logger.error('Lead cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  async runStaleLeadsCheck() {
    try {
      logger.info('Checking for stale leads...');

      const staleLeads = await Lead.findStale(CLEANUP.STALE_CONTACT_DAYS);

      if (!staleLeads || staleLeads.length === 0) {
        logger.info('No stale leads found');
        return;
      }

      logger.info('Stale leads found', {
        count: staleLeads.length
      });

      await NotificationService.sendStaleLeadReminder(staleLeads);

      await this.logMetric('stale_leads_found', staleLeads.length);

    } catch (error) {
      logger.error('Stale leads check failed', {
        error: error.message
      });
      throw error;
    }
  }

  async runHealthCheck() {
    try {
      logger.info('Running health check...');

      const redis = require('../config/redis');

      // Check database health
      const dbHealth = await db.healthCheck();

      // Check Redis health
      const redisHealth = await redis.healthCheck();

      // Check service health
      const aiService = require('./AIService');
      const notifService = require('./NotificationService');

      const aiHealth = aiService.getHealth();
      const notifHealth = notifService.getHealth();

      const allHealthy =
        dbHealth.healthy &&
        redisHealth.healthy &&
        aiHealth.initialized &&
        (notifHealth.enabled || notifHealth.testMode);

      if (!allHealthy) {
        const issues = [];
        if (!dbHealth.healthy) issues.push('Database');
        if (!redisHealth.healthy) issues.push('Redis');
        if (!aiHealth.initialized) issues.push('AI Service');
        if (!notifHealth.enabled && !notifHealth.testMode) issues.push('Notifications');

        logger.warn('Health check detected issues', {
          issues: issues,
          details: {
            database: dbHealth,
            redis: redisHealth,
            ai: aiHealth,
            notifications: notifHealth
          }
        });

        await NotificationService.sendCriticalAlert(
          `Health check issues detected: ${issues.join(', ')}`
        );
      } else {
        logger.info('Health check passed - all systems operational');
      }

      // Log health metrics
      await this.logMetric('health_check_status', allHealthy ? 1 : 0);

    } catch (error) {
      logger.error('Health check failed', {
        error: error.message
      });
      throw error;
    }
  }

  async runMetricsCollection() {
    try {
      logger.debug('Collecting metrics...');

      const leadProcessing = require('./LeadProcessingService');
      const metrics = leadProcessing.getMetrics();

      // Log key metrics
      await this.logMetric('total_leads_processed', metrics.total);
      await this.logMetric('successful_leads', metrics.successful);
      await this.logMetric('failed_leads', metrics.errors);

    } catch (error) {
      logger.error('Metrics collection failed', {
        error: error.message
      });
      // Don't throw - metrics collection failure shouldn't stop other jobs
    }
  }

  async logMetric(metricName, value, metadata = {}) {
    try {
      // ✅ FIXED: Use centralized db connection with proper error handling
      await db.query(
        `INSERT INTO system_metrics (metric_name, metric_value, metadata, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [metricName, value, JSON.stringify(metadata)]
      );
    } catch (error) {
      logger.error('Failed to log metric', {
        metric: metricName,
        value: value,
        error: error.message
      });
      // Don't throw - metric logging failure shouldn't fail the job
    }
  }

  stop() {
    try {
      if (!this.isRunning) {
        logger.warn('Cron service not running');
        return;
      }

      logger.info('Stopping cron jobs...');

      this.jobs.forEach(({ id, name, job }) => {
        try {
          job.stop();
          logger.info('Cron job stopped', { id: id, name: name });
        } catch (error) {
          logger.error('Failed to stop cron job', {
            id: id,
            name: name,
            error: error.message
          });
        }
      });

      this.jobs = [];
      this.isRunning = false;

      logger.info('✓ All cron jobs stopped');

    } catch (error) {
      logger.error('Failed to stop cron jobs', {
        error: error.message
      });
      throw new CronError('Failed to stop cron service', 'STOP_FAILED', error);
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      jobCount: this.jobs.length,
      jobs: this.jobs.map(({ id, name, schedule }) => ({
        id,
        name,
        schedule,
        ...this.jobExecutions[id]
      }))
    };
  }
}

// Custom Cron Error class
class CronError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'CronError';
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    if (originalError) {
      this.originalMessage = originalError.message;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      originalMessage: this.originalMessage
    };
  }
}

module.exports = new CronService();
module.exports.CronError = CronError;
