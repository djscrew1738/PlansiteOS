# PlansiteOS API Documentation

This directory contains the complete API documentation for PlansiteOS.

## Quick Links

- **OpenAPI Specification:** [`openapi.yaml`](./openapi.yaml)
- **Interactive Documentation:** See "Viewing the Docs" below
- **Postman Collection:** Coming soon

## Overview

The PlansiteOS API provides endpoints for:
- Uploading plumbing blueprints
- AI-powered fixture detection and analysis
- Blueprint management (list, retrieve, delete)
- Generating annotated blueprints
- Fixture summaries and reports

## Base URLs

- **Development:** `http://localhost:8090`
- **Production:** `https://ctlplumbingllc.com`

## Authentication

Currently, no authentication is required (development mode).

Future versions will support:
- API Key authentication (X-API-Key header)
- OAuth 2.0 / JWT tokens

## Correlation IDs

All API responses include a `correlationId` field. This UUID can be used to:
- Track requests across services
- Debug issues (include in support requests)
- Correlate logs in monitoring systems

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "message": "Human-readable error description",
    "code": "MACHINE_READABLE_CODE",
    "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "details": "Additional context (optional)"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NO_FILE` | 400 | No file was uploaded |
| `VALIDATION_FAILED` | 400 | File validation failed |
| `INVALID_ID` | 400 | Invalid blueprint ID format |
| `NOT_FOUND` | 404 | Blueprint not found |
| `ANALYSIS_FAILED` | 500 | AI analysis failed |
| `FETCH_FAILED` | 500 | Database fetch failed |
| `LIST_FAILED` | 500 | List operation failed |
| `DELETE_FAILED` | 500 | Delete operation failed |
| `SUMMARY_FAILED` | 500 | Summary generation failed |
| `ANNOTATION_FAILED` | 500 | Annotation generation failed |

## Rate Limiting

- **Upload endpoint:** 10 requests per minute
- **Other endpoints:** 100 requests per 15 minutes

Headers included in rate-limited responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Time when limit resets (Unix timestamp)

## Viewing the Documentation

### Option 1: Swagger UI (Recommended)

Install Swagger UI globally:
```bash
npm install -g swagger-ui-watcher
```

View docs:
```bash
cd docs/api
swagger-ui-watcher openapi.yaml
```

Opens browser at `http://localhost:8080`

### Option 2: Redoc

```bash
npx redoc-cli serve openapi.yaml
```

### Option 3: VS Code Extension

1. Install "OpenAPI (Swagger) Editor" extension
2. Open `openapi.yaml`
3. Use preview pane

### Option 4: Online Viewer

1. Copy contents of `openapi.yaml`
2. Visit https://editor.swagger.io/
3. Paste and view

## Example Requests

### Upload a Blueprint

```bash
curl -X POST http://localhost:8090/api/blueprints/upload \
  -F "blueprint=@/path/to/blueprint.pdf" \
  -F "projectName=My Project" \
  -F "projectAddress=123 Main St"
```

### Get Blueprint Details

```bash
curl http://localhost:8090/api/blueprints/123
```

### List All Blueprints

```bash
curl "http://localhost:8090/api/blueprints?page=1&limit=20"
```

### Delete a Blueprint

```bash
curl -X DELETE http://localhost:8090/api/blueprints/123
```

### Get Fixture Summary

```bash
curl http://localhost:8090/api/blueprints/123/summary
```

### Generate Annotated Blueprint

```bash
curl -X POST http://localhost:8090/api/blueprints/123/annotate
```

## Request Examples (JavaScript)

### Using Fetch

```javascript
// Upload blueprint
const formData = new FormData();
formData.append('blueprint', fileInput.files[0]);
formData.append('projectName', 'My Project');

const response = await fetch('http://localhost:8090/api/blueprints/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log('Blueprint ID:', data.blueprint.id);
console.log('Total Fixtures:', data.analysis.totalFixtures);
```

### Using Axios

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('blueprint', fs.createReadStream('blueprint.pdf'));
form.append('projectName', 'My Project');

const response = await axios.post(
  'http://localhost:8090/api/blueprints/upload',
  form,
  { headers: form.getHeaders() }
);

console.log(response.data);
```

## Response Examples

### Successful Upload

```json
{
  "success": true,
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "blueprint": {
    "id": 123,
    "projectName": "North Dallas Residential",
    "projectAddress": "123 Main St, Dallas, TX",
    "fileName": "blueprint.pdf",
    "fileSize": 2547896,
    "status": "completed"
  },
  "analysis": {
    "totalFixtures": 42,
    "totalRooms": 12,
    "fixtureTotals": {
      "toilet": 8,
      "sink": 12,
      "shower": 6,
      "bathtub": 4
    },
    "rooms": [
      {
        "name": "Bathroom 1",
        "type": "bathroom",
        "level": "1st Floor",
        "fixtures": [
          {
            "type": "toilet",
            "quantity": 1
          },
          {
            "type": "sink",
            "quantity": 2,
            "details": "Dual vanity"
          }
        ]
      }
    ],
    "analysisTime": 45.2
  }
}
```

### Error Response

```json
{
  "error": {
    "message": "File validation failed",
    "code": "VALIDATION_FAILED",
    "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "errors": [
      "File size exceeds 200MB limit",
      "File type must be PDF, PNG, or JPEG"
    ]
  }
}
```

## Testing the API

### Using Postman

1. Import `openapi.yaml` into Postman
2. Postman will auto-generate a collection
3. Set environment variable `baseUrl` to `http://localhost:8090`
4. Run requests

### Using cURL Scripts

See [`examples/curl-examples.sh`](../examples/curl-examples.sh) for ready-to-use test scripts.

### Using Automated Tests

```bash
# Run integration tests
npm run test:integration

# Test specific endpoint
npm test -- blueprint-upload.test.js
```

## Webhooks (Future Feature)

Planned webhook support for:
- Blueprint analysis completed
- Analysis failed
- Estimation generated

Subscribe to webhooks:
```http
POST /api/webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["blueprint.completed", "analysis.failed"]
}
```

## SDK Libraries (Planned)

Official SDKs coming soon:
- JavaScript/TypeScript
- Python
- Go

## API Versioning

Current version: **v1** (implied, no version in URL)

Future versions will use URL versioning:
- v2: `/api/v2/blueprints`

Breaking changes will always bump the major version.

## Changelog

### v2.0.0 (2026-01-23)
- Initial OpenAPI documentation
- Blueprint upload and analysis
- Fixture summary endpoints
- Blueprint annotation

### Future (Planned)
- Authentication endpoints
- User management
- Project management
- Estimation and bidding
- Team collaboration
- Real-time updates via WebSocket

## Support

- **Issues:** https://github.com/djscrew1738/PlansiteOS/issues
- **Email:** admin@ctlplumbingllc.com
- **Documentation:** https://docs.ctlplumbingllc.com (coming soon)

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for API contribution guidelines.

## License

MIT License - See [LICENSE](../../LICENSE)
