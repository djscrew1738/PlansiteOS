# Blueprint Status Lifecycle

## Status Values

The blueprint processing system uses 5 distinct statuses:

| Status | Description | Next States |
|--------|-------------|-------------|
| `pending` | Initial state when blueprint uploaded | `processing`, `processed-dxf` |
| `processing` | AI analysis in progress | `completed`, `failed` |
| `completed` | AI analysis finished successfully | (terminal state) |
| `failed` | Error during AI analysis | (terminal state) |
| `processed-dxf` | DXF file uploaded (skips AI analysis) | (terminal state) |

## State Transitions

### Regular PDF/Image Upload Flow

```
pending → processing → completed
         ↓
         failed
```

1. **pending**: Blueprint uploaded, waiting for processing
2. **processing**: AI analysis running (status set in blueprints.routes.js:133)
3. **completed**: AI results saved (status set in blueprints.routes.js:147)
4. **failed**: Error occurred during analysis

### DXF File Upload Flow

```
pending → processed-dxf
```

1. **pending**: DXF file uploaded
2. **processed-dxf**: DXF detected, skips AI analysis (status set in blueprints.routes.js)

## Database Constraint

The blueprint status is enforced at the database level:

```sql
CONSTRAINT chk_blueprints_status CHECK (
  status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'processed-dxf'
  )
)
```

See: `packages_temp/db/migrations/001_core_schema.up.sql:83-92`

## Code References

**Status Constants**: `apps/api/src/modules/blueprints/blueprintStatus.js`
```javascript
const BLUEPRINT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PROCESSED_DXF: 'processed-dxf',
};
```

**Completion Check**: Use `isBlueprintCompleted(status)` to test if a blueprint is ready for bid creation. Returns true for 'completed' or 'processed-dxf'.

**Bids Integration**: Bids can only be created when `isBlueprintCompleted(blueprint.status) === true`.

See: `apps/api/src/modules/bids/bids.service.js`

## Design Decisions

**Why 'processed-dxf' instead of 'completed'?**

DXF files contain vector data that doesn't need AI analysis. Using a distinct status allows us to:
- Track DXF vs AI-analyzed blueprints separately
- Handle different workflows in analytics
- Maintain clarity in system logs

Both statuses are considered "completed" for bid creation purposes.

**Why no 'processed' status?**

An earlier iteration included a generic 'processed' status, but it was never used in the codebase and violated YAGNI (You Aren't Gonna Need It). It was removed to keep the system simple.
