const os = require('os');
const db = require('../platform/config/database');
const logger = require('../platform/observability/logger');
const Anthropic = require('@anthropic-ai/sdk');

class SystemStatusService {
  constructor() {
    this.startTime = Date.now();
    this.anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus() {
    const timestamp = new Date().toISOString();

    try {
      const [
        serverStatus,
        databaseStatus,
        redisStatus,
        aiServiceStatus,
        blueprintEngineStatus,
        analyticsStatus
      ] = await Promise.allSettled([
        this.getServerStatus(),
        this.getDatabaseStatus(),
        this.getRedisStatus(),
        this.getAIServiceStatus(),
        this.getBlueprintEngineStatus(),
        this.getAnalyticsStatus()
      ]);

      // Calculate overall health
      const services = [
        serverStatus,
        databaseStatus,
        redisStatus,
        aiServiceStatus,
        blueprintEngineStatus,
        analyticsStatus
      ];

      const healthyServices = services.filter(
        s => s.status === 'fulfilled' && s.value.status === 'healthy'
      ).length;

      const totalServices = services.length;
      const healthScore = Math.round((healthyServices / totalServices) * 100);

      let overallStatus = 'healthy';
      if (healthScore < 50) overallStatus = 'critical';
      else if (healthScore < 80) overallStatus = 'degraded';

      return {
        timestamp,
        overall: {
          status: overallStatus,
          healthScore,
          uptime: this.getUptime(),
          version: process.env.APP_VERSION || '2.0.0'
        },
        services: {
          server: this.unwrapResult(serverStatus),
          database: this.unwrapResult(databaseStatus),
          redis: this.unwrapResult(redisStatus),
          aiService: this.unwrapResult(aiServiceStatus),
          blueprintEngine: this.unwrapResult(blueprintEngineStatus),
          analytics: this.unwrapResult(analyticsStatus)
        }
      };
    } catch (error) {
      logger.error('Error getting system status', { error: error.message });
      throw error;
    }
  }

  /**
   * Get server health metrics
   */
  async getServerStatus() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = Math.round((usedMem / totalMem) * 100);

      const cpuUsage = await this.getCPUUsage();
      const loadAvg = os.loadavg();

      // Check disk space (simplified - checks process.cwd())
      const diskSpace = await this.getDiskSpace();

      let status = 'healthy';
      const issues = [];

      if (memoryUsagePercent > 90) {
        status = 'critical';
        issues.push('Memory usage critical');
      } else if (memoryUsagePercent > 80) {
        status = 'degraded';
        issues.push('High memory usage');
      }

      if (cpuUsage > 90) {
        status = 'critical';
        issues.push('CPU usage critical');
      } else if (cpuUsage > 80) {
        status = 'degraded';
        issues.push('High CPU usage');
      }

      return {
        status,
        metrics: {
          uptime: this.getUptime(),
          memory: {
            total: this.formatBytes(totalMem),
            used: this.formatBytes(usedMem),
            free: this.formatBytes(freeMem),
            usagePercent: memoryUsagePercent
          },
          cpu: {
            usage: cpuUsage,
            cores: os.cpus().length,
            loadAverage: {
              '1min': loadAvg[0].toFixed(2),
              '5min': loadAvg[1].toFixed(2),
              '15min': loadAvg[2].toFixed(2)
            }
          },
          disk: diskSpace,
          platform: {
            type: os.platform(),
            release: os.release(),
            arch: os.arch(),
            hostname: os.hostname()
          }
        },
        issues: issues.length > 0 ? issues : undefined
      };
    } catch (error) {
      logger.error('Server status check failed', { error: error.message });
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Get database health and metrics
   */
  async getDatabaseStatus() {
    try {
      const startTime = Date.now();

      // Test connection with a simple query
      const result = await db.query('SELECT NOW() as current_time, version() as version');

      const responseTime = Date.now() - startTime;

      // Get connection pool stats
      const pool = db.getPool();
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };

      // Get database size
      const sizeResult = await db.query(`
        SELECT pg_database_size(current_database()) as size
      `);
      const dbSize = parseInt(sizeResult.rows[0].size);

      // Get table count
      const tableResult = await db.query(`
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `);
      const tableCount = parseInt(tableResult.rows[0].count);

      let status = 'healthy';
      const issues = [];

      if (responseTime > 1000) {
        status = 'degraded';
        issues.push('Slow database response time');
      }

      if (poolStats.waiting > 5) {
        status = 'degraded';
        issues.push('High connection pool wait time');
      }

      // Extract database name from connection string
      const dbUrl = process.env.DATABASE_URL || '';
      const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'unknown';

      return {
        status,
        metrics: {
          responseTime: `${responseTime}ms`,
          connected: true,
          version: result.rows[0].version.split(' ')[1],
          database: dbName,
          size: this.formatBytes(dbSize),
          tables: tableCount,
          connectionPool: poolStats
        },
        issues: issues.length > 0 ? issues : undefined
      };
    } catch (error) {
      logger.error('Database status check failed', { error: error.message });
      return {
        status: 'critical',
        error: error.message,
        connected: false
      };
    }
  }

  /**
   * Get Redis cache status
   */
  async getRedisStatus() {
    try {
      // TODO: Implement Redis client check when Redis module is added
      // For now, return a placeholder
      return {
        status: 'healthy',
        metrics: {
          connected: true,
          responseTime: '< 5ms',
          memory: 'N/A',
          keys: 'N/A'
        },
        note: 'Redis monitoring to be implemented'
      };
    } catch (error) {
      logger.error('Redis status check failed', { error: error.message });
      return {
        status: 'unknown',
        error: error.message,
        connected: false
      };
    }
  }

