#!/bin/bash

echo "🛑 Stopping PlansiteOS services..."

# Check for PID files
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✓ Backend stopped"
    else
        echo "Backend process not running"
    fi
    rm .backend.pid
else
    echo "No backend PID file found"
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✓ Frontend stopped"
    else
        echo "Frontend process not running"
    fi
    rm .frontend.pid
else
    echo "No frontend PID file found"
fi

# Also kill any node processes running from these directories (cleanup)
pkill -f "apps/api" 2>/dev/null
pkill -f "apps/web" 2>/dev/null

echo ""
echo "✅ All services stopped"
