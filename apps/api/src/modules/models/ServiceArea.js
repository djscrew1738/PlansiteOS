const db = require('../../platform/config/database');
const logger = require('../../platform/observability/logger');

/**
 * ServiceArea Model
 * Handles service area queries and matching
 */
class ServiceArea {
  /**
   * Check if location matches service area
   * @param {string} city - City name
   * @param {string} county - County name
   * @returns {Promise<boolean>} True if in service area
   */
  static async matchesServiceArea(city, county) {
    try {
      const query = `SELECT is_in_service_area($1, $2) as in_area`;
      const result = await db.query(query, [city, county]);

      return result.rows[0].in_area;
    } catch (error) {
      logger.error('Error checking service area', {
        error: error.message,
        city,
        county
      });
      // Default to false on error
      return false;
    }
  }

  /**
   * Get priority score for location
   * @param {string} city - City name
   * @param {string} county - County name
   * @returns {Promise<number>} Priority score (0-100)
   */
  static async getPriority(city, county) {
    try {
      const query = `SELECT get_service_area_priority($1, $2) as priority`;
      const result = await db.query(query, [city, county]);

      return result.rows[0].priority || 0;
    } catch (error) {
      logger.error('Error getting service area priority', {
        error: error.message,
        city,
        county
      });
      return 0;
    }
  }

  /**
   * Get all service areas
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Service areas
   */
  static async findAll(filters = {}) {
    try {
      const { active = true, isPrimary } = filters;

      const conditions = ['1=1'];
      const params = [];
      let paramCount = 1;

      if (active !== undefined) {
        conditions.push(`active = $${paramCount++}`);
        params.push(active);
      }

      if (isPrimary !== undefined) {
        conditions.push(`is_primary = $${paramCount++}`);
        params.push(isPrimary);
      }

      const query = `
        SELECT * FROM service_areas
        WHERE ${conditions.join(' AND ')}
        ORDER BY is_primary DESC, county, city
      `;

      const result = await db.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        city: row.city,
        county: row.county,
        zipCodes: row.zip_codes,
        state: row.state,
        isPrimary: row.is_primary,
        serviceLevel: row.service_level,
        responseTimeHours: row.response_time_hours,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        radiusMiles: row.radius_miles,
        notes: row.notes,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('Error finding service areas', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  /**
   * Get service area by ID
   * @param {number} id - Service area ID
   * @returns {Promise<Object|null>} Service area
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM service_areas WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        city: row.city,
        county: row.county,
        zipCodes: row.zip_codes,
        state: row.state,
        isPrimary: row.is_primary,
        serviceLevel: row.service_level,
        responseTimeHours: row.response_time_hours,
        latitude: row.latitude ? parseFloat(row.latitude) : null,
        longitude: row.longitude ? parseFloat(row.longitude) : null,
        radiusMiles: row.radius_miles,
        notes: row.notes,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      logger.error('Error finding service area by ID', {
        error: error.message,
        id
      });
      throw error;
    }
  }
}

module.exports = ServiceArea;
