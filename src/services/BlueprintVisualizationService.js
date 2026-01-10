// Try to load canvas - it may not be installed
let createCanvas, loadImage, registerFont, canvasAvailable;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
  registerFont = canvas.registerFont;
  canvasAvailable = true;
} catch (error) {
  canvasAvailable = false;
  console.warn('Canvas module not available - blueprint annotation will be disabled');
}

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const correlationId = require('../utils/CorrelationId');

/**
 * Blueprint Visualization Service
 *
 * Creates annotated blueprints with dimension lines and legends
 * following commercial plan standards
 */
class BlueprintVisualizationService {
  constructor() {
    this.canvasAvailable = canvasAvailable;
    this.defaultOptions = {
      // Dimension line styling
      dimensionLineColor: '#000000',
      dimensionLineWidth: 1,
      dimensionTextColor: '#000000',
      dimensionTextSize: 12,
      dimensionTextFont: 'Arial',

      // Fixture highlighting
      fixtureOutlineColor: '#FF0000',
      fixtureOutlineWidth: 2,
      fixtureHighlightAlpha: 0.3,

      // Legend styling
      legendBackgroundColor: '#FFFFFF',
      legendBorderColor: '#000000',
      legendBorderWidth: 2,
      legendTextColor: '#000000',
      legendTitleSize: 14,
      legendTextSize: 11,
      legendFont: 'Arial',

      // Layout
      legendPosition: 'bottom-right',
      legendPadding: 20,
      legendMargin: 30,

      // Dimension line extensions
      extensionLineLength: 20,
      offsetFromFixture: 10
    };
  }

  /**
   * Create annotated blueprint with dimension lines and legend
   *
   * @param {string} originalImagePath - Path to original blueprint
   * @param {Object} analysisData - Analysis results
   * @param {Object} options - Rendering options
   * @returns {Promise<string>} Path to annotated image
   */
  async createAnnotatedBlueprint(originalImagePath, analysisData, options = {}) {
    const corrId = options.correlationId || correlationId.get();
    const opts = { ...this.defaultOptions, ...options };

    return correlationId.run(corrId, async () => {
      try {
        // Check if canvas is available
        if (!this.canvasAvailable) {
          logger.warn('Canvas module not available - blueprint annotation skipped', {
            correlationId: corrId
          });
          throw new Error('Canvas module not installed. Install system dependencies and run: npm install canvas');
        }

        logger.info('Creating annotated blueprint', {
          correlationId: corrId,
          originalImage: originalImagePath,
          fixtureCount: analysisData.totalFixtures
        });

        // Load original image
        const image = await loadImage(originalImagePath);

        // Create canvas with same dimensions
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        // Draw original image
        ctx.drawImage(image, 0, 0);

        // Draw dimension lines for each fixture
        await this.drawDimensionLines(ctx, analysisData, image.width, image.height, opts);

        // Draw legend
        await this.drawLegend(ctx, analysisData, image.width, image.height, opts);

        // Save annotated image
        const outputPath = this.getOutputPath(originalImagePath, 'annotated');
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(outputPath, buffer);

        logger.info('Annotated blueprint created', {
          correlationId: corrId,
          outputPath: outputPath
        });

        return outputPath;

      } catch (error) {
        logger.error('Failed to create annotated blueprint', {
          correlationId: corrId,
          error: error.message,
          stack: error.stack
        });

        throw error;
      }
    });
  }

  /**
   * Draw dimension lines for all fixtures
   * Each fixture gets TWO dimension lines:
   * - One for width (side to side)
   * - One for depth (front to back)
   * @private
   */
  async drawDimensionLines(ctx, analysisData, imageWidth, imageHeight, opts) {
    try {
      // Calculate scale factor (pixels per inch/foot)
      const scale = this.calculateScale(analysisData.summary, imageWidth, imageHeight);

      for (const room of analysisData.rooms) {
        for (const fixture of room.fixtures) {
          if (fixture.position_x && fixture.position_y) {
            // Draw dimension lines for this fixture
            this.drawFixtureDimensions(ctx, fixture, room, scale, opts);
          }
        }
      }

    } catch (error) {
      logger.error('Failed to draw dimension lines', {
        error: error.message
      });
    }
  }

