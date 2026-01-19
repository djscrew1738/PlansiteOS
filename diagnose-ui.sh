#!/bin/bash

echo "==========================================="
echo "PlansiteOS UI Diagnostics"
echo "==========================================="
echo ""

# Check branch
echo "1. Checking Git Branch..."
BRANCH=$(git branch --show-current)
echo "   Current branch: $BRANCH"
if [ "$BRANCH" != "claude/setup-plansiteos-project-jLlEo" ]; then
    echo "   ⚠️  WARNING: You should be on branch 'claude/setup-plansiteos-project-jLlEo'"
    echo "   Run: git checkout claude/setup-plansiteos-project-jLlEo"
fi
echo ""

# Check if in correct directory
echo "2. Checking Directory..."
if [ ! -d "frontend" ]; then
    echo "   ❌ ERROR: Run this script from the PlansiteOS root directory"
    exit 1
fi
echo "   ✅ In correct directory"
echo ""

# Check component files
echo "3. Checking Component Files..."
COMPONENTS=(
    "frontend/src/components/ui/Button.tsx"
    "frontend/src/components/ui/Card.tsx"
    "frontend/src/components/ui/Modal.tsx"
    "frontend/src/components/ui/Select.tsx"
    "frontend/src/components/ui/Tabs.tsx"
    "frontend/src/components/ui/Spinner.tsx"
    "frontend/src/components/ui/EmptyState.tsx"
    "frontend/src/components/layout/AppShell.tsx"
    "frontend/src/components/layout/Sidebar.tsx"
)

MISSING=0
for component in "${COMPONENTS[@]}"; do
    if [ ! -f "$component" ]; then
        echo "   ❌ Missing: $component"
        MISSING=1
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "   ✅ All component files present"
else
    echo "   ⚠️  Some components are missing! Pull latest changes."
fi
echo ""

# Check dependencies
echo "4. Checking Dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "   ❌ node_modules not found. Run: cd frontend && npm install"
    exit 1
fi
echo "   ✅ node_modules exists"
echo ""

# Check TypeScript compilation
echo "5. Running TypeScript Check..."
cd frontend
npx tsc --noEmit 2>&1 > /tmp/tsc-check.log
if [ $? -eq 0 ]; then
    echo "   ✅ TypeScript compilation successful"
else
    echo "   ❌ TypeScript errors found:"
    cat /tmp/tsc-check.log | tail -20
fi
cd ..
echo ""

# Check if dev server is running
echo "6. Checking Dev Server..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Dev server is running on http://localhost:5173"
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "   ⚠️  Dev server is running on http://localhost:5174 (port 5173 was taken)"
else
    echo "   ❌ Dev server is not running"
    echo "   Start it with: cd frontend && npm run dev"
fi
echo ""

# Test build
echo "7. Testing Production Build..."
cd frontend
npm run build > /tmp/build-output.log 2>&1
if [ $? -eq 0 ]; then
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo "   ✅ Build successful (size: $BUILD_SIZE)"

    # Check if build size is reasonable
    SIZE_KB=$(du -sk dist | cut -f1)
    if [ $SIZE_KB -lt 100 ]; then
        echo "   ⚠️  WARNING: Build size is unusually small ($SIZE_KB KB)"
        echo "   This might indicate missing files or compilation issues"
    fi
else
    echo "   ❌ Build failed:"
    tail -20 /tmp/build-output.log
fi
cd ..
echo ""

echo "==========================================="
echo "Diagnosis Complete!"
echo "==========================================="
echo ""
echo "If everything shows ✅, your UI should be working."
echo ""
echo "Common Issues:"
echo "  • Not on correct branch: git checkout claude/setup-plansiteos-project-jLlEo"
echo "  • Missing dependencies: cd frontend && npm install"
echo "  • Server not running: cd frontend && npm run dev"
echo "  • Browser cache: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
echo ""
echo "Visit: http://localhost:5173"
