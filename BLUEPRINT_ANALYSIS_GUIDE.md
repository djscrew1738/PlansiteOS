# Blueprint Analysis Feature - Complete Guide

## 🎯 Overview

The Blueprint Analysis feature uses Claude's Vision API to automatically analyze plumbing blueprints and extract:
- Complete fixture counts by location
- Measurements for each fixture (width × depth)
- Room-by-room breakdown
- Annotated plans with dimension lines (commercial style)
- Professional legend with fixture totals

---

## 📁 Files Created

```
/home/home/
├── src/
│   ├── services/
│   │   ├── BlueprintService.js                [NEW] Claude Vision analysis
│   │   └── BlueprintVisualizationService.js   [NEW] Dimension lines & legends
│   ├── routes/
│   │   └── blueprints.js                      [NEW] Blueprint API routes
│   └── utils/
│       └── fileUpload.js                      [NEW] File upload handling
├── migrations/
│   └── add_blueprint_analysis.sql             [NEW] Database schema
└── BLUEPRINT_ANALYSIS_GUIDE.md                [THIS FILE]
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --save multer canvas uuid
```

Required packages:
- `multer` - File upload handling
- `canvas` - Image manipulation and annotation
- `uuid` - Unique filename generation

### 2. Run Database Migration

```bash
psql $DATABASE_URL < migrations/add_blueprint_analysis.sql
```

**Verify migration:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'blueprint%';
```

Expected tables:
- `blueprints`
- `blueprint_fixtures`
- `blueprint_rooms`
- `blueprint_analysis_log`
- `fixture_types_reference`

### 3. Create Upload Directory

```bash
mkdir -p uploads/blueprints
chmod 755 uploads/blueprints
```

### 4. Add Routes to Express App

```javascript
// app.js or server.js
const blueprintRoutes = require('./src/routes/blueprints');

// Add blueprint routes
app.use('/api/blueprints', blueprintRoutes);
```

### 5. Test the API

```bash
# Upload and analyze a blueprint
curl -X POST http://localhost:3000/api/blueprints/upload \
  -F "blueprint=@/path/to/blueprint.jpg" \
  -F "projectName=Smith Residence" \
  -F "projectAddress=123 Main St"
```

---

## 📊 How It Works

### Analysis Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. User uploads blueprint (JPG/PNG/PDF)               │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  2. File validation & storage                           │
│     - Check file type                                   │
│     - Check file size (<50MB)                           │
│     - Generate unique filename                          │
│     - Save to uploads/blueprints/                       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  3. Database record created                             │
│     - INSERT into blueprints table                      │
│     - Status: 'processing'                              │
│     - Correlation ID assigned                           │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  4. Claude Vision API Analysis                          │
│     - Read & encode image                               │
│     - Send to Claude 3.5 Sonnet                        │
│     - Receive structured JSON analysis                  │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  5. Parse & Structure Results                           │
│     - Extract fixtures by room                          │
│     - Get measurements for each fixture                 │
│     - Calculate totals                                  │
│     - Enrich with reference data                        │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  6. Save to Database (Transaction)                      │
│     - UPDATE blueprints (status='completed')            │
│     - INSERT rooms                                      │
│     - INSERT fixtures                                   │
│     - All or nothing (ACID)                             │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  7. Return Results to User                              │
│     - Fixture counts by type                            │
│     - Room-by-room breakdown                            │
│     - Measurements for each fixture                     │
│     - Total fixture count                               │
└─────────────────────────────────────────────────────────┘
```

### Annotation Flow (Dimension Lines)