  /**
   * Draw dimension lines for a single fixture
   * @private
   */
  drawFixtureDimensions(ctx, fixture, room, scale, opts) {
    // Get fixture position and dimensions
    const x = fixture.position_x || 0;
    const y = fixture.position_y || 0;
    const width = fixture.width || 0;
    const depth = fixture.depth || 0;

    // Convert measurements to pixels
    const widthPx = width * scale;
    const depthPx = depth * scale;

    // Fixture center point
    const centerX = x;
    const centerY = y;

    // Calculate fixture bounds
    const left = centerX - (widthPx / 2);
    const right = centerX + (widthPx / 2);
    const top = centerY - (depthPx / 2);
    const bottom = centerY + (depthPx / 2);

    // --- DIMENSION LINE 1: WIDTH (Horizontal) ---
    // Draw above the fixture
    const widthLineY = top - opts.offsetFromFixture;

    this.drawDimensionLine(
      ctx,
      left, widthLineY,
      right, widthLineY,
      `${width}"`,
      'horizontal',
      opts
    );

    // Extension lines (vertical drops)
    this.drawExtensionLine(ctx, left, widthLineY, left, top, opts);
    this.drawExtensionLine(ctx, right, widthLineY, right, top, opts);

    // --- DIMENSION LINE 2: DEPTH (Vertical) ---
    // Draw to the left of the fixture
    const depthLineX = left - opts.offsetFromFixture;

    this.drawDimensionLine(
      ctx,
      depthLineX, top,
      depthLineX, bottom,
      `${depth}"`,
      'vertical',
      opts
    );

    // Extension lines (horizontal drops)
    this.drawExtensionLine(ctx, depthLineX, top, left, top, opts);
    this.drawExtensionLine(ctx, depthLineX, bottom, left, bottom, opts);

    // Highlight fixture outline
    this.drawFixtureOutline(ctx, left, top, widthPx, depthPx, opts);
  }

