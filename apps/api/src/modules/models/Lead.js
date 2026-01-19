const db = require('../../platform/config/database');
const logger = require('../../platform/observability/logger');

/**
 * Lead Model
 * Handles database operations for lead management
 */
class Lead {
  /**
   * Find lead by post URL (for duplicate detection)
   * @param {string} postUrl - URL of the Facebook post
   * @returns {Promise<Object|null>} Lead object or null
   */
  static async findByUrl(postUrl) {
    try {
      const query = `
        SELECT * FROM leads
        WHERE post_url = $1
        LIMIT 1
      `;

      const result = await db.query(query, [postUrl]);

      if (result.rows.length === 0) {
        return null;
      }

      return this._mapRow(result.rows[0]);
    } catch (error) {
      logger.error('Error finding lead by URL', {
        error: error.message,
        post_url: postUrl
      });
      throw error;
    }
  }

  /**
   * Find lead by ID
   * @param {number} id - Lead ID
   * @returns {Promise<Object|null>} Lead object or null
   */
  static async findById(id) {
    try {
      const query = `
        SELECT * FROM leads
        WHERE id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this._mapRow(result.rows[0]);
    } catch (error) {
      logger.error('Error finding lead by ID', {
        error: error.message,
        lead_id: id
      });
      throw error;
    }
  }

  /**
   * Get all leads with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of lead objects
   */
  static async findAll(filters = {}) {
    try {
      const {
        status,
        priority,
        minScore,
        city,
        county,
        limit = 50,
        offset = 0
      } = filters;

      const conditions = [];
      const params = [];
      let paramCount = 1;

      if (status) {
        conditions.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (priority) {
        conditions.push(`priority = $${paramCount++}`);
        params.push(priority);
      }

      if (minScore !== undefined) {
        conditions.push(`ai_score >= $${paramCount++}`);
        params.push(minScore);
      }

      if (city) {
        conditions.push(`LOWER(city) = LOWER($${paramCount++})`);
        params.push(city);
      }

      if (county) {
        conditions.push(`LOWER(county) = LOWER($${paramCount++})`);
        params.push(county);
      }

      const whereClause = conditions.length > 0
        ? 'WHERE ' + conditions.join(' AND ')
        : '';

      params.push(limit, offset);

      const query = `
        SELECT * FROM leads
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount++} OFFSET $${paramCount}
      `;

      const result = await db.query(query, params);

      return result.rows.map(row => this._mapRow(row));
    } catch (error) {
      logger.error('Error finding leads', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get high priority leads (score >= 70, status new/contacted)
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Array of high-priority leads
   */
  static async getHighPriority(limit = 20) {
    try {
      const query = `
        SELECT * FROM high_priority_leads
        LIMIT $1
      `;

      const result = await db.query(query, [limit]);

      return result.rows.map(row => ({
        id: row.id,
        city: row.city,
        county: row.county,
        jobType: row.job_type,
        aiScore: row.ai_score,
        urgency: row.urgency,
        status: row.status,
        createdAt: row.created_at,
        inPrimaryServiceArea: row.in_primary_service_area,
        ageHours: parseFloat(row.age_hours)
      }));
    } catch (error) {
      logger.error('Error getting high priority leads', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update lead status
   * @param {number} id - Lead ID
   * @param {string} newStatus - New status
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated lead
   */
  static async updateStatus(id, newStatus, notes = null) {
    try {
      await db.query('SELECT update_lead_status($1, $2, $3)', [
        id,
        newStatus,
        notes
      ]);

      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating lead status', {
        error: error.message,
        lead_id: id,
        new_status: newStatus
      });
      throw error;
    }
  }

  /**
   * Update lead
   * @param {number} id - Lead ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated lead
   */
  static async update(id, updates) {
    try {
      const allowedFields = [
        'status',
        'priority',
        'assigned_to',
        'notes',
        'follow_up_at',
        'contacted_at',
        'estimated_value',
        'job_description',
        'tags',
        'metadata'
      ];

      const fields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = $${paramCount++}`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);

      const query = `
        UPDATE leads
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return this._mapRow(result.rows[0]);
    } catch (error) {
      logger.error('Error updating lead', {
        error: error.message,
        lead_id: id
      });
      throw error;
    }
  }

  /**
   * Delete lead
   * @param {number} id - Lead ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM leads WHERE id = $1';
      const result = await db.query(query, [id]);

      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting lead', {
        error: error.message,
        lead_id: id
      });
      throw error;
    }
  }

  /**
   * Get lead statistics
   * @returns {Promise<Object>} Lead statistics
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'new') as new,
          COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
          COUNT(*) FILTER (WHERE status = 'quoted') as quoted,
          COUNT(*) FILTER (WHERE status = 'won') as won,
          COUNT(*) FILTER (WHERE status = 'lost') as lost,
          AVG(ai_score) as avg_score,
          COUNT(*) FILTER (WHERE ai_score >= 70) as high_confidence,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days
        FROM leads
        WHERE status != 'spam'
      `;

      const result = await db.query(query);

      return {
        total: parseInt(result.rows[0].total),
        byStatus: {
          new: parseInt(result.rows[0].new),
          contacted: parseInt(result.rows[0].contacted),
          quoted: parseInt(result.rows[0].quoted),
          won: parseInt(result.rows[0].won),
          lost: parseInt(result.rows[0].lost)
        },
        avgScore: parseFloat(result.rows[0].avg_score) || 0,
        highConfidence: parseInt(result.rows[0].high_confidence),
        last7Days: parseInt(result.rows[0].last_7_days),
        last30Days: parseInt(result.rows[0].last_30_days)
      };
    } catch (error) {
      logger.error('Error getting lead statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Map database row to Lead object
   * @private
   */
  static _mapRow(row) {
    return {
      id: row.id,
      source: row.source,
      postUrl: row.post_url,
      postText: row.post_text,
      location: row.location,
      contactInfo: row.contact_info,
      city: row.city,
      county: row.county,
      zipCode: row.zip_code,
      jobType: row.job_type,
      jobDescription: row.job_description,
      estimatedValue: row.estimated_value ? parseFloat(row.estimated_value) : null,
      urgency: row.urgency,
      aiScore: row.ai_score,
      aiAnalysis: row.ai_analysis,
      aiRecommendedResponse: row.ai_recommended_response,
      status: row.status,
      priority: row.priority,
      assignedTo: row.assigned_to,
      contactedAt: row.contacted_at,
      followUpAt: row.follow_up_at,
      closedAt: row.closed_at,
      closedReason: row.closed_reason,
      postedAt: row.posted_at,
      correlationId: row.correlation_id,
      notes: row.notes,
      tags: row.tags,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = Lead;
