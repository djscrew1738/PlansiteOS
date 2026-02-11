const {
  BLUEPRINT_STATUS,
  COMPLETED_BLUEPRINT_STATUSES,
  isBlueprintCompleted
} = require('../blueprintStatus');

describe('blueprintStatus helpers', () => {
  test('completed-like statuses are treated as complete', () => {
    for (const status of COMPLETED_BLUEPRINT_STATUSES) {
      expect(isBlueprintCompleted(status)).toBe(true);
    }
  });

  test('non-complete statuses are rejected', () => {
    expect(isBlueprintCompleted(BLUEPRINT_STATUS.PENDING)).toBe(false);
    expect(isBlueprintCompleted(BLUEPRINT_STATUS.PROCESSING)).toBe(false);
    expect(isBlueprintCompleted(BLUEPRINT_STATUS.FAILED)).toBe(false);
    expect(isBlueprintCompleted('unknown')).toBe(false);
  });
});

describe('BLUEPRINT_STATUS constants', () => {
  it('should have exactly 5 status values', () => {
    const statusValues = Object.values(BLUEPRINT_STATUS);
    expect(statusValues).toHaveLength(5);
    expect(statusValues).toEqual([
      'pending',
      'processing',
      'completed',
      'failed',
      'processed-dxf'
    ]);
  });
});

describe('COMPLETED_BLUEPRINT_STATUSES', () => {
  it('should contain only completed and processed-dxf', () => {
    expect(COMPLETED_BLUEPRINT_STATUSES).toHaveLength(2);
    expect(COMPLETED_BLUEPRINT_STATUSES).toContain('completed');
    expect(COMPLETED_BLUEPRINT_STATUSES).toContain('processed-dxf');
  });
});