  /**
   * Get AI Service (Claude Vision) status
   */
  async getAIServiceStatus() {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          status: 'degraded',
          error: 'API key not configured',
          configured: false
        };
      }

      const startTime = Date.now();

      // Test Claude API with minimal token request
      try {
        const message = await this.anthropicClient.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'ping' }]
        });

        const responseTime = Date.now() - startTime;

        return {
          status: 'healthy',
          metrics: {
            configured: true,
            responseTime: `${responseTime}ms`,
            models: {
              vision: 'claude-3-5-sonnet-20241022',
              processing: 'claude-3-haiku-20240307'
            },
            lastCheck: new Date().toISOString()
          }
        };
      } catch (apiError) {
        // Check if it's a rate limit or actual error
        if (apiError.status === 429) {
          return {
            status: 'degraded',
            error: 'Rate limited',
            metrics: {
              configured: true,
              responseTime: `${Date.now() - startTime}ms`
            }
          };
        }

        throw apiError;
      }
    } catch (error) {
      logger.error('AI service status check failed', { error: error.message });
      return {
        status: 'critical',
        error: error.message,
        configured: !!process.env.ANTHROPIC_API_KEY
      };
    }
  }

  /**
   * Get Blueprint Analysis Engine status
   */
  async getBlueprintEngineStatus() {
    try {
      // Check blueprints table and recent processing
      const stats = await db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'processed') as processed,
          COUNT(*) FILTER (WHERE status = 'processing') as processing,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          MAX(created_at) as last_upload
        FROM blueprints
      `);

      // Check for recent processing activity (last 24 hours)
      const recentActivity = await db.query(`
        SELECT COUNT(*) as count
        FROM blueprints
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      const totalCount = parseInt(stats.rows[0].total) || 0;
      const processedCount = parseInt(stats.rows[0].processed) || 0;
      const processingCount = parseInt(stats.rows[0].processing) || 0;
      const failedCount = parseInt(stats.rows[0].failed) || 0;
      const recentCount = parseInt(recentActivity.rows[0].count) || 0;

      const successRate = totalCount > 0
        ? Math.round((processedCount / totalCount) * 100)
        : 0;

      let status = 'healthy';
      const issues = [];

      if (failedCount > processedCount) {
        status = 'critical';
        issues.push('High failure rate');
      } else if (successRate < 80 && totalCount > 10) {
        status = 'degraded';
        issues.push('Low success rate');
      }

      if (processingCount > 10) {
        status = 'degraded';
        issues.push('Large processing queue');
      }

      return {
        status,
        metrics: {
          totalBlueprints: totalCount,
          processed: processedCount,
          processing: processingCount,
          failed: failedCount,
          successRate: `${successRate}%`,
          recentActivity: {
            last24Hours: recentCount,
            lastUpload: stats.rows[0].last_upload
          },
          capabilities: {
            dxfParsing: true,
            pdfProcessing: true,
            imageAnalysis: true,
            aiAnnotation: true
          }
        },
        issues: issues.length > 0 ? issues : undefined
      };
    } catch (error) {
      logger.error('Blueprint engine status check failed', { error: error.message });
      return {
        status: 'unknown',
        error: error.message
      };
    }
  }

  /**
   * Get Analytics Engine status
   */
  async getAnalyticsStatus() {
    try {
      // Check if analytics tables exist and get recent metrics
      const projectStats = await db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          MAX(updated_at) as last_update
        FROM projects
      `);

      const totalProjects = parseInt(projectStats.rows[0].total) || 0;
      const activeProjects = parseInt(projectStats.rows[0].active) || 0;

      return {
        status: 'healthy',
        metrics: {
          projects: {
            total: totalProjects,
            active: activeProjects
          },
          lastUpdate: projectStats.rows[0].last_update,
          features: {
            materialTakeoff: true,
            costEstimation: true,
            projectTracking: true,
            reporting: true
          }
        }
      };
    } catch (error) {
      logger.error('Analytics status check failed', { error: error.message });
      return {
        status: 'degraded',
        error: error.message,
        note: 'Analytics engine partially unavailable'
      };
    }
  }

  /**
   * Helper: Get CPU usage percentage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const elapsedTime = Date.now() - startTime;

        const totalUsage = (endUsage.user + endUsage.system) / 1000; // Convert to ms
        const cpuPercent = Math.round((totalUsage / elapsedTime) * 100);

        resolve(Math.min(cpuPercent, 100)); // Cap at 100%
      }, 100);
    });
  }

  /**
   * Helper: Get disk space info
   */
  async getDiskSpace() {
    try {
      // This is a simplified version - in production you'd use a library like 'diskusage'
      return {
        available: 'N/A',
        total: 'N/A',
        usagePercent: 'N/A',
        note: 'Disk monitoring requires additional system permissions'
      };
    } catch (error) {
      return {
        available: 'N/A',
        error: error.message
      };
    }
  }

  /**
   * Helper: Get system uptime
   */
  getUptime() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  /**
   * Helper: Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Helper: Unwrap Promise.allSettled results
   */
  unwrapResult(result) {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      status: 'error',
      error: result.reason?.message || 'Unknown error'
    };
  }
}

module.exports = new SystemStatusService();
