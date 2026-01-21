const db = require('../../platform/config/database');
const logger = require('../../platform/observability/logger');

/**
 * Analytics Service
 * Provides aggregated statistics and metrics for the dashboard
 */
class AnalyticsService {
  /**
   * Get dashboard statistics with trends
   * @param {Object} options - Query options
   * @param {string} options.dateRange - Date range filter (today, last7days, last30days, etc.)
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats(options = {}) {
    const { dateRange = 'last30days' } = options;

    try {
      const { startDate, previousStartDate } = this._getDateRange(dateRange);

      // Run all queries in parallel for better performance
      const [
        blueprintStats,
        previousBlueprintStats,
        analysisTimeStats,
        previousAnalysisTimeStats,
        successRateStats,
        fixtureStats,
        recentBlueprints,
        activityData,
        statusDistribution
      ] = await Promise.all([
        this._getBlueprintCount(startDate),
        this._getBlueprintCount(previousStartDate, startDate),
        this._getAnalysisTimeStats(startDate),
        this._getAnalysisTimeStats(previousStartDate, startDate),
        this._getSuccessRateStats(startDate),
        this._getTotalFixtures(startDate),
        this._getRecentBlueprints(10),
        this._getActivityData(startDate),
        this._getStatusDistribution(startDate)
      ]);

      // Calculate trends
      const blueprintTrend = this._calculateTrend(
        blueprintStats.total,
        previousBlueprintStats.total
      );

      const analysisTimeTrend = this._calculateTrend(
        previousAnalysisTimeStats.avgTime, // Lower is better
        analysisTimeStats.avgTime
      );

      return {
        blueprints: {
          total: blueprintStats.total,
          trend: blueprintTrend.direction,
          percentChange: blueprintTrend.percent,
          current: blueprintStats.total,
          previous: previousBlueprintStats.total
        },
        analysis: {
          averageTime: analysisTimeStats.avgTime,
          trend: analysisTimeTrend.direction,
          percentChange: analysisTimeTrend.percent,
          successRate: successRateStats.successRate,
          totalAnalyses: successRateStats.total,
          successfulAnalyses: successRateStats.successful
        },
        fixtures: {
          total: fixtureStats.total,
          byType: fixtureStats.byType,
          average: fixtureStats.average
        },
        recentBlueprints: recentBlueprints.map(bp => ({
          id: bp.id,
          projectName: bp.project_name || 'Untitled Project',
          status: bp.status,
          totalFixtures: bp.total_fixtures || 0,
          createdAt: bp.created_at,
          analysisTime: bp.analysis_time
        })),
        activityData,
        statusDistribution,
        dateRange: {
          current: { start: startDate, end: new Date() },
          previous: { start: previousStartDate, end: startDate }
        }
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error: error.message });
      throw new Error('Failed to fetch analytics data');
    }
  }

  /**
   * Get blueprint activity over time
   * @param {Date} startDate - Start date for the query
   * @returns {Promise<Array>} Activity data
   */
  async _getActivityData(startDate) {
    const query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) FILTER (WHERE status IN ('completed', 'processing', 'failed')) as uploaded,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM blueprints
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const result = await db.query(query, [startDate]);
    return result.rows.map(row => ({
      date: row.date,
      uploaded: parseInt(row.uploaded),
      completed: parseInt(row.completed),
      failed: parseInt(row.failed)
    }));
  }

  /**
   * Get status distribution
   * @param {Date} startDate - Start date for the query
   * @returns {Promise<Array>} Status distribution
   */
  async _getStatusDistribution(startDate) {
    const query = `
      SELECT
        status,
        COUNT(*) as count
      FROM blueprints
      WHERE created_at >= $1
      GROUP BY status
      ORDER BY count DESC
    `;

    const result = await db.query(query, [startDate]);

    const statusColors = {
      completed: '#10B981',
      processing: '#F59E0B',
      pending: '#6B7280',
      failed: '#EF4444'
    };

    return result.rows.map(row => ({
      name: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      value: parseInt(row.count),
      color: statusColors[row.status] || '#6B7280'
    }));
  }

  /**
   * Get blueprint count for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} Blueprint count
   */
  async _getBlueprintCount(startDate, endDate = null) {
    const query = endDate
      ? `SELECT COUNT(*) as total FROM blueprints WHERE created_at >= $1 AND created_at < $2`
      : `SELECT COUNT(*) as total FROM blueprints WHERE created_at >= $1`;

    const params = endDate ? [startDate, endDate] : [startDate];
    const result = await db.query(query, params);

    return {
      total: parseInt(result.rows[0].total)
    };
  }

  /**
   * Get analysis time statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} Analysis time stats
   */
  async _getAnalysisTimeStats(startDate, endDate = null) {
    const query = endDate
      ? `
        SELECT
          ROUND(AVG(EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as avg_time,
          ROUND(MIN(EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as min_time,
          ROUND(MAX(EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as max_time
        FROM blueprints
        WHERE status = 'completed'
          AND analysis_started_at IS NOT NULL
          AND analysis_completed_at IS NOT NULL
          AND created_at >= $1
          AND created_at < $2
      `
      : `
        SELECT
          ROUND(AVG(EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as avg_time,
          ROUND(MIN(EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as min_time,
          ROUND(MAX(EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as max_time
        FROM blueprints
        WHERE status = 'completed'
          AND analysis_started_at IS NOT NULL
          AND analysis_completed_at IS NOT NULL
          AND created_at >= $1
      `;

    const params = endDate ? [startDate, endDate] : [startDate];
    const result = await db.query(query, params);

    return {
      avgTime: parseFloat(result.rows[0].avg_time) || 0,
      minTime: parseFloat(result.rows[0].min_time) || 0,
      maxTime: parseFloat(result.rows[0].max_time) || 0
    };
  }

  /**
   * Get success rate statistics
   * @param {Date} startDate - Start date
   * @returns {Promise<Object>} Success rate stats
   */
  async _getSuccessRateStats(startDate) {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM blueprints
      WHERE created_at >= $1
        AND status IN ('completed', 'failed')
    `;

    const result = await db.query(query, [startDate]);
    const total = parseInt(result.rows[0].total);
    const successful = parseInt(result.rows[0].successful);

    return {
      total,
      successful,
      failed: parseInt(result.rows[0].failed),
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0
    };
  }

  /**
   * Get total fixtures detected
   * @param {Date} startDate - Start date
   * @returns {Promise<Object>} Fixture statistics
   */
  async _getTotalFixtures(startDate) {
    const totalQuery = `
      SELECT
        COALESCE(SUM(total_fixtures), 0) as total,
        ROUND(AVG(total_fixtures), 2) as average
      FROM blueprints
      WHERE created_at >= $1
        AND status = 'completed'
    `;

    const byTypeQuery = `
      SELECT
        bf.fixture_type,
        COUNT(*) as count,
        ROUND(AVG(bf.confidence_score), 2) as avg_confidence
      FROM blueprint_fixtures bf
      INNER JOIN blueprints b ON b.id = bf.blueprint_id
      WHERE b.created_at >= $1
        AND b.status = 'completed'
      GROUP BY bf.fixture_type
      ORDER BY count DESC
      LIMIT 10
    `;

    const [totalResult, byTypeResult] = await Promise.all([
      db.query(totalQuery, [startDate]),
      db.query(byTypeQuery, [startDate])
    ]);

    return {
      total: parseInt(totalResult.rows[0].total) || 0,
      average: parseFloat(totalResult.rows[0].average) || 0,
      byType: byTypeResult.rows.map(row => ({
        name: this._formatFixtureName(row.fixture_type),
        type: row.fixture_type,
        count: parseInt(row.count),
        avgConfidence: parseFloat(row.avg_confidence)
      }))
    };
  }

  /**
   * Get recent blueprints
   * @param {number} limit - Number of blueprints to fetch
   * @returns {Promise<Array>} Recent blueprints
   */
  async _getRecentBlueprints(limit = 10) {
    const query = `
      SELECT
        id,
        project_name,
        status,
        total_fixtures,
        created_at,
        EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at)) as analysis_time
      FROM blueprints
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get date range based on filter
   * @param {string} dateRange - Date range filter
   * @returns {Object} Start and previous start dates
   */
  _getDateRange(dateRange) {
    const now = new Date();
    let startDate, previousStartDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;

      case 'last7days':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;

      case 'last30days':
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        previousStartDate = new Date(startDate);
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        break;

      case 'thismonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        break;

      case 'lastmonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;

      case 'thisyear':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        break;
    }

    return { startDate, previousStartDate };
  }

  /**
   * Calculate trend direction and percentage
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {Object} Trend direction and percentage
   */
  _calculateTrend(current, previous) {
    if (previous === 0) {
      return { direction: current > 0 ? 'up' : 'neutral', percent: 0 };
    }

    const percentChange = Math.round(((current - previous) / previous) * 100);

    return {
      direction: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
      percent: Math.abs(percentChange)
    };
  }

  /**
   * Format fixture type name for display
   * @param {string} fixtureType - Fixture type
   * @returns {string} Formatted name
   */
  _formatFixtureName(fixtureType) {
    const names = {
      lavatory: 'Lavatories',
      toilet: 'Toilets',
      sink: 'Sinks',
      shower: 'Showers',
      bathtub: 'Bathtubs',
      water_heater: 'Water Heaters',
      hose_bib: 'Hose Bibs',
      kitchen_sink: 'Kitchen Sinks',
      washing_machine: 'Washing Machines',
      dishwasher: 'Dishwashers',
      urinal: 'Urinals',
      floor_drain: 'Floor Drains',
      utility_sink: 'Utility Sinks',
      drinking_fountain: 'Drinking Fountains',
      water_closet: 'Water Closets'
    };

    return names[fixtureType] || fixtureType.split('_').map(w =>
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }

  /**
   * Get fixture type breakdown with counts
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Fixture breakdown
   */
  async getFixtureBreakdown(options = {}) {
    const { dateRange = 'last30days', limit = 20 } = options;
    const { startDate } = this._getDateRange(dateRange);

    const query = `
      SELECT
        bf.fixture_type,
        COUNT(*) as count,
        ROUND(AVG(bf.confidence_score), 2) as avg_confidence,
        COUNT(DISTINCT bf.blueprint_id) as blueprint_count
      FROM blueprint_fixtures bf
      INNER JOIN blueprints b ON b.id = bf.blueprint_id
      WHERE b.created_at >= $1
        AND b.status = 'completed'
      GROUP BY bf.fixture_type
      ORDER BY count DESC
      LIMIT $2
    `;

    const result = await db.query(query, [startDate, limit]);

    return result.rows.map(row => ({
      name: this._formatFixtureName(row.fixture_type),
      type: row.fixture_type,
      count: parseInt(row.count),
      avgConfidence: parseFloat(row.avg_confidence) || 0,
      blueprintCount: parseInt(row.blueprint_count)
    }));
  }

  /**
   * Get performance metrics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics(options = {}) {
    const { dateRange = 'last30days' } = options;
    const { startDate } = this._getDateRange(dateRange);

    const query = `
      SELECT
        COUNT(*) as total_analyses,
        COUNT(*) FILTER (WHERE status = 'completed') as successful,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        ROUND(AVG(EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as avg_time,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as median_time,
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (analysis_completed_at - analysis_started_at))), 2) as p95_time
      FROM blueprints
      WHERE created_at >= $1
        AND status IN ('completed', 'failed')
        AND analysis_started_at IS NOT NULL
    `;

    const result = await db.query(query, [startDate]);
    const row = result.rows[0];

    return {
      totalAnalyses: parseInt(row.total_analyses) || 0,
      successful: parseInt(row.successful) || 0,
      failed: parseInt(row.failed) || 0,
      successRate: row.total_analyses > 0
        ? Math.round((row.successful / row.total_analyses) * 100)
        : 0,
      avgTime: parseFloat(row.avg_time) || 0,
      medianTime: parseFloat(row.median_time) || 0,
      p95Time: parseFloat(row.p95_time) || 0
    };
  }
}

module.exports = new AnalyticsService();
