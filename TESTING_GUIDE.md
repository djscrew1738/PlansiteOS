# Blueprint Analysis Testing Guide

## 🎯 Overview

This guide walks you through testing the blueprint analysis feature using three different methods:
1. **Automated Node.js Test Script** (recommended)
2. **Web Browser Interface** (easiest)
3. **Manual cURL Commands** (most control)

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

```bash
# 1. Make sure your server is running
npm start

# 2. Verify it's running
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "timestamp": "2026-01-07T...",
  "status": "healthy",
  "services": {
    "database": { "healthy": true },
    "ai": { "initialized": true },
    "blueprints": { "initialized": true }
  }
}
```

---

## Method 1: Automated Test Script (Recommended)

### Run the Test

```bash
# With your own blueprint
node test-blueprint-analysis.js your-blueprint.jpg

# Or let it create a test blueprint
node test-blueprint-analysis.js
```

### What It Does

The script automatically:
1. ✅ Checks if blueprint file exists (creates one if needed)
2. ✅ Verifies API is running
3. ✅ Uploads blueprint
4. ✅ Displays analysis results
5. ✅ Gets blueprint details
6. ✅ Fetches fixture summary
7. ✅ Generates annotated blueprint
8. ✅ Lists all blueprints

### Expected Output

```
🧪 Blueprint Analysis Test Suite

Testing API at: http://localhost:3000

============================================================
Step 1: Check Blueprint File
============================================================
✓ Blueprint file found: test-blueprint.jpg
ℹ File size: 0.15 MB

============================================================
Step 2: Check API Connection
============================================================
✓ API is running and healthy

============================================================
Step 3: Upload Blueprint
============================================================
ℹ Uploading blueprint to API...
✓ Blueprint uploaded successfully in 8234ms
ℹ Blueprint ID: 1
ℹ Project Name: Test Blueprint 2026-01-07
ℹ Status: completed

📊 Analysis Results:
ℹ Total Fixtures: 4
ℹ Total Rooms: 1
ℹ Analysis Time: 8156ms

🔧 Fixture Totals:
ℹ   toilet: 1
ℹ   lavatory: 2
ℹ   shower: 1

🏠 Rooms:
ℹ   Bathroom: 4 fixtures
    - 1x toilet (15" x 28")
    - 2x lavatory (20" x 18")
    - 1x shower (36" x 36")

============================================================
Step 6: Generate Annotated Blueprint
============================================================
✓ Annotated blueprint generated in 2341ms
ℹ Output path: /home/home/uploads/blueprints/abc-123-annotated.png
✓ Annotated file exists (0.45 MB)

============================================================
🎉 All Tests Passed!
============================================================

📊 Test Summary:
✓ Blueprint uploaded (ID: 1)
✓ Analysis completed
✓ Details retrieved
✓ Summary generated
✓ Annotated blueprint created
✓ Blueprint list fetched

💡 Next Steps:
1. View annotated blueprint in uploads/blueprints/
2. Check database: psql $DATABASE_URL -c "SELECT * FROM blueprints WHERE id = 1"
3. Test in browser: http://localhost:3000/api/blueprints/1
```

---

## Method 2: Web Browser Interface (Easiest)

### Open the Test Interface

```bash
# Option 1: Serve the HTML file
python3 -m http.server 8080

# Option 2: Open directly in browser
open test-blueprint.html  # Mac
xdg-open test-blueprint.html  # Linux
```

Then navigate to: `http://localhost:8080/test-blueprint.html`

### Using the Interface

1. **Upload Blueprint**
   - Click upload area or drag & drop
   - Fill in project name (optional)
   - Click "Analyze Blueprint"

2. **View Results**
   - See fixture counts
   - View room breakdown
   - Check measurements

3. **Generate Annotated**
   - Click "Generate Annotated Blueprint"
   - Wait 2-5 seconds
   - Check output path

### Features

- 📤 Drag & drop file upload
- 🎨 Beautiful, responsive UI
- ⚡ Real-time progress indicators
- 📊 Visual results display
- 🖼️ Annotated blueprint generation

---

## Method 3: Quick Bash Script

### Run the Script

```bash
# With your blueprint
./test-blueprint.sh your-blueprint.jpg

# With test blueprint
./test-blueprint.sh
```

### Expected Output

