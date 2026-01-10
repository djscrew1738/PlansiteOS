const { z } = require('zod');

const fixtureSchema = z.object({
  type: z.string().min(1),
  quantity: z.number().int().positive(),
  width: z.number().optional(),
  depth: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const roomSchema = z.object({
  name: z.string().min(1),
  floor: z.string().optional(),
  fixtureCount: z.number().int(),
  fixtures: z.array(fixtureSchema),
});

const blueprintAnalysisSchema = z.object({
  summary: z.object({
    totalFixtures: z.number().int(),
    totalRooms: z.number().int(),
    scale: z.string().optional(),
    measurementUnit: z.string().optional(),
    floors: z.number().int().optional(),
  }),
  rooms: z.array(roomSchema),
  fixtureTotals: z.record(z.number().int()),
  notes: z.string().optional(),
});

module.exports = {
  blueprintAnalysisSchema,
};
