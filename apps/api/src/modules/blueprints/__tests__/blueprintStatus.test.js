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
