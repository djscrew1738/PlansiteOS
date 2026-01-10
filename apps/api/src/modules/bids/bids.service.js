const logger = require('../../platform/observability/logger');
const correlationId = require('../../platform/observability/CorrelationId');
const db = require('../../platform/config/database');

class BidsService {
  constructor() {
    this.initialized = true;
    this.bidCount = 0;
    this.generatedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Generate a new bid from a blueprint analysis
   * @param {number} blueprintId - Blueprint ID to generate bid from
   * @param {Object} options - Bid generation options
   * @returns {Promise<Object>} Generated bid
   */
  async generateFromBlueprint(blueprintId, options = {}) {
    const startTime = Date.now();
    const corrId = options.correlationId || correlationId.get() || correlationId.generate();
    const client = await db.getClient();

    try {
      this.bidCount++;

      logger.info('Starting bid generation from blueprint', {
        correlationId: corrId,
        blueprintId,
        pricingTier: options.pricingTier || 'standard'
      });

      // Get blueprint
      const blueprintResult = await client.query(
        'SELECT * FROM blueprints WHERE id = $1',
        [blueprintId]
      );

      if (blueprintResult.rows.length === 0) {
        throw new BidError('Blueprint not found', 'BLUEPRINT_NOT_FOUND', corrId);
      }

      const blueprint = blueprintResult.rows[0];

      if (blueprint.status !== 'completed') {
        throw new BidError('Blueprint analysis not complete', 'ANALYSIS_INCOMPLETE', corrId);
      }

      // Get all fixtures for this blueprint
      const fixturesResult = await client.query(
        'SELECT * FROM blueprint_fixtures WHERE blueprint_id = $1 ORDER BY room_name, fixture_type',
        [blueprintId]
      );

      const fixtures = fixturesResult.rows;

      if (fixtures.length === 0) {
        throw new BidError('No fixtures found in blueprint', 'NO_FIXTURES', corrId);
      }

      // Get pricing for fixtures
      const pricingTier = options.pricingTier || 'standard';
      const pricing = await this.getFixturePricing(pricingTier);

      // Generate bid number
      const bidNumber = await this.generateBidNumber();

      // Begin transaction
      await client.query('BEGIN');

      try {
        // Insert main bid record
        const bidResult = await client.query(`
          INSERT INTO bids (
            bid_number, blueprint_id, project_name, project_address, project_type,
            project_description, customer_name, customer_email, customer_phone,
            customer_address, pricing_tier, markup_percent, discount_percent, tax_percent,
            valid_from, valid_until, terms_and_conditions, status, correlation_id,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
          RETURNING *
        `, [
          bidNumber,
          blueprintId,
          options.projectName || blueprint.project_name || 'Untitled Project',
          options.projectAddress || blueprint.project_address,
          options.projectType || 'residential',
          options.projectDescription || null,
          options.customerName || null,
          options.customerEmail || null,
          options.customerPhone || null,
          options.customerAddress || null,
          pricingTier,
          options.markupPercent ?? 15,
          options.discountPercent ?? 0,
          options.taxPercent ?? 0,
          new Date(),
          this.calculateValidUntil(options.validDays || 30),
          options.termsAndConditions || this.getDefaultTerms(),
          'draft',
          corrId
        ]);

        const newBid = bidResult.rows[0];

        // Generate line items from fixtures
        const lineItems = await this.generateLineItems(client, newBid.id, fixtures, pricing, pricingTier);

        // Calculate and update totals
        await this.updateBidTotals(client, newBid.id);

        // Log activity
        await client.query(`
          INSERT INTO bid_activity_log (bid_id, activity_type, description, new_status, correlation_id, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [
          newBid.id,
          'created',
          `Bid generated from blueprint #${blueprintId}`,
          'draft',
          corrId,
          JSON.stringify({ blueprintId, pricingTier, fixtureCount: fixtures.length, lineItemCount: lineItems.length })
        ]);

        // Commit transaction
        await client.query('COMMIT');

        // Fetch complete bid with totals
        const completeBidResult = await client.query('SELECT * FROM bids WHERE id = $1', [newBid.id]);
        const completeBid = completeBidResult.rows[0];

        const duration = Date.now() - startTime;
        this.generatedCount++;

        logger.info('Bid generated successfully', {
          correlationId: corrId,
          bidId: completeBid.id,
          bidNumber: completeBid.bid_number,
          grandTotal: completeBid.grand_total,
          lineItemCount: lineItems.length,
          duration: `${duration}ms`
        });

        return {
          success: true,
          bid: this.formatBidResponse({ ...completeBid, lineItems }),
          generationTime: duration
        };

      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }

    } catch (error) {
      this.errorCount++;
      const duration = Date.now() - startTime;

      logger.error('Bid generation failed', {
        correlationId: corrId,
        blueprintId,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`
      });

      throw error instanceof BidError ? error : new BidError(
        'Failed to generate bid',
        'GENERATION_FAILED',
        corrId,
        error
      );
    } finally {
      client.release();
    }
  }

  /**
   * Generate line items from fixtures
   * @private
   */
  async generateLineItems(client, bidId, fixtures, pricing, pricingTier) {
    const lineItems = [];
    let lineNumber = 1;

    // Group fixtures by type and room
    const fixtureGroups = this.groupFixtures(fixtures);

    for (const group of fixtureGroups) {
      const price = pricing[group.fixture_type] || this.getDefaultPricing(group.fixture_type);

      const unitMaterialCost = parseFloat(price.base_material_cost) || 0;
      const unitLaborCost = parseFloat(price.base_labor_cost) || 0;
      const complexityMultiplier = parseFloat(price.complexity_multiplier) || 1.0;
      const laborHours = parseFloat(price.installation_hours) || 1.0;

      const adjustedMaterialCost = unitMaterialCost * complexityMultiplier;
      const adjustedLaborCost = unitLaborCost * complexityMultiplier;
      const unitTotal = adjustedMaterialCost + adjustedLaborCost;

      const quantity = group.total_quantity;
      const lineMaterialTotal = adjustedMaterialCost * quantity;
      const lineLaborTotal = adjustedLaborCost * quantity;
      const lineTotal = unitTotal * quantity;

      const lineItemResult = await client.query(`
        INSERT INTO bid_line_items (
          bid_id, line_number, item_type, fixture_type, description, room_location,
          quantity, unit, unit_material_cost, unit_labor_cost, unit_total,
          line_material_total, line_labor_total, line_total, labor_hours, labor_rate,
          is_optional, is_included, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        RETURNING *
      `, [
        bidId, lineNumber++, 'fixture', group.fixture_type,
        `${price.description || group.display_name || group.fixture_type} - ${group.room_name || 'Various locations'}`,
        group.room_name, quantity, 'each', adjustedMaterialCost, adjustedLaborCost, unitTotal,
        lineMaterialTotal, lineLaborTotal, lineTotal, laborHours * quantity,
        laborHours > 0 ? unitLaborCost / laborHours : 0, false, true,
        JSON.stringify({ pricingTier, complexityMultiplier, originalFixtureIds: group.fixture_ids })
      ]);

      lineItems.push(lineItemResult.rows[0]);

      // Add permit line item if required
      if (price.permit_required && price.permit_cost > 0) {
        const permitResult = await client.query(`
          INSERT INTO bid_line_items (
            bid_id, line_number, item_type, fixture_type, description, quantity, unit,
            unit_material_cost, unit_labor_cost, unit_total, line_material_total,
            line_labor_total, line_total, is_optional, is_included, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          RETURNING *
        `, [
          bidId, lineNumber++, 'permit', group.fixture_type,
          `Permit fee for ${group.display_name || group.fixture_type}`,
          1, 'each', 0, 0, parseFloat(price.permit_cost), 0, 0,
          parseFloat(price.permit_cost), false, true
        ]);
        lineItems.push(permitResult.rows[0]);
      }
    }

    return lineItems;
  }

  /**
   * Group fixtures by type and room
   * @private
   */
  groupFixtures(fixtures) {
    const groups = {};

    for (const fixture of fixtures) {
      const key = `${fixture.fixture_type}-${fixture.room_name || 'unknown'}`;

      if (!groups[key]) {
        groups[key] = {
          fixture_type: fixture.fixture_type,
          room_name: fixture.room_name,
          display_name: fixture.display_name,
          total_quantity: 0,
          fixture_ids: []
        };
      }

      groups[key].total_quantity += fixture.quantity || 1;
      groups[key].fixture_ids.push(fixture.id);
    }

    return Object.values(groups);
  }

  /**
   * Get fixture pricing for a tier
   * @private
   */
  async getFixturePricing(tier = 'standard') {
    const result = await db.query(`
      SELECT fp.*, ftr.display_name, ftr.category
      FROM fixture_pricing fp
      LEFT JOIN fixture_types_reference ftr ON fp.fixture_type = ftr.fixture_type
      WHERE fp.pricing_tier = $1 AND fp.is_active = true
    `, [tier]);

    const pricingMap = {};
    for (const p of result.rows) {
      pricingMap[p.fixture_type] = p;
    }

    return pricingMap;
  }

  /**
   * Get default pricing for unknown fixture types
   * @private
   */
  getDefaultPricing(fixtureType) {
    return {
      fixture_type: fixtureType,
      base_labor_cost: 200,
      base_material_cost: 100,
      installation_hours: 2,
      complexity_multiplier: 1.0,
      permit_required: false,
      permit_cost: 0,
      description: `${fixtureType} installation`
    };
  }

  /**
   * Update bid totals using database function
   * @private
   */
  async updateBidTotals(client, bidId) {
    await client.query('SELECT update_bid_totals($1)', [bidId]);
  }

  /**
   * Generate unique bid number
   * @private
   */
  async generateBidNumber() {
    const result = await db.query('SELECT generate_bid_number() as bid_number');
    return result.rows[0].bid_number;
  }

  /**
   * Calculate valid until date
   * @private
   */
  calculateValidUntil(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Get default terms and conditions
   * @private
   */
  getDefaultTerms() {
    return `TERMS AND CONDITIONS:

1. VALIDITY: This quote is valid for 30 days from the date of issue.

2. PAYMENT TERMS: 50% deposit required upon acceptance. Balance due upon completion.

3. SCOPE: This quote covers only the work explicitly described. Additional work will be quoted separately.

4. PERMITS: Unless otherwise noted, permit fees are included. Customer is responsible for HOA approvals.

5. WARRANTY: All workmanship is guaranteed for one (1) year from completion date. Manufacturer warranties apply to all fixtures and equipment.

6. ACCESS: Customer agrees to provide reasonable access to work areas during business hours.

7. CHANGES: Any changes to the scope of work must be agreed upon in writing and may affect pricing.

8. CANCELLATION: A 10% cancellation fee applies if cancelled after work has begun.

CTL Plumbing LLC
Licensed & Insured`;
  }

  /**
   * Get all bids with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated bids
   */
  async getAllBids(options = {}) {
    const { page = 1, limit = 20, status, search, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND b.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (b.bid_number ILIKE $${paramCount} OR b.project_name ILIKE $${paramCount} OR b.customer_name ILIKE $${paramCount} OR b.customer_email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await db.query(`SELECT COUNT(*) FROM bids b ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get bids
    const validSortColumns = ['created_at', 'updated_at', 'grand_total', 'bid_number', 'project_name'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    params.push(limit, offset);
    const bidsResult = await db.query(`
      SELECT b.*, bp.file_name as blueprint_file_name, bp.project_name as blueprint_project_name
      FROM bids b
      LEFT JOIN blueprints bp ON b.blueprint_id = bp.id
      ${whereClause}
      ORDER BY b.${sortColumn} ${sortDir}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    return {
      bids: bidsResult.rows.map(b => this.formatBidResponse(b)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: offset + bidsResult.rows.length < total }
    };
  }

  /**
   * Get a single bid by ID
   * @param {number} bidId - Bid ID
   * @returns {Promise<Object>} Bid with line items
   */
  async getBidById(bidId) {
    const bidResult = await db.query(`
      SELECT b.*, bp.file_name as blueprint_file_name, bp.project_name as blueprint_project_name, bp.file_path as blueprint_file_path
      FROM bids b
      LEFT JOIN blueprints bp ON b.blueprint_id = bp.id
      WHERE b.id = $1
    `, [bidId]);

    if (bidResult.rows.length === 0) {
      throw new BidError('Bid not found', 'NOT_FOUND', correlationId.get());
    }

    const bid = bidResult.rows[0];

    // Get line items
    const lineItemsResult = await db.query(`
      SELECT bli.*, ftr.display_name as fixture_display_name, ftr.category as fixture_category
      FROM bid_line_items bli
      LEFT JOIN fixture_types_reference ftr ON bli.fixture_type = ftr.fixture_type
      WHERE bli.bid_id = $1
      ORDER BY bli.line_number
    `, [bidId]);

    // Get activity log
    const activityResult = await db.query(`
      SELECT * FROM bid_activity_log WHERE bid_id = $1 ORDER BY created_at DESC LIMIT 20
    `, [bidId]);

    return {
      ...this.formatBidResponse(bid),
      lineItems: lineItemsResult.rows.map(li => this.formatLineItemResponse(li)),
      activity: activityResult.rows
    };
  }

  /**
   * Update a bid
   * @param {number} bidId - Bid ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated bid
   */
  async updateBid(bidId, updates) {
    const corrId = correlationId.get() || correlationId.generate();

    const existingResult = await db.query('SELECT * FROM bids WHERE id = $1', [bidId]);
    if (existingResult.rows.length === 0) {
      throw new BidError('Bid not found', 'NOT_FOUND', corrId);
    }

    const existingBid = existingResult.rows[0];
    if (['accepted', 'rejected', 'archived'].includes(existingBid.status)) {
      throw new BidError(`Cannot update bid with status: ${existingBid.status}`, 'INVALID_STATUS', corrId);
    }

    const allowedUpdates = ['project_name', 'project_address', 'project_type', 'project_description',
      'customer_name', 'customer_email', 'customer_phone', 'customer_address',
      'markup_percent', 'discount_percent', 'tax_percent', 'valid_until',
      'terms_and_conditions', 'internal_notes', 'customer_notes',
      'estimated_start_date', 'estimated_duration_days'];

    const setClauses = [];
    const values = [];
    let paramCount = 0;

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        paramCount++;
        setClauses.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
      }
    }

    if (setClauses.length === 0) {
      return this.getBidById(bidId);
    }

    paramCount++;
    setClauses.push(`updated_at = NOW()`);
    values.push(bidId);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(`UPDATE bids SET ${setClauses.join(', ')} WHERE id = $${paramCount}`, values);

      // Recalculate totals if pricing fields changed
      if (updates.markup_percent !== undefined || updates.discount_percent !== undefined || updates.tax_percent !== undefined) {
        await this.updateBidTotals(client, bidId);
      }

      // Log activity
      await client.query(`
        INSERT INTO bid_activity_log (bid_id, activity_type, description, correlation_id, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [bidId, 'updated', `Bid updated: ${Object.keys(updates).join(', ')}`, corrId, JSON.stringify(updates)]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    logger.info('Bid updated', { correlationId: corrId, bidId, updatedFields: Object.keys(updates) });
    return this.getBidById(bidId);
  }

  /**
   * Update bid status
   * @param {number} bidId - Bid ID
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Updated bid
   */
  async updateStatus(bidId, newStatus) {
    const corrId = correlationId.get() || correlationId.generate();

    const validStatuses = ['draft', 'pending_review', 'approved', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'archived'];
    if (!validStatuses.includes(newStatus)) {
      throw new BidError(`Invalid status: ${newStatus}`, 'INVALID_STATUS', corrId);
    }

    const existingResult = await db.query('SELECT * FROM bids WHERE id = $1', [bidId]);
    if (existingResult.rows.length === 0) {
      throw new BidError('Bid not found', 'NOT_FOUND', corrId);
    }

    const existingBid = existingResult.rows[0];
    const oldStatus = existingBid.status;

    const validTransitions = {
      'draft': ['pending_review', 'archived'],
      'pending_review': ['approved', 'draft', 'archived'],
      'approved': ['sent', 'draft', 'archived'],
      'sent': ['viewed', 'accepted', 'rejected', 'expired', 'archived'],
      'viewed': ['accepted', 'rejected', 'expired', 'archived'],
      'accepted': ['archived'],
      'rejected': ['draft', 'archived'],
      'expired': ['draft', 'archived'],
      'archived': []
    };

    if (!validTransitions[oldStatus]?.includes(newStatus)) {
      throw new BidError(`Cannot transition from ${oldStatus} to ${newStatus}`, 'INVALID_TRANSITION', corrId);
    }

    let timestampUpdate = '';
    if (newStatus === 'sent') timestampUpdate = ', sent_at = NOW()';
    if (newStatus === 'accepted') timestampUpdate = ', accepted_at = NOW()';
    if (newStatus === 'rejected') timestampUpdate = ', rejected_at = NOW()';
    if (newStatus === 'approved') timestampUpdate = ', approved_at = NOW()';

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(`UPDATE bids SET status = $1, updated_at = NOW() ${timestampUpdate} WHERE id = $2`, [newStatus, bidId]);

      await client.query(`
        INSERT INTO bid_activity_log (bid_id, activity_type, description, old_status, new_status, correlation_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [bidId, 'status_changed', `Status changed from ${oldStatus} to ${newStatus}`, oldStatus, newStatus, corrId]);

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    logger.info('Bid status updated', { correlationId: corrId, bidId, oldStatus, newStatus });
    return this.getBidById(bidId);
  }

  /**
   * Add a line item to a bid
   * @param {number} bidId - Bid ID
   * @param {Object} lineItem - Line item data
   * @returns {Promise<Object>} Created line item
   */
  async addLineItem(bidId, lineItem) {
    const corrId = correlationId.get() || correlationId.generate();

    const bidResult = await db.query('SELECT * FROM bids WHERE id = $1', [bidId]);
    if (bidResult.rows.length === 0) {
      throw new BidError('Bid not found', 'NOT_FOUND', corrId);
    }

    const bid = bidResult.rows[0];
    if (!['draft', 'pending_review'].includes(bid.status)) {
      throw new BidError('Cannot modify bid in current status', 'INVALID_STATUS', corrId);
    }

    // Get next line number
    const maxLineResult = await db.query('SELECT MAX(line_number) as max FROM bid_line_items WHERE bid_id = $1', [bidId]);
    const nextLineNumber = (maxLineResult.rows[0]?.max || 0) + 1;

    const quantity = lineItem.quantity || 1;
    const unitMaterialCost = parseFloat(lineItem.unit_material_cost) || 0;
    const unitLaborCost = parseFloat(lineItem.unit_labor_cost) || 0;
    const unitTotal = unitMaterialCost + unitLaborCost;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const itemResult = await client.query(`
        INSERT INTO bid_line_items (
          bid_id, line_number, item_type, fixture_type, description, room_location,
          quantity, unit, unit_material_cost, unit_labor_cost, unit_total,
          line_material_total, line_labor_total, line_total, labor_hours, notes,
          is_optional, is_included, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING *
      `, [
        bidId, nextLineNumber, lineItem.item_type || 'misc', lineItem.fixture_type || null,
        lineItem.description, lineItem.room_location || null, quantity, lineItem.unit || 'each',
        unitMaterialCost, unitLaborCost, unitTotal, unitMaterialCost * quantity,
        unitLaborCost * quantity, unitTotal * quantity, lineItem.labor_hours || 0,
        lineItem.notes || null, lineItem.is_optional || false, lineItem.is_included !== false
      ]);

      await this.updateBidTotals(client, bidId);

      await client.query(`
        INSERT INTO bid_activity_log (bid_id, activity_type, description, correlation_id, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [bidId, 'line_item_added', `Added line item: ${lineItem.description}`, corrId, JSON.stringify({ lineItemId: itemResult.rows[0].id })]);

      await client.query('COMMIT');

      logger.info('Line item added to bid', { correlationId: corrId, bidId, lineItemId: itemResult.rows[0].id });
      return this.formatLineItemResponse(itemResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Remove a line item from a bid
   * @param {number} bidId - Bid ID
   * @param {number} lineItemId - Line item ID
   * @returns {Promise<boolean>} Success
   */
  async removeLineItem(bidId, lineItemId) {
    const corrId = correlationId.get() || correlationId.generate();

    const bidResult = await db.query('SELECT * FROM bids WHERE id = $1', [bidId]);
    if (bidResult.rows.length === 0) {
      throw new BidError('Bid not found', 'NOT_FOUND', corrId);
    }

    if (!['draft', 'pending_review'].includes(bidResult.rows[0].status)) {
      throw new BidError('Cannot modify bid in current status', 'INVALID_STATUS', corrId);
    }

    const lineItemResult = await db.query('SELECT * FROM bid_line_items WHERE id = $1 AND bid_id = $2', [lineItemId, bidId]);
    if (lineItemResult.rows.length === 0) {
      throw new BidError('Line item not found', 'NOT_FOUND', corrId);
    }

    const lineItem = lineItemResult.rows[0];

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM bid_line_items WHERE id = $1', [lineItemId]);
      await this.updateBidTotals(client, bidId);
      await client.query(`
        INSERT INTO bid_activity_log (bid_id, activity_type, description, correlation_id, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [bidId, 'line_item_removed', `Removed line item: ${lineItem.description}`, corrId, JSON.stringify({ lineItemId, description: lineItem.description })]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    logger.info('Line item removed from bid', { correlationId: corrId, bidId, lineItemId });
    return true;
  }

  /**
   * Clone an existing bid
   * @param {number} bidId - Source bid ID
   * @returns {Promise<Object>} New cloned bid
   */
  async cloneBid(bidId) {
    const corrId = correlationId.get() || correlationId.generate();

    const sourceBid = await this.getBidById(bidId);
    if (!sourceBid) {
      throw new BidError('Source bid not found', 'NOT_FOUND', corrId);
    }

    const newBidNumber = await this.generateBidNumber();

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const newBidResult = await client.query(`
        INSERT INTO bids (
          bid_number, blueprint_id, project_name, project_address, project_type,
          project_description, customer_name, customer_email, customer_phone,
          customer_address, pricing_tier, markup_percent, discount_percent, tax_percent,
          valid_from, valid_until, terms_and_conditions, status, correlation_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW())
        RETURNING *
      `, [
        newBidNumber, sourceBid.blueprintId, `${sourceBid.projectName} (Copy)`,
        sourceBid.projectAddress, sourceBid.projectType, sourceBid.projectDescription,
        sourceBid.customerName, sourceBid.customerEmail, sourceBid.customerPhone,
        sourceBid.customerAddress, sourceBid.pricingTier, sourceBid.markupPercent,
        sourceBid.discountPercent, sourceBid.taxPercent, new Date(),
        this.calculateValidUntil(30), sourceBid.termsAndConditions, 'draft', corrId
      ]);

      const newBid = newBidResult.rows[0];

      // Clone line items
      for (const item of sourceBid.lineItems) {
        await client.query(`
          INSERT INTO bid_line_items (
            bid_id, line_number, item_type, fixture_type, description, room_location,
            quantity, unit, unit_material_cost, unit_labor_cost, unit_total,
            line_material_total, line_labor_total, line_total, labor_hours, notes,
            is_optional, is_included, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        `, [
          newBid.id, item.lineNumber, item.itemType, item.fixtureType, item.description,
          item.roomLocation, item.quantity, item.unit, item.unitMaterialCost,
          item.unitLaborCost, item.unitTotal, item.lineMaterialTotal, item.lineLaborTotal,
          item.lineTotal, item.laborHours, item.notes, item.isOptional, item.isIncluded
        ]);
      }

      await this.updateBidTotals(client, newBid.id);

      await client.query(`
        INSERT INTO bid_activity_log (bid_id, activity_type, description, new_status, correlation_id, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [newBid.id, 'cloned', `Cloned from bid #${sourceBid.bidNumber}`, 'draft', corrId, JSON.stringify({ sourceBidId: bidId, sourceBidNumber: sourceBid.bidNumber })]);

      await client.query('COMMIT');

      logger.info('Bid cloned', { correlationId: corrId, sourceBidId: bidId, newBidId: newBid.id });
      return this.getBidById(newBid.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a bid
   * @param {number} bidId - Bid ID
   * @returns {Promise<boolean>} Success
   */
  async deleteBid(bidId) {
    const corrId = correlationId.get() || correlationId.generate();

    const bidResult = await db.query('SELECT * FROM bids WHERE id = $1', [bidId]);
    if (bidResult.rows.length === 0) {
      throw new BidError('Bid not found', 'NOT_FOUND', corrId);
    }

    const bid = bidResult.rows[0];
    if (bid.status !== 'draft') {
      throw new BidError('Only draft bids can be deleted. Archive the bid instead.', 'INVALID_STATUS', corrId);
    }

    await db.query('DELETE FROM bids WHERE id = $1', [bidId]);
    logger.info('Bid deleted', { correlationId: corrId, bidId, bidNumber: bid.bid_number });
    return true;
  }

  /**
   * Get pricing configuration
   * @param {string} tier - Pricing tier (optional)
   * @returns {Promise<Array>} Pricing data
   */
  async getPricing(tier) {
    let query = `
      SELECT fp.*, ftr.display_name, ftr.category
      FROM fixture_pricing fp
      LEFT JOIN fixture_types_reference ftr ON fp.fixture_type = ftr.fixture_type
      WHERE fp.is_active = true
    `;
    const params = [];

    if (tier) {
      query += ' AND fp.pricing_tier = $1';
      params.push(tier);
    }

    query += ' ORDER BY ftr.category, ftr.display_name, fp.pricing_tier';

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get bid statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const statsResult = await db.query(`
      SELECT
        COUNT(*) as total_bids,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        SUM(grand_total) FILTER (WHERE status = 'accepted') as total_accepted_value,
        AVG(grand_total) as average_bid_value
      FROM bids
    `);

    const stats = statsResult.rows[0];

    const recentResult = await db.query(`
      SELECT id, bid_number, project_name, grand_total, status, created_at
      FROM bids ORDER BY created_at DESC LIMIT 5
    `);

    return {
      counts: {
        total: parseInt(stats.total_bids, 10) || 0,
        draft: parseInt(stats.draft_count, 10) || 0,
        sent: parseInt(stats.sent_count, 10) || 0,
        accepted: parseInt(stats.accepted_count, 10) || 0,
        rejected: parseInt(stats.rejected_count, 10) || 0
      },
      values: {
        totalAccepted: parseFloat(stats.total_accepted_value) || 0,
        averageBid: parseFloat(stats.average_bid_value) || 0
      },
      recentBids: recentResult.rows.map(b => this.formatBidResponse(b))
    };
  }

  /**
   * Format bid for API response
   * @private
   */
  formatBidResponse(bid) {
    return {
      id: bid.id,
      bidNumber: bid.bid_number,
      blueprintId: bid.blueprint_id,
      projectName: bid.project_name,
      projectAddress: bid.project_address,
      projectType: bid.project_type,
      projectDescription: bid.project_description,
      customerName: bid.customer_name,
      customerEmail: bid.customer_email,
      customerPhone: bid.customer_phone,
      customerAddress: bid.customer_address,
      subtotalMaterials: parseFloat(bid.subtotal_materials) || 0,
      subtotalLabor: parseFloat(bid.subtotal_labor) || 0,
      subtotalPermits: parseFloat(bid.subtotal_permits) || 0,
      subtotalOther: parseFloat(bid.subtotal_other) || 0,
      subtotal: parseFloat(bid.subtotal) || 0,
      discountPercent: parseFloat(bid.discount_percent) || 0,
      discountAmount: parseFloat(bid.discount_amount) || 0,
      markupPercent: parseFloat(bid.markup_percent) || 0,
      taxPercent: parseFloat(bid.tax_percent) || 0,
      taxAmount: parseFloat(bid.tax_amount) || 0,
      grandTotal: parseFloat(bid.grand_total) || 0,
      status: bid.status,
      pricingTier: bid.pricing_tier,
      validFrom: bid.valid_from,
      validUntil: bid.valid_until,
      estimatedStartDate: bid.estimated_start_date,
      estimatedDurationDays: bid.estimated_duration_days,
      termsAndConditions: bid.terms_and_conditions,
      internalNotes: bid.internal_notes,
      customerNotes: bid.customer_notes,
      sentAt: bid.sent_at,
      acceptedAt: bid.accepted_at,
      rejectedAt: bid.rejected_at,
      approvedAt: bid.approved_at,
      createdAt: bid.created_at,
      updatedAt: bid.updated_at,
      blueprintFileName: bid.blueprint_file_name,
      blueprintProjectName: bid.blueprint_project_name,
      lineItems: bid.lineItems?.map(li => this.formatLineItemResponse(li))
    };
  }

  /**
   * Format line item for API response
   * @private
   */
  formatLineItemResponse(item) {
    return {
      id: item.id,
      lineNumber: item.line_number,
      itemType: item.item_type,
      fixtureType: item.fixture_type,
      fixtureDisplayName: item.fixture_display_name,
      fixtureCategory: item.fixture_category,
      description: item.description,
      roomLocation: item.room_location,
      quantity: item.quantity,
      unit: item.unit,
      unitMaterialCost: parseFloat(item.unit_material_cost) || 0,
      unitLaborCost: parseFloat(item.unit_labor_cost) || 0,
      unitTotal: parseFloat(item.unit_total) || 0,
      lineMaterialTotal: parseFloat(item.line_material_total) || 0,
      lineLaborTotal: parseFloat(item.line_labor_total) || 0,
      lineTotal: parseFloat(item.line_total) || 0,
      laborHours: parseFloat(item.labor_hours) || 0,
      notes: item.notes,
      isOptional: item.is_optional,
      isIncluded: item.is_included
    };
  }

  getHealth() {
    return {
      initialized: this.initialized,
      bidCount: this.bidCount,
      generatedCount: this.generatedCount,
      errorCount: this.errorCount,
      successRate: this.bidCount > 0 ? ((this.generatedCount / this.bidCount) * 100).toFixed(2) + '%' : 'N/A'
    };
  }

  getMetrics() {
    return { bids: { total: this.bidCount, generated: this.generatedCount, failed: this.errorCount } };
  }
}

class BidError extends Error {
  constructor(message, code, correlationId, originalError) {
    super(message);
    this.name = 'BidError';
    this.code = code;
    this.correlationId = correlationId;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    if (originalError) {
      this.originalMessage = originalError.message;
      this.originalCode = originalError.code;
      this.stack = originalError.stack;
    }
  }

  toJSON() {
    return { name: this.name, message: this.message, code: this.code, correlationId: this.correlationId, timestamp: this.timestamp, originalMessage: this.originalMessage };
  }
}

module.exports = new BidsService();
module.exports.BidError = BidError;