```
========================================
Blueprint Analysis Quick Test
========================================

Checking if server is running...
✓ Server is running

✓ Blueprint file found: test-blueprint.jpg
  File size: 150K

Uploading blueprint...
✓ Blueprint uploaded successfully

========================================
Analysis Results
========================================
Blueprint ID: 1
Correlation ID: abc-123-def-456
Total Fixtures: 4
Total Rooms: 1
Analysis Time: 8156ms

Fixture Totals:
  toilet: 1
  lavatory: 2
  shower: 1

Rooms:
  Bathroom: 4 fixtures

Generating annotated blueprint...
✓ Annotated blueprint generated
  Output: /home/home/uploads/blueprints/abc-123-annotated.png

✓ Annotated file exists on disk
  Size: 450K

========================================
✓ Test Completed Successfully
========================================

Next steps:
1. View blueprint: http://localhost:3000/api/blueprints/1
2. Check annotated file: /home/home/uploads/blueprints/abc-123-annotated.png
3. View in browser: http://localhost:3000/test-blueprint.html
```

---

## Method 4: Manual cURL Commands

### Step-by-Step Testing

#### 1. Check Health

```bash
curl http://localhost:3000/api/health
```

#### 2. Upload Blueprint

```bash
curl -X POST http://localhost:3000/api/blueprints/upload \
  -F "blueprint=@blueprint.jpg" \
  -F "projectName=My Project" \
  -F "projectAddress=123 Main St" \
  | jq '.'
```

Save the `blueprint.id` from the response (e.g., `1`)

#### 3. Get Blueprint Details

```bash
curl http://localhost:3000/api/blueprints/1 | jq '.'
```

#### 4. Get Fixture Summary

```bash
curl http://localhost:3000/api/blueprints/1/summary | jq '.'
```

#### 5. Generate Annotated Blueprint

```bash
curl -X POST http://localhost:3000/api/blueprints/1/annotate | jq '.'
```

#### 6. View Annotated Image

```bash
# Get the path from previous response
open uploads/blueprints/*-annotated.png
```

#### 7. List All Blueprints

```bash
curl http://localhost:3000/api/blueprints?limit=10 | jq '.'
```

#### 8. Delete Blueprint

```bash
curl -X DELETE http://localhost:3000/api/blueprints/1 | jq '.'
```

---

## 🧪 Testing Different Scenarios

### Test 1: Simple Blueprint

Create a simple test blueprint:
```bash
node test-blueprint-analysis.js
```

**Expected:**
- 3-4 fixtures detected
- 1 room identified
- Analysis completes in 5-10 seconds

### Test 2: Complex Blueprint

Use a real plumbing blueprint with multiple rooms:
```bash
node test-blueprint-analysis.js complex-blueprint.pdf
```

**Expected:**
- 10+ fixtures detected
- Multiple rooms identified
- Measurements for each fixture
- Analysis completes in 10-15 seconds

### Test 3: Large File

Test with a large (30-40MB) blueprint:
```bash
node test-blueprint-analysis.js large-blueprint.jpg
```

**Expected:**
- Upload takes 2-5 seconds
- Analysis takes 15-20 seconds
- Annotated file is generated

### Test 4: Invalid File

Test error handling:
```bash
curl -X POST http://localhost:3000/api/blueprints/upload \
  -F "blueprint=@invalid.txt"
```

**Expected:**
- Status 400
- Error message: "Invalid file extension"

### Test 5: Missing API Key

Test without Claude API key:
```bash
# Temporarily remove API key
unset ANTHROPIC_API_KEY
npm restart

# Try upload
node test-blueprint-analysis.js
```

**Expected:**
- Upload succeeds
- Analysis fails with clear error message

---

## 📊 Verifying Results

### Check Database

```sql
-- Get blueprint record
SELECT * FROM blueprints WHERE id = 1;

-- Get detected fixtures
SELECT fixture_type, COUNT(*), AVG(confidence_score)
FROM blueprint_fixtures
WHERE blueprint_id = 1
GROUP BY fixture_type;

-- Get room breakdown
SELECT * FROM get_fixtures_by_room(1);

-- Get fixture counts
SELECT * FROM get_fixture_counts(1);

-- Get total count
SELECT get_total_fixture_count(1);
```

### Check Files

