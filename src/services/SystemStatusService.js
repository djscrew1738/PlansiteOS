/**
 * System Status Service
 *
 * Monitors and reports health status of all system components:
 * - API Server
 * - Database (PostgreSQL)
 * - AI Service (Claude API)
 * - Blueprints Analysis Engine
 */

const db = require('../config/database');
const logger = require('../utils/logger');

class SystemStatusService {
  constructor() {
    this.startTime = Date.now();
    this.lastHealthCheck = null;
    this.healthCheckInterval = null;
    this.statusCache = {
      api: { status: 'unknown', lastCheck: null },
      database: { status: 'unknown', lastCheck: null },
      ai: { status: 'unknown', lastCheck: null },
      blueprints: { status: 'unknown', lastCheck: null }
    };
  }

  /**
   * Start periodic health checks
   */
  startMonitoring(intervalMs = 30000) {
    logger.info('Starting system status monitoring', { interval: intervalMs });

    // Initial health check
    this.performHealthCheck();

    // Periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Stopped system status monitoring');
    }
  }

  /**
   * Perform comprehensive health check on all services
   */
  async performHealthCheck() {
    try {
      await Promise.all([
        this.checkDatabase(),
        this.checkAIService(),
        this.checkBlueprintsEngine()
      ]);

      this.statusCache.api = {
        status: 'healthy',
        lastCheck: new Date().toISOString()
      };

      this.lastHealthCheck = new Date().toISOString();
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      this.statusCache.api = {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Check API Server Status
   */
  async checkAPIServer() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      name: 'API Server',
      description: 'Core service',
      uptime: uptime,
      uptimeHuman: this.formatUptime(uptime),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
      },
      nodeVersion: process.version,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Check Database Connection and Stats
   */
  async checkDatabase() {
    const startTime = Date.now();

    try {
      // Test connection
      await db.query('SELECT 1 as health_check');

      // Get connection pool stats
      const poolStats = {
        totalCount: db.totalCount,
        idleCount: db.idleCount,
        waitingCount: db.waitingCount
      };

      // Get database size
      let dbSize = null;
      try {
        const sizeResult = await db.query(`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `);
        dbSize = sizeResult.rows[0]?.size;
      } catch (e) {
        // Ignore if query fails
      }

      // Get table counts
      let tableCounts = {};
      try {
        const countResult = await db.query(`
          SELECT
            (SELECT COUNT(*) FROM blueprints) as blueprints,
            (SELECT COUNT(*) FROM rooms) as rooms,
            (SELECT COUNT(*) FROM fixtures) as fixtures
        `);
        tableCounts = countResult.rows[0] || {};
      } catch (e) {
        // Tables might not exist yet
      }

      const responseTime = Date.now() - startTime;

      const status = {
        status: 'healthy',
        name: 'PostgreSQL',
        description: 'Database',
        responseTime: `${responseTime}ms`,
        connection: 'connected',
        pool: poolStats,
        database: {
          size: dbSize,
          tables: tableCounts
        },
        lastCheck: new Date().toISOString()
      };

      this.statusCache.database = status;
      return status;

    } catch (error) {
      logger.error('Database health check failed', { error: error.message });

      const status = {
        status: 'unhealthy',
        name: 'PostgreSQL',
        description: 'Database',
        connection: 'disconnected',
        error: error.message,
        lastCheck: new Date().toISOString()
      };

      this.statusCache.database = status;
      return status;
    }
  }

  /**
   * Check AI Service (Claude API) Status
   */
  async checkAIService() {
    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey || apiKey === 'sk-ant-placeholder-key-needs-to-be-set') {
        const status = {
          status: 'not_configured',
          name: 'Claude Vision',
          description: 'AI Service',
          configured: false,
          message: 'API key not configured',
          lastCheck: new Date().toISOString()
        };

        this.statusCache.ai = status;
        return status;
      }

      // Check API key format
      const isValidFormat = apiKey.startsWith('sk-ant-') && apiKey.length > 20;

      if (!isValidFormat) {
        const status = {
          status: 'error',
          name: 'Claude Vision',
          description: 'AI Service',
          configured: true,
          error: 'Invalid API key format',
          lastCheck: new Date().toISOString()
        };

        this.statusCache.ai = status;
        return status;
      }

      // Get circuit breaker stats if available
      const BlueprintService = require('./BlueprintService');
      let circuitBreakerStats = null;
      if (BlueprintService.getCircuitBreakerStats) {
        try {
          circuitBreakerStats = BlueprintService.getCircuitBreakerStats();
        } catch (e) {
          // Ignore if method doesn't exist
        }
      }

      const status = {
        status: 'healthy',
        name: 'Claude Vision',
        description: 'AI Service',
        configured: true,
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        circuitBreaker: circuitBreakerStats,
        lastCheck: new Date().toISOString()
      };

      this.statusCache.ai = status;
      return status;

    } catch (error) {
      logger.error('AI service health check failed', { error: error.message });

      const status = {
        status: 'error',
        name: 'Claude Vision',
        description: 'AI Service',
        error: error.message,
        lastCheck: new Date().toISOString()
      };

      this.statusCache.ai = status;
      return status;
    }
  }

  /**
   * Check Blueprints Analysis Engine Status
   */
  async checkBlueprintsEngine() {
    try {
      // Check if BlueprintService is loaded
      const BlueprintService = require('./BlueprintService');

      // Get blueprint statistics from database
      let stats = {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      try {
        const result = await db.query(`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'processing') as processing,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed
          FROM blueprints
        `);

        if (result.rows[0]) {
          stats = {
            total: parseInt(result.rows[0].total) || 0,
            pending: parseInt(result.rows[0].pending) || 0,
            processing: parseInt(result.rows[0].processing) || 0,
            completed: parseInt(result.rows[0].completed) || 0,
            failed: parseInt(result.rows[0].failed) || 0
          };
        }
      } catch (e) {
        // Table might not exist yet
        logger.debug('Could not fetch blueprint stats', { error: e.message });
      }

      // Check for processing backlog
      const hasBacklog = stats.pending > 50;
      const status = hasBacklog ? 'warning' : 'healthy';

      const engineStatus = {
        status: status,
        name: 'Blueprints',
        description: 'Analysis engine',
        initialized: true,
        statistics: stats,
        backlog: hasBacklog ? 'High pending count' : 'Normal',
        lastCheck: new Date().toISOString()
      };

      this.statusCache.blueprints = engineStatus;
      return engineStatus;

    } catch (error) {
      logger.error('Blueprints engine health check failed', { error: error.message });

      const status = {
        status: 'error',
        name: 'Blueprints',
        description: 'Analysis engine',
        initialized: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };

      this.statusCache.blueprints = status;
      return status;
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus() {
    const [api, database, ai, blueprints] = await Promise.all([
      this.checkAPIServer(),
      this.checkDatabase(),
      this.checkAIService(),
      this.checkBlueprintsEngine()
    ]);

    // Determine overall system status
    const allStatuses = [
      api.status,
      database.status,
      ai.status === 'not_configured' ? 'warning' : ai.status,
      blueprints.status
    ];

    let overallStatus = 'healthy';
    if (allStatuses.includes('unhealthy') || allStatuses.includes('error')) {
      overallStatus = 'unhealthy';
    } else if (allStatuses.includes('warning')) {
      overallStatus = 'degraded';
    }

    return {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        api,
        database,
        ai,
        blueprints
      }
    };
  }

  /**
   * Get cached status (fast, doesn't perform checks)
   */
  getCachedStatus() {
    return {
      overall: this.determineOverallStatus(),
      timestamp: this.lastHealthCheck || new Date().toISOString(),
      services: { ...this.statusCache },
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  /**
   * Determine overall status from cached statuses
   */
  determineOverallStatus() {
    const statuses = Object.values(this.statusCache).map(s => s.status);

    if (statuses.includes('unhealthy') || statuses.includes('error')) {
      return 'unhealthy';
    } else if (statuses.includes('warning') || statuses.includes('not_configured')) {
      return 'degraded';
    } else if (statuses.every(s => s === 'healthy')) {
      return 'healthy';
    }

    return 'unknown';
  }

  /**
   * Format uptime in human-readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}

// Singleton instance
const systemStatus = new SystemStatusService();

module.exports = systemStatus;
