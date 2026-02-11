const BLUEPRINT_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PROCESSED_DXF: 'processed-dxf',
});

const COMPLETED_BLUEPRINT_STATUSES = Object.freeze([
  BLUEPRINT_STATUS.COMPLETED,
  BLUEPRINT_STATUS.PROCESSED_DXF,
]);

function isBlueprintCompleted(status) {
  return COMPLETED_BLUEPRINT_STATUSES.includes(status);
}

module.exports = {
  BLUEPRINT_STATUS,
  COMPLETED_BLUEPRINT_STATUSES,
  isBlueprintCompleted,
};