```bash
# List uploaded blueprints
ls -lh uploads/blueprints/

# Check file exists
ls uploads/blueprints/*-annotated.png

# View image (Mac)
open uploads/blueprints/*-annotated.png

# View image (Linux)
xdg-open uploads/blueprints/*-annotated.png
```

### Check Logs

```bash
# Watch logs in real-time
tail -f logs/combined.log

# Search for blueprint analysis
grep "blueprint" logs/combined.log

# Search by correlation ID
grep "abc-123-def-456" logs/combined.log

# Check for errors
grep "ERROR" logs/combined.log | grep "blueprint"
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to API"

**Solution:**
```bash
# Check if server is running
ps aux | grep node

# Start server
npm start

# Check port
lsof -i :3000
```

### Issue: "ANTHROPIC_API_KEY not set"

**Solution:**
```bash
# Add to .env
echo "ANTHROPIC_API_KEY=sk-ant-your-key" >> .env

# Restart server
npm restart
```

### Issue: "No fixtures detected"

**Causes:**
- Blueprint image unclear
- Wrong file format
- Image too small

**Solutions:**
```bash
# Check image
identify blueprint.jpg

# Enhance image
convert blueprint.jpg -normalize -enhance blueprint-enhanced.jpg

# Resize if too large
convert blueprint.jpg -resize 3000x3000\> blueprint-resized.jpg
```

### Issue: "File too large"

**Solution:**
```bash
# Compress image
convert blueprint.jpg -quality 85 blueprint-compressed.jpg

# Check size
ls -lh blueprint-compressed.jpg
```

### Issue: "Annotated blueprint not generated"

**Solution:**
```bash
# Check canvas installation
npm list canvas

# Reinstall if needed
npm install canvas --build-from-source

# Check logs
grep "annotation" logs/combined.log
```

---

## ✅ Test Checklist

Use this checklist to verify everything works:

- [ ] Server starts without errors
- [ ] Health check returns 200
- [ ] Blueprint uploads successfully
- [ ] Analysis completes in <20 seconds
- [ ] Fixtures are detected
- [ ] Measurements are extracted
- [ ] Rooms are identified
- [ ] Database records created
- [ ] Annotated blueprint generated
- [ ] Dimension lines visible
- [ ] Legend appears in bottom right
- [ ] Measurements labeled clearly
- [ ] Can retrieve blueprint details
- [ ] Can list blueprints
- [ ] Can delete blueprint
- [ ] Files cleaned up on delete
- [ ] Correlation IDs in logs
- [ ] No errors in logs

---

## 📈 Performance Benchmarks

Expected performance:

| Operation | Expected Time |
|-----------|--------------|
| File upload | <1 second |
| Claude Vision analysis | 5-15 seconds |
| Database storage | <1 second |
| Annotation generation | 2-5 seconds |
| **Total** | **8-20 seconds** |

---

## 🎯 Success Criteria

Your blueprint analysis is working if:

1. ✅ Upload completes without errors
2. ✅ At least 80% of fixtures detected
3. ✅ Measurements extracted for fixtures
4. ✅ Annotated blueprint has TWO dimension lines per fixture
5. ✅ Legend shows fixture totals
6. ✅ Database records match analysis
7. ✅ Correlation IDs track the request
8. ✅ Files saved to correct location

---

## 📚 Next Steps

After successful testing:

1. **Try with real blueprints** from actual projects
2. **Tune Claude's prompt** if detection accuracy is low
3. **Adjust dimension line styling** to match your preferences
4. **Set up monitoring** for analysis failures
5. **Configure backup** for uploaded files
6. **Add authentication** to blueprint endpoints
7. **Implement batch processing** for multiple blueprints

---

## 💡 Tips

- **Use high-resolution images** (min 1200px width) for best results
- **Clean blueprints work best** - remove pencil marks, coffee stains
- **Standard symbols** are detected more accurately
- **Labeled fixtures** improve detection rates
- **Test with variety** - residential, commercial, multi-floor

---

**Happy Testing!** 🎉

If you encounter issues not covered here, check:
- [BLUEPRINT_ANALYSIS_GUIDE.md](./BLUEPRINT_ANALYSIS_GUIDE.md)
- [COMPLETE_SETUP_GUIDE.md](./COMPLETE_SETUP_GUIDE.md)
- Application logs: `logs/combined.log`