```
┌─────────────────────────────────────────────────────────┐
│  1. Load original blueprint image                       │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  2. Create canvas with same dimensions                  │
│     - Draw original image as background                 │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  3. For EACH fixture, draw TWO dimension lines:         │
│     ┌───────────────────────────────────┐              │
│     │  Line 1: WIDTH (horizontal)       │              │
│     │  - Above the fixture              │              │
│     │  - Arrows on both ends            │              │
│     │  - Measurement text on line       │              │
│     │  - Extension lines (witness)      │              │
│     └───────────────────────────────────┘              │
│     ┌───────────────────────────────────┐              │
│     │  Line 2: DEPTH (vertical)         │              │
│     │  - Left of the fixture            │              │
│     │  - Arrows on both ends            │              │
│     │  - Measurement text on line       │              │
│     │  - Extension lines (witness)      │              │
│     └───────────────────────────────────┘              │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  4. Draw LEGEND (bottom right corner)                   │
│     - White background with border                      │
│     - Title: "PLUMBING FIXTURE SCHEDULE"                │
│     - List each fixture type with count                 │
│     - Color-coded symbols                               │
│     - Total fixture count                               │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│  5. Save annotated blueprint                            │
│     - Format: PNG                                       │
│     - Filename: original-annotated.png                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Dimension Line Style (Commercial Standard)

### Example for a Single Fixture:

```
       ┌─── Extension Line (witness line)
       │
       │   ◄──── 20" ────►     ← Dimension Line with arrows
       │                        and measurement text
       ▼
    ┌──────────────────┐
    │                  │
12" │    LAVATORY      │  ← Fixture outline (highlighted)
    │                  │
    └──────────────────┘
    ▲
    │
    └─── Extension Line
```

### Key Elements:
1. **Dimension Lines**: Main measurement lines with arrows
2. **Extension Lines**: Dashed lines extending from fixture to dimension line
3. **Arrows**: Filled triangular arrows at both ends
4. **Measurement Text**: Clear, legible text centered on line
5. **Fixture Highlight**: Semi-transparent red overlay with outline

---

## 📖 API Reference

### Upload Blueprint

**Endpoint:** `POST /api/blueprints/upload`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `blueprint` (file, required) - Blueprint image file
- `projectName` (string, optional) - Project name
- `projectAddress` (string, optional) - Project address

**Example:**
```bash
curl -X POST http://localhost:3000/api/blueprints/upload \
  -F "blueprint=@blueprint.jpg" \
  -F "projectName=Smith Residence" \
  -F "projectAddress=123 Main St, Dallas TX"
```

**Response:**
```json
{
  "success": true,
  "correlationId": "abc-123-def-456",
  "blueprint": {
    "id": 1,
    "projectName": "Smith Residence",
    "projectAddress": "123 Main St, Dallas TX",
    "fileName": "blueprint.jpg",
    "fileSize": 2458123,
    "status": "completed"
  },
  "analysis": {
    "totalFixtures": 12,
    "totalRooms": 4,
    "fixtureTotals": {
      "lavatory": 3,
      "toilet": 2,
      "shower": 2,
      "kitchen_sink": 1,
      "hose_bib": 2,
      "floor_drain": 2
    },
    "rooms": [
      {
        "name": "Master Bathroom",
        "floor": "1",
        "fixtureCount": 4,
        "fixtures": [
          {
            "type": "lavatory",
            "quantity": 2,
            "width": 20,
            "depth": 18,
            "unit": "inches",
            "confidence": 95,
            "notes": "Double vanity"
          },
          {
            "type": "toilet",
            "quantity": 1,
            "width": 15,
            "depth": 28,
            "unit": "inches",
            "confidence": 95
          },
          {
            "type": "shower",
            "quantity": 1,
            "width": 36,
            "depth": 36,
            "unit": "inches",
            "confidence": 90
          }
        ]
      }
    ],
    "analysisTime": 8500
  }
}
```

### Get Blueprint Details

**Endpoint:** `GET /api/blueprints/:id`

**Example:**
```bash
curl http://localhost:3000/api/blueprints/1
```

**Response:**
```json
{
  "success": true,
  "correlationId": "xyz-789",
  "blueprint": {
    "id": 1,
    "projectName": "Smith Residence",
    "status": "completed",
    "totalFixtures": 12,
    "createdAt": "2026-01-07T10:00:00Z",
    "completedAt": "2026-01-07T10:00:09Z"
  },
  "summary": {
    "totalFixtures": 12,
    "totalRooms": 4,
    "scale": "1/4\" = 1'-0\"",
    "measurementUnit": "inches"
  },
  "fixtureCounts": [
    { "fixture_type": "lavatory", "count": 3, "avg_confidence": 95 },
    { "fixture_type": "toilet", "count": 2, "avg_confidence": 95 },
    { "fixture_type": "shower", "count": 2, "avg_confidence": 90 }
  ],
  "fixturesByRoom": [
    {
      "room_name": "Master Bathroom",
      "fixture_type": "lavatory",
      "count": 2,
      "total_width": 40,
      "total_depth": 36
    }
  ]
}
```

### Generate Annotated Blueprint

**Endpoint:** `POST /api/blueprints/:id/annotate`

**Example:**
```bash
curl -X POST http://localhost:3000/api/blueprints/1/annotate
```

**Response:**
```json
{
  "success": true,
  "correlationId": "def-456",
  "annotatedImagePath": "/uploads/blueprints/abc-123-blueprint-annotated.png",
  "message": "Annotated blueprint generated successfully"
}
```

### List All Blueprints

**Endpoint:** `GET /api/blueprints`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Example:**
```bash
curl "http://localhost:3000/api/blueprints?page=1&limit=10"
```

### Get Fixture Summary

**Endpoint:** `GET /api/blueprints/:id/summary`

**Example:**
```bash
curl http://localhost:3000/api/blueprints/1/summary
```

### Delete Blueprint

**Endpoint:** `DELETE /api/blueprints/:id`

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/blueprints/1
```