  /**
   * Draw a dimension line with measurement text
   * @private
   */
  drawDimensionLine(ctx, x1, y1, x2, y2, measurement, orientation, opts) {
    // Save context
    ctx.save();

    // Set line style
    ctx.strokeStyle = opts.dimensionLineColor;
    ctx.lineWidth = opts.dimensionLineWidth;

    // Draw main dimension line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Draw arrows at ends
    this.drawArrow(ctx, x1, y1, x2, y2, 'start', opts);
    this.drawArrow(ctx, x1, y1, x2, y2, 'end', opts);

    // Draw measurement text
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    ctx.fillStyle = opts.dimensionTextColor;
    ctx.font = `${opts.dimensionTextSize}px ${opts.dimensionTextFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Rotate text for vertical lines
    if (orientation === 'vertical') {
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(measurement, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(measurement, midX, midY - 5);
    }

    ctx.restore();
  }

  /**
   * Draw extension line (witness line)
   * @private
   */
  drawExtensionLine(ctx, x1, y1, x2, y2, opts) {
    ctx.save();
    ctx.strokeStyle = opts.dimensionLineColor;
    ctx.lineWidth = opts.dimensionLineWidth * 0.7;
    ctx.setLineDash([2, 2]); // Dashed line

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw arrow at dimension line end
   * @private
   */
  drawArrow(ctx, x1, y1, x2, y2, position, opts) {
    ctx.save();

    const arrowSize = 8;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Arrow position
    const arrowX = position === 'start' ? x1 : x2;
    const arrowY = position === 'start' ? y1 : y2;

    // Arrow direction
    const arrowAngle = position === 'start' ? angle + Math.PI : angle;

    ctx.fillStyle = opts.dimensionLineColor;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
      arrowY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
      arrowY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw fixture outline highlight
   * @private
   */
  drawFixtureOutline(ctx, x, y, width, height, opts) {
    ctx.save();

    // Semi-transparent fill
    ctx.fillStyle = opts.fixtureOutlineColor + Math.floor(opts.fixtureHighlightAlpha * 255).toString(16).padStart(2, '0');
    ctx.fillRect(x, y, width, height);

    // Solid outline
    ctx.strokeStyle = opts.fixtureOutlineColor;
    ctx.lineWidth = opts.fixtureOutlineWidth;
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
  }

  /**
   * Draw legend in bottom right corner
   * @private
   */
  async drawLegend(ctx, analysisData, imageWidth, imageHeight, opts) {
    try {
      // Prepare legend content
      const legendItems = this.prepareLegendContent(analysisData);

      // Calculate legend dimensions
      const legendWidth = 300;
      const lineHeight = 20;
      const legendHeight = (legendItems.length + 3) * lineHeight + opts.legendPadding * 2;

      // Legend position (bottom right)
      const legendX = imageWidth - legendWidth - opts.legendMargin;
      const legendY = imageHeight - legendHeight - opts.legendMargin;

      // Draw legend background
      ctx.save();
      ctx.fillStyle = opts.legendBackgroundColor;
      ctx.strokeStyle = opts.legendBorderColor;
      ctx.lineWidth = opts.legendBorderWidth;

      ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
      ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

      // Draw legend title
      ctx.fillStyle = opts.legendTextColor;
      ctx.font = `bold ${opts.legendTitleSize}px ${opts.legendFont}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.fillText(
        'PLUMBING FIXTURE SCHEDULE',
        legendX + opts.legendPadding,
        legendY + opts.legendPadding
      );

      // Draw underline
      ctx.strokeStyle = opts.legendTextColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(legendX + opts.legendPadding, legendY + opts.legendPadding + opts.legendTitleSize + 2);
      ctx.lineTo(legendX + legendWidth - opts.legendPadding, legendY + opts.legendPadding + opts.legendTitleSize + 2);
      ctx.stroke();

      // Draw legend items
      ctx.font = `${opts.legendTextSize}px ${opts.legendFont}`;
      let currentY = legendY + opts.legendPadding + opts.legendTitleSize + 10;

      for (const item of legendItems) {
        // Draw symbol/icon
        ctx.fillStyle = item.color || '#FF0000';
        ctx.fillRect(legendX + opts.legendPadding, currentY + 5, 10, 10);

        // Draw text
        ctx.fillStyle = opts.legendTextColor;
        ctx.fillText(
          `${item.label}: ${item.count}`,
          legendX + opts.legendPadding + 20,
          currentY
        );

        currentY += lineHeight;
      }

      // Draw total
      currentY += 5;
      ctx.font = `bold ${opts.legendTextSize}px ${opts.legendFont}`;
      ctx.fillText(
        `TOTAL FIXTURES: ${analysisData.totalFixtures}`,
        legendX + opts.legendPadding,
        currentY
      );

      ctx.restore();

    } catch (error) {
      logger.error('Failed to draw legend', {
        error: error.message
      });
    }
  }

  /**
   * Prepare legend content from analysis data
   * @private
   */
  prepareLegendContent(analysisData) {
    const items = [];
    const colors = [
      '#FF0000', '#0000FF', '#00FF00', '#FF00FF',
      '#00FFFF', '#FF8800', '#8800FF', '#00FF88'
    ];

    let colorIndex = 0;

    for (const [fixtureType, count] of Object.entries(analysisData.fixtureTotals)) {
      items.push({
        label: this.formatFixtureLabel(fixtureType),
        count: count,
        color: colors[colorIndex % colors.length]
      });
      colorIndex++;
    }

    return items;
  }

  /**
   * Format fixture type for display
   * @private
   */
  formatFixtureLabel(fixtureType) {
    const labels = {
      'lavatory': 'LAV',
      'toilet': 'WC',
      'urinal': 'UR',
      'shower': 'SH',
      'bathtub': 'TUB',
      'kitchen_sink': 'KS',
      'sink': 'SNK',
      'hose_bib': 'HB',
      'floor_drain': 'FD',
      'water_heater': 'WH',
      'dishwasher': 'DW',
      'washing_machine': 'WM',
      'utility_sink': 'US',
      'drinking_fountain': 'DF',
      'water_closet': 'WC'
    };

    return labels[fixtureType] || fixtureType.toUpperCase();
  }

  /**
   * Calculate scale factor from blueprint
   * @private
   */
  calculateScale(summary, imageWidth, imageHeight) {
    // Default scale: 1 inch = 10 pixels
    let scale = 10;

    if (summary.scale) {
      // Parse scale like "1/4\" = 1'-0\""
      // For now, use default
      scale = 10;
    }

    return scale;
  }

  /**
   * Get output path for annotated image
   * @private
   */
  getOutputPath(originalPath, suffix) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const basename = path.basename(originalPath, ext);

    return path.join(dir, `${basename}-${suffix}.png`);
  }
}

module.exports = new BlueprintVisualizationService();
