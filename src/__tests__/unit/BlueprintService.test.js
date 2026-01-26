/**
 * Unit Tests for BlueprintService
 *
 * Tests blueprint analysis parsing and data transformation logic.
 */

const BlueprintService = require('../../services/BlueprintService');

describe('BlueprintService', () => {
  describe('parseAnalysisResults', () => {
    it('should parse valid JSON markdown block', () => {
      const input = `\`\`\`json
{
  "summary": {
    "totalRooms": 3,
    "totalFixtures": 15
  },
  "rooms": [
    {
      "name": "Kitchen",
      "fixtures": [
        {"type": "sink", "quantity": 1}
      ]
    }
  ]
}
\`\`\``;

      const result = BlueprintService.parseAnalysisResults(input);

      expect(result).toHaveProperty('summary');
      expect(result.summary.totalRooms).toBe(3);
      expect(result.summary.totalFixtures).toBe(15);
      expect(result.rooms).toHaveLength(1);
      expect(result.rooms[0].name).toBe('Kitchen');
    });

    it('should handle JSON without markdown wrapper', () => {
      const input = JSON.stringify({
        summary: { totalRooms: 1 },
        rooms: []
      });

      const result = BlueprintService.parseAnalysisResults(input);

      expect(result.summary.totalRooms).toBe(1);
    });

    it('should throw error for invalid JSON', () => {
      const input = '```json\nNot valid JSON\n```';

      expect(() => {
        BlueprintService.parseAnalysisResults(input);
      }).toThrow();
    });

    it('should handle nested JSON blocks', () => {
      const input = `Some text before
\`\`\`json
{"summary": {"totalRooms": 2}}
\`\`\`
Some text after`;

      const result = BlueprintService.parseAnalysisResults(input);

      expect(result.summary.totalRooms).toBe(2);
    });

    it('should handle empty analysis', () => {
      const input = '```json\n{}\n```';

      const result = BlueprintService.parseAnalysisResults(input);

      expect(result).toEqual({});
    });
  });

  describe('calculateFixtureTotals', () => {
    it('should sum fixtures across all rooms', () => {
      const analysisData = {
        rooms: [
          {
            name: 'Bathroom 1',
            fixtures: [
              { type: 'toilet', quantity: 1 },
              { type: 'sink', quantity: 1 }
            ]
          },
          {
            name: 'Bathroom 2',
            fixtures: [
              { type: 'toilet', quantity: 1 },
              { type: 'sink', quantity: 2 }
            ]
          }
        ]
      };

      const totals = BlueprintService.calculateFixtureTotals(analysisData);

      expect(totals.toilet).toBe(2);
      expect(totals.sink).toBe(3);
    });

    it('should handle rooms with no fixtures', () => {
      const analysisData = {
        rooms: [
          { name: 'Empty Room', fixtures: [] }
        ]
      };

      const totals = BlueprintService.calculateFixtureTotals(analysisData);

      expect(totals).toEqual({});
    });

    it('should handle missing rooms array', () => {
      const analysisData = {};

      const totals = BlueprintService.calculateFixtureTotals(analysisData);

      expect(totals).toEqual({});
    });
  });

  describe('validateAnalysisData', () => {
    it('should accept valid analysis data', () => {
      const validData = {
        summary: {
          totalRooms: 1,
          totalFixtures: 2
        },
        rooms: [
          {
            name: 'Bathroom',
            fixtures: [
              { type: 'sink', quantity: 1 }
            ]
          }
        ]
      };

      expect(() => {
        BlueprintService.validateAnalysisData(validData);
      }).not.toThrow();
    });

    it('should reject data without summary', () => {
      const invalidData = {
        rooms: []
      };

      expect(() => {
        BlueprintService.validateAnalysisData(invalidData);
      }).toThrow('Missing summary');
    });

    it('should reject data without rooms array', () => {
      const invalidData = {
        summary: { totalRooms: 0 }
      };

      expect(() => {
        BlueprintService.validateAnalysisData(invalidData);
      }).toThrow('Missing rooms');
    });

    it('should reject fixture without type', () => {
      const invalidData = {
        summary: { totalRooms: 1 },
        rooms: [
          {
            name: 'Room',
            fixtures: [
              { quantity: 1 } // Missing type
            ]
          }
        ]
      };

      expect(() => {
        BlueprintService.validateAnalysisData(invalidData);
      }).toThrow('Missing fixture type');
    });

    it('should reject fixture without quantity', () => {
      const invalidData = {
        summary: { totalRooms: 1 },
        rooms: [
          {
            name: 'Room',
            fixtures: [
              { type: 'sink' } // Missing quantity
            ]
          }
        ]
      };

      expect(() => {
        BlueprintService.validateAnalysisData(invalidData);
      }).toThrow('Missing fixture quantity');
    });
  });

  describe('normalizeFixtureType', () => {
    it('should normalize common variations', () => {
      expect(BlueprintService.normalizeFixtureType('TOILET')).toBe('toilet');
      expect(BlueprintService.normalizeFixtureType('Water Closet')).toBe('toilet');
      expect(BlueprintService.normalizeFixtureType('wc')).toBe('toilet');
    });

    it('should handle sink variations', () => {
      expect(BlueprintService.normalizeFixtureType('Sink')).toBe('sink');
      expect(BlueprintService.normalizeFixtureType('Lavatory')).toBe('sink');
      expect(BlueprintService.normalizeFixtureType('lav')).toBe('sink');
    });

    it('should preserve unknown types', () => {
      expect(BlueprintService.normalizeFixtureType('custom_fixture')).toBe('custom_fixture');
    });

    it('should handle null and undefined', () => {
      expect(BlueprintService.normalizeFixtureType(null)).toBe('unknown');
      expect(BlueprintService.normalizeFixtureType(undefined)).toBe('unknown');
    });
  });
});