---

## 🧪 Testing

### Test 1: Upload Simple Blueprint

```bash
# Create a test blueprint (or use existing)
curl -X POST http://localhost:3000/api/blueprints/upload \
  -F "blueprint=@test-blueprint.jpg" \
  -F "projectName=Test Project"
```

**Expected:**
- Blueprint uploaded successfully
- Analysis completed in 5-15 seconds
- Fixtures detected and counted
- Response includes fixture breakdown

### Test 2: Get Analysis Results

```bash
# Get the blueprint ID from previous response
curl http://localhost:3000/api/blueprints/1
```

**Expected:**
- Complete fixture list
- Room-by-room breakdown
- Measurements for each fixture

### Test 3: Generate Annotated Blueprint

```bash
curl -X POST http://localhost:3000/api/blueprints/1/annotate
```

**Expected:**
- Annotated image generated
- Dimension lines visible on fixtures
- Legend in bottom right corner
- Measurements clearly labeled

### Test 4: Verify Database

```sql
-- Check blueprint record
SELECT * FROM blueprints WHERE id = 1;

-- Check detected fixtures
SELECT fixture_type, COUNT(*), AVG(confidence_score)
FROM blueprint_fixtures
WHERE blueprint_id = 1
GROUP BY fixture_type;

-- Check fixtures by room
SELECT * FROM get_fixtures_by_room(1);

-- Check total fixture count
SELECT get_total_fixture_count(1);
```

---

## 🎨 Customization

### Change Dimension Line Styling

```javascript
// In BlueprintVisualizationService
const options = {
  dimensionLineColor: '#0000FF',  // Blue dimension lines
  dimensionLineWidth: 2,           // Thicker lines
  dimensionTextSize: 14,           // Larger text
  fixtureOutlineColor: '#00FF00'  // Green fixture highlights
};

await BlueprintVisualizationService.createAnnotatedBlueprint(
  imagePath,
  analysisData,
  options
);
```

### Change Legend Position

```javascript
const options = {
  legendPosition: 'bottom-left',  // or 'top-right', 'top-left'
  legendPadding: 30,               // More padding
  legendMargin: 50                 // More margin from edge
};
```

### Add Custom Fixture Types

```sql
-- Add new fixture type
INSERT INTO fixture_types_reference (
  fixture_type, display_name, typical_width_inches,
  typical_depth_inches, category, icon_name
) VALUES (
  'mop_sink', 'Mop Sink', 24, 24, 'utility', 'mop-sink'
);
```

