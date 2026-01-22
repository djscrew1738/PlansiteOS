const express = require('express');
const router = express.Router();
const BlueprintService = require('../services/BlueprintService');
const {
  uploadBlueprint,
  validateFile,
  getFileMetadata,
  deleteFile,
  handleUploadError
} = require('../utils/fileUpload');
const correlationId = require('../utils/CorrelationId');
const { getTransactionManager } = require('../utils/TransactionManager');
const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * POST /api/blueprints/upload
 * Upload and analyze a blueprint
 */
router.post('/upload', uploadBlueprint.single('blueprint'), async (req, res, _next) => {
  const corrId = correlationId.get();
  let blueprintId = null;

  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No file uploaded',
          code: 'NO_FILE',
          correlationId: corrId
        }
      });
    }

    // Validate file
    const validation = validateFile(req.file);
    if (!validation.valid) {
      // Delete uploaded file
      await deleteFile(req.file.path);

      return res.status(400).json({
        error: {
          message: 'File validation failed',
          code: 'VALIDATION_FAILED',
          errors: validation.errors,
          correlationId: corrId
        }
      });
    }

    const fileMetadata = getFileMetadata(req.file);

    logger.info('Blueprint file uploaded', {
      correlationId: corrId,
      filename: fileMetadata.filename,
      size: fileMetadata.size,
      mimeType: fileMetadata.mimeType
    });

    // Extract project details from request
    const projectName = req.body.projectName || 'Untitled Project';
    const projectAddress = req.body.projectAddress || null;

    // Create blueprint record in database
    const txManager = getTransactionManager(db);

    const blueprintRecord = await txManager.execute(async (client) => {
      const result = await client.query(
        `INSERT INTO blueprints (
          project_name, project_address, file_name, file_path,
          file_size, file_type, status, correlation_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [
          projectName,
          projectAddress,
          fileMetadata.originalName,
          fileMetadata.path,
          fileMetadata.size,
          fileMetadata.mimeType,
          'pending',
          corrId
        ]
      );

      return result.rows[0];
    }, { correlationId: corrId });

    blueprintId = blueprintRecord.id;

    logger.info('Blueprint record created', {
      correlationId: corrId,
      blueprintId: blueprintId
    });

    // Start analysis (async)
    // Update status to processing
    await db.query(
      `UPDATE blueprints
       SET status = $1, analysis_started_at = NOW()
       WHERE id = $2`,
      ['processing', blueprintId]
    );

    // Perform analysis
    const analysisResults = await BlueprintService.analyzeBlueprint(
      fileMetadata.path,
      {
        correlationId: corrId,
        projectName: projectName
      }
    );

    // Save analysis results
    await BlueprintService.saveAnalysisResults(blueprintId, analysisResults);

    logger.info('Blueprint analysis completed and saved', {
      correlationId: corrId,
      blueprintId: blueprintId,
      totalFixtures: analysisResults.totalFixtures
    });

    // Return response
    res.status(201).json({
      success: true,
      correlationId: corrId,
      blueprint: {
        id: blueprintId,
        projectName: projectName,
        projectAddress: projectAddress,
        fileName: fileMetadata.originalName,
        fileSize: fileMetadata.size,
        status: 'completed'
      },
      analysis: {
        totalFixtures: analysisResults.totalFixtures,
        totalRooms: analysisResults.summary.totalRooms,
        fixtureTotals: analysisResults.fixtureTotals,
        rooms: analysisResults.rooms,
        analysisTime: analysisResults.analysisTime
      }
    });

  } catch (error) {
    logger.error('Blueprint upload/analysis failed', {
      correlationId: corrId,
      blueprintId: blueprintId,
      error: error.message,
      stack: error.stack
    });

    // Update blueprint status to failed if record exists
    if (blueprintId) {
      try {
        await db.query(
          `UPDATE blueprints
           SET status = $1, error_message = $2, updated_at = NOW()
           WHERE id = $3`,
          ['failed', error.message, blueprintId]
        );
      } catch (updateError) {
        logger.error('Failed to update blueprint status', {
          blueprintId: blueprintId,
          error: updateError.message
        });
      }
    }

    // Delete uploaded file on failure
    if (req.file && req.file.path) {
      await deleteFile(req.file.path);
    }

    res.status(500).json({
      error: {
        message: 'Failed to analyze blueprint',
        code: error.code || 'ANALYSIS_FAILED',
        correlationId: corrId,
        details: error.message
      }
    });
  }
});

/**
 * GET /api/blueprints/:id
 * Get blueprint analysis results
 */
router.get('/:id', async (req, res, _next) => {
  const corrId = correlationId.get();

  try {
    const blueprintId = parseInt(req.params.id);

    if (isNaN(blueprintId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid blueprint ID',
          code: 'INVALID_ID',
          correlationId: corrId
        }
      });
    }

    const results = await BlueprintService.getAnalysisResults(blueprintId);

    res.json({
      success: true,
      correlationId: corrId,
      ...results
    });

  } catch (error) {
    logger.error('Failed to get blueprint results', {
      correlationId: corrId,
      blueprintId: req.params.id,
      error: error.message
    });

    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({
        error: {
          message: 'Blueprint not found',
          code: 'NOT_FOUND',
          correlationId: corrId
        }
      });
    }

    res.status(500).json({
      error: {
        message: 'Failed to get blueprint results',
        code: 'FETCH_FAILED',
        correlationId: corrId
      }
    });
  }
});

/**
 * GET /api/blueprints
 * List all blueprints
 */
router.get('/', async (req, res, _next) => {
  const corrId = correlationId.get();

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT
        id, project_name, project_address, file_name,
        status, total_fixtures, created_at, analysis_completed_at
       FROM blueprints
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) FROM blueprints');
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      correlationId: corrId,
      blueprints: result.rows,
      pagination: {
        page: page,
        limit: limit,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    logger.error('Failed to list blueprints', {
      correlationId: corrId,
      error: error.message
    });

    res.status(500).json({
      error: {
        message: 'Failed to list blueprints',
        code: 'LIST_FAILED',
        correlationId: corrId
      }
    });
  }
});

/**
 * DELETE /api/blueprints/:id
 * Delete a blueprint
 */
router.delete('/:id', async (req, res, _next) => {
  const corrId = correlationId.get();

  try {
    const blueprintId = parseInt(req.params.id);

    if (isNaN(blueprintId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid blueprint ID',
          code: 'INVALID_ID',
          correlationId: corrId
        }
      });
    }

    // Get blueprint to get file path
    const blueprintResult = await db.query(
      'SELECT file_path FROM blueprints WHERE id = $1',
      [blueprintId]
    );

    if (blueprintResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Blueprint not found',
          code: 'NOT_FOUND',
          correlationId: corrId
        }
      });
    }

    const filePath = blueprintResult.rows[0].file_path;

    // Delete from database (CASCADE will delete related records)
    await db.query('DELETE FROM blueprints WHERE id = $1', [blueprintId]);

    // Delete file from disk
    await deleteFile(filePath);

    logger.info('Blueprint deleted', {
      correlationId: corrId,
      blueprintId: blueprintId
    });

    res.json({
      success: true,
      correlationId: corrId,
      message: 'Blueprint deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete blueprint', {
      correlationId: corrId,
      blueprintId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      error: {
        message: 'Failed to delete blueprint',
        code: 'DELETE_FAILED',
        correlationId: corrId
      }
    });
  }
});

/**
 * GET /api/blueprints/:id/summary
 * Get fixture summary for a blueprint
 */
router.get('/:id/summary', async (req, res, _next) => {
  const corrId = correlationId.get();

  try {
    const blueprintId = parseInt(req.params.id);

    if (isNaN(blueprintId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid blueprint ID',
          code: 'INVALID_ID',
          correlationId: corrId
        }
      });
    }

    // Get fixture counts
    const fixtureCounts = await db.query(
      'SELECT * FROM get_fixture_counts($1)',
      [blueprintId]
    );

    // Get fixtures by room
    const fixturesByRoom = await db.query(
      'SELECT * FROM get_fixtures_by_room($1)',
      [blueprintId]
    );

    // Get blueprint info
    const blueprintInfo = await db.query(
      'SELECT project_name, total_fixtures, status FROM blueprints WHERE id = $1',
      [blueprintId]
    );

    if (blueprintInfo.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: 'Blueprint not found',
          code: 'NOT_FOUND',
          correlationId: corrId
        }
      });
    }

    res.json({
      success: true,
      correlationId: corrId,
      blueprint: {
        id: blueprintId,
        projectName: blueprintInfo.rows[0].project_name,
        totalFixtures: blueprintInfo.rows[0].total_fixtures,
        status: blueprintInfo.rows[0].status
      },
      fixtureTotals: fixtureCounts.rows,
      fixturesByRoom: fixturesByRoom.rows
    });

  } catch (error) {
    logger.error('Failed to get blueprint summary', {
      correlationId: corrId,
      blueprintId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      error: {
        message: 'Failed to get blueprint summary',
        code: 'SUMMARY_FAILED',
        correlationId: corrId
      }
    });
  }
});

/**
 * POST /api/blueprints/:id/annotate
 * Generate annotated blueprint with dimension lines
 */
router.post('/:id/annotate', async (req, res, _next) => {
  const corrId = correlationId.get();

  try {
    const blueprintId = parseInt(req.params.id);

    if (isNaN(blueprintId)) {
      return res.status(400).json({
        error: {
          message: 'Invalid blueprint ID',
          code: 'INVALID_ID',
          correlationId: corrId
        }
      });
    }

    // Get blueprint and analysis data
    const results = await BlueprintService.getAnalysisResults(blueprintId);

    if (!results.blueprint) {
      return res.status(404).json({
        error: {
          message: 'Blueprint not found',
          code: 'NOT_FOUND',
          correlationId: corrId
        }
      });
    }

    // Get blueprint file path
    const blueprintRecord = await db.query(
      'SELECT file_path FROM blueprints WHERE id = $1',
      [blueprintId]
    );

    const originalPath = blueprintRecord.rows[0].file_path;

    // Generate annotated blueprint
    const BlueprintVisualizationService = require('../services/BlueprintVisualizationService');

    const annotatedPath = await BlueprintVisualizationService.createAnnotatedBlueprint(
      originalPath,
      results.blueprint.analysis_data || results,
      { correlationId: corrId }
    );

    logger.info('Annotated blueprint generated', {
      correlationId: corrId,
      blueprintId: blueprintId,
      outputPath: annotatedPath
    });

    // Return path to annotated image
    res.json({
      success: true,
      correlationId: corrId,
      annotatedImagePath: annotatedPath,
      message: 'Annotated blueprint generated successfully'
    });

  } catch (error) {
    logger.error('Failed to generate annotated blueprint', {
      correlationId: corrId,
      blueprintId: req.params.id,
      error: error.message
    });

    res.status(500).json({
      error: {
        message: 'Failed to generate annotated blueprint',
        code: 'ANNOTATION_FAILED',
        correlationId: corrId
      }
    });
  }
});

// Error handling middleware for file uploads
router.use(handleUploadError);

module.exports = router;
