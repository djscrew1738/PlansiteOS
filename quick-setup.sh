#!/bin/bash

echo "🚀 PlansiteOS Quick Setup Script"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the PlansiteOS root directory"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "claude/setup-plansiteos-project-jLlEo" ]; then
    echo ""
    echo "⚠️  You're on the wrong branch!"
    echo "   Switching to: claude/setup-plansiteos-project-jLlEo"
    echo ""
    git checkout claude/setup-plansiteos-project-jLlEo

    if [ $? -ne 0 ]; then
        echo "❌ Failed to checkout branch. Trying to fetch..."
        git fetch origin claude/setup-plansiteos-project-jLlEo
        git checkout claude/setup-plansiteos-project-jLlEo
    fi
fi

echo ""
echo "✅ On correct branch: claude/setup-plansiteos-project-jLlEo"
echo ""

# Navigate to frontend
cd frontend

# Clean install
echo "🧹 Cleaning old dependencies..."
rm -rf node_modules package-lock.json

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎉 To start the development server, run:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "📱 The app will be available at: http://localhost:5173/"