---

## 🔧 Troubleshooting

### Issue: Analysis Fails with "Invalid Image"

**Cause:** Unsupported file format or corrupted image

**Solution:**
```bash
# Check file type
file blueprint.jpg

# Convert if needed
convert blueprint.tiff blueprint.jpg

# Ensure file is valid
identify blueprint.jpg
```

### Issue: "ANTHROPIC_API_KEY not set"

**Cause:** Missing API key

**Solution:**
```bash
# Add to .env file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env

# Or export temporarily
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Issue: No Fixtures Detected

**Cause:** Blueprint unclear or not standard format

**Solution:**
1. Ensure blueprint is high resolution (min 1200px width)
2. Check that fixtures are clearly visible
3. Ensure blueprint has proper labels/symbols
4. Try pre-processing image (increase contrast, clean up)

### Issue: Dimension Lines Not Showing

**Cause:** Fixture positions not detected

**Solution:**
- Claude Vision estimates positions if not clearly marked
- Fixtures need clear outlines on blueprint
- Consider manual position override:

```javascript
// Override fixture positions
const fixtures = analysisData.rooms[0].fixtures;
fixtures[0].position_x = 100;
fixtures[0].position_y = 200;
```

### Issue: "File too large" Error

**Cause:** Blueprint exceeds 50MB limit

**Solution:**
```bash
# Compress image
convert blueprint.jpg -quality 85 -resize 3000x3000\> blueprint-compressed.jpg

# Or use ImageMagick
mogrify -quality 85 -resize 3000x3000\> blueprint.jpg
```

---

## 📊 Performance

### Expected Times:
- **File Upload**: <1 second
- **Claude Vision Analysis**: 5-15 seconds (depends on image complexity)
- **Database Storage**: <1 second
- **Annotation Generation**: 2-5 seconds
- **Total End-to-End**: 8-20 seconds

### Optimization Tips:
1. **Pre-process images** before upload (resize, compress)
2. **Use CDN** for storing/serving annotated images
3. **Cache results** for repeated requests
4. **Implement queue** for batch processing multiple blueprints
5. **Use thumbnails** for listing view

---

## 🚀 Production Deployment

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Optional
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=52428800  # 50MB in bytes
NODE_ENV=production
```

### Nginx Configuration

```nginx
# Allow large file uploads
client_max_body_size 50M;

# Serve uploaded files
location /uploads/ {
    alias /var/www/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Disk Space Management

```bash
# Set up cron job to clean old blueprints
# /etc/cron.daily/cleanup-blueprints
#!/bin/bash
node -e "
  const { cleanupOldFiles } = require('./src/utils/fileUpload');
  cleanupOldFiles(90).then(count => {
    console.log(\`Cleaned up \${count} files\`);
  });
"
```

### Monitoring

```bash
# Check blueprint analysis health
curl http://localhost:3000/api/health

# Monitor upload directory size
du -sh /var/www/uploads/blueprints

# Check database table sizes
psql $DATABASE_URL -c "\dt+ blueprint*"
```

---

## 📚 Additional Features to Consider

### Future Enhancements:
1. **PDF Support** - Extract individual pages from multi-page PDFs
2. **Batch Upload** - Process multiple blueprints at once
3. **Comparison View** - Compare fixtures across revisions
4. **Cost Estimation** - Calculate material costs based on fixtures
5. **Export Options** - Export to Excel/CSV/PDF reports
6. **3D Visualization** - Generate 3D plumbing models
7. **Validation Rules** - Check against plumbing codes
8. **Collaboration** - Share blueprints with team members

---

## 🎓 Resources

- [Claude Vision API Docs](https://docs.anthropic.com/claude/docs/vision)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Canvas API](https://github.com/Automattic/node-canvas)
- [Commercial Blueprint Standards](https://www.aspe.org/standards)

---

**Implementation Date**: January 2026
**Status**: ✅ Complete and Ready for Production
**Version**: 1.0.0
