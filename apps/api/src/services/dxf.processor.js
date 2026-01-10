const fs = require('fs').promises;
const DxfParser = require('dxf-parser');
const logger = require('../../platform/observability/logger');

class DxfProcessor {
  constructor() {
    this.parser = new DxfParser();
  }

  /**
   * Parses a DXF file and extracts relevant geometric data.
   * @param {string} filePath - The path to the DXF file.
   * @returns {Promise<Object>} A promise that resolves to a simplified geometric representation.
   */
  async processDxfFile(filePath) {
    try {
      const dxfContent = await fs.readFile(filePath, 'utf-8');
      const dxf = this.parser.parseSync(dxfContent);

      if (!dxf) {
        throw new Error('Failed to parse DXF content.');
      }

      logger.info('DXF file parsed successfully', {
        filePath: filePath,
        numLayers: dxf.tables.layers.length,
        numEntities: dxf.entities.length,
      });

      // Simplified extraction for now: focusing on basic geometry and layer info
      const geometries = {
        lines: [],
        polylines: [],
        circles: [],
        arcs: [],
        // Add other entity types as needed
      };

      dxf.entities.forEach(entity => {
        const commonData = {
          layer: entity.layer,
          color: entity.color,
          lineTypeName: entity.lineTypeName,
          // Add more common properties as needed
        };

        switch (entity.type) {
          case 'LINE':
            geometries.lines.push({
              ...commonData,
              start: entity.start,
              end: entity.end,
            });
            break;
          case 'LWPOLYLINE':
          case 'POLYLINE':
            geometries.polylines.push({
              ...commonData,
              vertices: entity.vertices,
              isClosed: entity.isClosed,
            });
            break;
          case 'CIRCLE':
            geometries.circles.push({
              ...commonData,
              center: entity.center,
              radius: entity.radius,
            });
            break;
          case 'ARC':
            geometries.arcs.push({
              ...commonData,
              center: entity.center,
              radius: entity.radius,
              startAngle: entity.startAngle,
              endAngle: entity.endAngle,
            });
            break;
          // Implement extraction for other relevant entities (TEXT, INSERT, etc.)
        }
      });

      // You can also extract layers and other tables
      const layers = dxf.tables.layers.map(layer => ({
        name: layer.name,
        color: layer.color,
        isVisible: layer.isVisible,
      }));

      return {
        header: dxf.header,
        layers: layers,
        geometries: geometries,
        // Potentially add blocks, text, dimensions etc.
      };

    } catch (error) {
      logger.error('Error processing DXF file', {
        filePath: filePath,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = new DxfProcessor();
