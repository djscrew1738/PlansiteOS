const logger = require('../../platform/observability/logger');
const correlationId = require('../../platform/observability/CorrelationId');
const CircuitBreaker = require('../../platform/middleware/CircuitBreaker');
const db = require('@pipelineos/db');
const { AIClient } = require('@pipelineos/ai-core');
const { blueprintAnalysisSchema } = require('../../schemas/blueprint.schema');
const blueprintAnalyzerPrompt = require('@pipelineos/ai-core/src/prompts/blueprint_analyzer.prompt');
const fs = require('fs').promises;
const path = require('path');

class BlueprintService {
  constructor() {
    this.aiClient = new AIClient();
    this.initialized = true;
    this.analysisCount = 0;
    this.successCount = 0;
    this.errorCount = 0;

    // Circuit breaker for Claude Vision API
    this.circuitBreaker = new CircuitBreaker('claude-vision-api', {
      failureThreshold: 5,
      successThreshold: 3,
      resetTimeout: 120000,
      timeout: 120000, // 2 minutes for image analysis
      monitoringPeriod: 300000
    });
  }
  
  /**
   * Analyze a blueprint image and extract fixture information
   *
   * @param {string} filePath - Path to the blueprint file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeBlueprint(filePath, options = {}) {
    const startTime = Date.now();
    const corrId = options.correlationId || correlationId.get() || correlationId.generate();

    return correlationId.run(corrId, async () => {
      try {
        this.analysisCount++;

        logger.info('Starting blueprint analysis', {
          correlationId: corrId,
          filePath: filePath,
          projectName: options.projectName
        });

        // Step 1: Analyze with Claude Vision
        const visionAnalysis = await this.circuitBreaker.execute(async () => {
          return await this.aiClient.analyzeImage(filePath, blueprintAnalyzerPrompt, {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096
          });
        }, { correlationId: corrId });


        // Step 2: Parse and structure the results
        const structuredResults = this.parseAnalysisResults(visionAnalysis);

        // Step 3: Validate and enrich data
        const enrichedResults = await this.enrichFixtureData(structuredResults);

        const duration = Date.now() - startTime;
        this.successCount++;

        logger.info('Blueprint analysis completed', {
          correlationId: corrId,
          totalFixtures: enrichedResults.totalFixtures,
          roomCount: enrichedResults.rooms.length,
          duration: `${duration}ms`
        });

        return {
          success: true,
          correlationId: corrId,
          ...enrichedResults,
          analysisTime: duration
        };

      } catch (error) {
        this.errorCount++;
        const duration = Date.now() - startTime;

        logger.error('Blueprint analysis failed', {
          correlationId: corrId,
          error: error.message,
          code: error.code,
          duration: `${duration}ms`
        });

        throw new BlueprintError(
          'Failed to analyze blueprint',
          'ANALYSIS_FAILED',
          corrId,
          error
        );
      }
    });
  }

  /**
   * Read and encode image file for Claude Vision API
   * @private
   */
  async readImageFile(filePath) {
    try {
      // Read file as buffer
      const fileBuffer = await fs.readFile(filePath);

      // Get file extension
      const ext = path.extname(filePath).toLowerCase();

      // Determine media type
      const mediaTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };

      const mediaType = mediaTypeMap[ext] || 'image/jpeg';

      // Encode to base64
      const base64Data = fileBuffer.toString('base64');

      logger.debug('Image file read and encoded', {
        filePath: filePath,
        mediaType: mediaType,
        sizeBytes: fileBuffer.length
      });

      return {
        type: 'base64',
        media_type: mediaType,
        data: base64Data
      };

    } catch (error) {
      logger.error('Failed to read image file', {
        filePath: filePath,
        error: error.message
      });

      throw new BlueprintError(
        'Failed to read image file',
        'FILE_READ_ERROR',
        correlationId.get(),
        error
      );
    }
  }

  /**
   * Analyze blueprint using Claude Vision API
   * @private
   */
  async analyzeWithVision(imageData, corrId) {
    try {
      const prompt = this.buildVisionPrompt();

      logger.debug('Sending image to Claude Vision API', {
        correlationId: corrId,
        mediaType: imageData.media_type
      });

      // Call Claude Vision API with circuit breaker protection
      const response = await this.circuitBreaker.execute(async () => {
        return await this.client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: imageData
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }]
        });
      }, { correlationId: corrId });

      // Extract text from response
      const analysisText = response.content[0]?.text;

      if (!analysisText) {
        throw new Error('No analysis text in response');
      }

      logger.debug('Received analysis from Claude Vision', {
        correlationId: corrId,
        responseLength: analysisText.length,
        tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens
      });

      return analysisText;

    } catch (error) {
      logger.error('Vision API call failed', {
        correlationId: corrId,
        error: error.message,
        code: error.code
      });

      throw error;
    }
  }

  /**
   * Build the prompt for Claude Vision API
   * @private
   */
  buildVisionPrompt() {
    return `You are an expert plumbing blueprint analyzer. Analyze this plumbing blueprint image and provide a comprehensive analysis.

Please identify and count ALL plumbing fixtures, providing the following information:

1. **Room-by-Room Analysis**: For each room/space:
   - Room name/label
   - List of all fixtures in that room
   - Quantity of each fixture type

2. **Fixture Details**: For EACH fixture, provide:
   - Fixture type (lavatory, toilet, shower, bathtub, sink, urinal, water heater, hose bib, floor drain, etc.)
   - Location/room
   - Measurements:
     * Width (side to side)
     * Depth (back to front)
     * Note the measurement unit shown on blueprint
   - Any visible labels or specifications

3. **Summary Totals**: Total count of each fixture type across the entire blueprint:
   - Lavatories: X
   - Toilets: X
   - Showers: X
   - Bathtubs: X
   - Kitchen sinks: X
   - Hose bibs: X
   - [etc.]

4. **Blueprint Details**:
   - Scale (if visible)
   - Number of floors/levels
   - Any notes or specifications visible

Return your analysis in the following JSON format:

\`\`\`json
{
  "summary": {
    "totalFixtures": <number>,
    "totalRooms": <number>,
    "scale": "<scale from blueprint>",
    "measurementUnit": "feet" or "inches",
    "floors": <number>
  },
  "rooms": [
    {
      "name": "Master Bathroom",
      "floor": "1",
      "fixtureCount": 4,
      "fixtures": [
        {
          "type": "lavatory",
          "quantity": 2,
          "width": 20,
          "depth": 18,
          "unit": "inches",
          "notes": "Double vanity"
        },
        {
          "type": "toilet",
          "quantity": 1,
          "width": 15,
          "depth": 28,
          "unit": "inches"
        },
        {
          "type": "shower",
          "quantity": 1,
          "width": 36,
          "depth": 36,
          "unit": "inches",
          "notes": "Walk-in shower"
        }
      ]
    }
  ],
  "fixtureTotals": {
    "lavatory": 5,
    "toilet": 3,
    "shower": 2,
    "bathtub": 1,
    "kitchen_sink": 1,
    "hose_bib": 2
  },
  "notes": "Any additional observations about the blueprint"
}
\`\`\`

Be thorough and accurate. If measurements are not clearly visible, estimate based on standard fixture sizes and note that they are estimates. If you cannot determine something, indicate "unknown" or "not visible".

Respond ONLY with the JSON object, no additional text.`;
  }

  /**
   * Parse the analysis results from Claude Vision
   * @private
   */
  parseAnalysisResults(analysisText) {
    try {
      // Extract JSON from response (Claude sometimes wraps it in markdown)
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
                       analysisText.match(/```\n([\s\S]*?)\n```/) ||
                       [null, analysisText];

      const jsonText = jsonMatch[1] || analysisText;
      const analysis = JSON.parse(jsonText);
      
      const validatedAnalysis = blueprintAnalysisSchema.parse(analysis);

      logger.debug('Analysis results parsed and validated successfully', {
        totalFixtures: validatedAnalysis.summary.totalFixtures,
        totalRooms: validatedAnalysis.summary.totalRooms
      });

      return validatedAnalysis;

    } catch (error) {
      logger.error('Failed to parse analysis results', {
        error: error.message,
        responsePreview: analysisText.substring(0, 500)
      });

      throw new BlueprintError(
        'Failed to parse analysis results',
        'PARSE_ERROR',
        correlationId.get(),
        error
      );
    }
  }

  /**
   * Enrich fixture data with reference information
   * @private
   */
  async enrichFixtureData(analysis) {
    try {
      // Get fixture type reference data
      const fixtureTypes = await db('fixture_types_reference').select('*');

      const fixtureTypeMap = {};
      fixtureTypes.forEach(row => {
        fixtureTypeMap[row.fixture_type] = row;
      });

      // Enrich each fixture with reference data
      const enrichedRooms = analysis.rooms.map(room => {
        const enrichedFixtures = room.fixtures.map(fixture => {
          const refData = fixtureTypeMap[fixture.type];

          return {
            ...fixture,
            displayName: refData?.display_name || fixture.type,
            category: refData?.category || 'unknown',
            // Use detected measurements, fallback to typical dimensions
            width: fixture.width || refData?.typical_width_inches,
            depth: fixture.depth || refData?.typical_depth_inches,
            // Calculate confidence based on measurement presence
            confidence: fixture.width && fixture.depth ? 95 : 70
          };
        });

        return {
          ...room,
          fixtures: enrichedFixtures
        };
      });

      return {
        ...analysis,
        rooms: enrichedRooms,
        totalFixtures: analysis.summary.totalFixtures,
        enriched: true
      };

    } catch (error) {
      logger.warn('Failed to enrich fixture data', {
        error: error.message
      });

      // Return original analysis if enrichment fails
      return analysis;
    }
  }

  /**
   * Save blueprint analysis results to database
   *
   * @param {number} blueprintId - Blueprint ID
   * @param {Object} analysisResults - Analysis results from analyzeBlueprint
   * @returns {Promise<Object>} Saved data
   */
  async saveAnalysisResults(blueprintId, analysisResults) {
    const corrId = analysisResults.correlationId || correlationId.get();

    try {
      return await db.transaction(async (trx) => {
        // Update blueprint record
        await trx('blueprints')
          .where({ id: blueprintId })
          .update({
            status: 'completed',
            total_fixtures: analysisResults.totalFixtures,
            analysis_data: JSON.stringify(analysisResults),
            analysis_completed_at: db.fn.now(),
            updated_at: db.fn.now()
          });

        logger.debug('Blueprint record updated', {
          correlationId: corrId,
          blueprintId: blueprintId
        });

        // Insert rooms
        for (const room of analysisResults.rooms) {
          const [roomResult] = await trx('blueprint_rooms')
            .insert({
              blueprint_id: blueprintId,
              room_name: room.name,
              room_type: room.type || 'unknown',
              floor_level: room.floor || '1',
              fixture_count: room.fixtureCount || 0,
              metadata: JSON.stringify(room),
              created_at: db.fn.now()
            })
            .returning('id');

          const _roomId = roomResult.id;

          // Insert fixtures for this room
          for (const fixture of room.fixtures) {
            await trx('blueprint_fixtures').insert({
              blueprint_id: blueprintId,
              fixture_type: fixture.type,
              location: room.name,
              room_name: room.name,
              quantity: fixture.quantity || 1,
              width: fixture.width,
              depth: fixture.depth,
              measurement_unit: fixture.unit || 'inches',
              confidence_score: fixture.confidence || 85,
              notes: fixture.notes,
              metadata: JSON.stringify(fixture),
              created_at: db.fn.now()
            });
          }
        }

        logger.info('Analysis results saved to database', {
          correlationId: corrId,
          blueprintId: blueprintId,
          roomsCount: analysisResults.rooms.length,
          fixturesCount: analysisResults.totalFixtures
        });

        return {
          success: true,
          blueprintId: blueprintId,
          roomsInserted: analysisResults.rooms.length,
          fixturesInserted: analysisResults.totalFixtures
        };
      });
    } catch (error) {
      logger.error('Failed to save analysis results', {
        correlationId: corrId,
        blueprintId: blueprintId,
        error: error.message
      });

      throw new BlueprintError(
        'Failed to save analysis results',
        'SAVE_ERROR',
        corrId,
        error
      );
    }
  }

  /**
   * Get analysis results for a blueprint
   *
   * @param {number} blueprintId - Blueprint ID
   * @returns {Promise<Object>} Analysis results
   */
  async getAnalysisResults(blueprintId) {
    try {
      // Get blueprint
      const blueprint = await db('blueprints')
        .where({ id: blueprintId })
        .first();

      if (!blueprint) {
        throw new BlueprintError(
          'Blueprint not found',
          'NOT_FOUND',
          correlationId.get()
        );
      }

      // Get fixture counts by type
      const fixtureCounts = await db.raw('SELECT * FROM get_fixture_counts(?)', [blueprintId]);

      // Get fixtures by room
      const fixturesByRoom = await db.raw('SELECT * FROM get_fixtures_by_room(?)', [blueprintId]);

      // Get all fixtures with details
      const fixtures = await db('blueprint_fixtures')
        .where({ blueprint_id: blueprintId })
        .orderBy(['room_name', 'fixture_type']);

      return {
        blueprint: {
          id: blueprint.id,
          projectName: blueprint.project_name,
          status: blueprint.status,
          totalFixtures: blueprint.total_fixtures,
          createdAt: blueprint.created_at,
          completedAt: blueprint.analysis_completed_at
        },
        summary: blueprint.analysis_data?.summary || {},
        fixtureCounts: fixtureCounts.rows,
        fixturesByRoom: fixturesByRoom.rows,
        fixtures: fixtures
      };

    } catch (error) {
      logger.error('Failed to get analysis results', {
        blueprintId: blueprintId,
        error: error.message
      });

      throw error;
    }
  }

  getHealth() {
    return {
      initialized: this.initialized,
      analysisCount: this.analysisCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      successRate: this.analysisCount > 0
        ? ((this.successCount / this.analysisCount) * 100).toFixed(2) + '%'
        : 'N/A',
      circuitBreaker: this.circuitBreaker.getStatus()
    };
  }

  getMetrics() {
    return {
      analyses: {
        total: this.analysisCount,
        successful: this.successCount,
        failed: this.errorCount
      },
      circuit: this.circuitBreaker.getStatus()
    };
  }
}

/**
 * Custom Blueprint Error
 */
class BlueprintError extends Error {
  constructor(message, code, correlationId, originalError) {
    super(message);
    this.name = 'BlueprintError';
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
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      originalMessage: this.originalMessage
    };
  }
}

module.exports = new BlueprintService();
module.exports.BlueprintError = BlueprintError;
