#!/bin/bash

# StatMind Sports - Frontend Display Fix Script
# This script fixes the "0 predictions" issue

echo "🔧 StatMind Sports - Frontend Display Fix"
echo "=========================================="

# Navigate to project directory
cd /root/statmind-sports || exit 1

# Step 1: Verify API is working
echo ""
echo "📡 Step 1: Testing API endpoint..."
API_RESPONSE=$(curl -s http://localhost:4000/api/predictions/week/2025/7)
PREDICTION_COUNT=$(echo "$API_RESPONSE" | jq '.count' 2>/dev/null || echo "0")

if [ "$PREDICTION_COUNT" -gt 0 ]; then
    echo "✅ API is working: $PREDICTION_COUNT predictions found"
    echo "   Sample response structure:"
    echo "$API_RESPONSE" | jq '.predictions[0] | {homeTeamKey, awayTeamKey, predictedWinner, confidence}' 2>/dev/null || echo "   (Could not parse JSON)"
else
    echo "❌ API returned no predictions or is not responding"
    echo "   Response: $API_RESPONSE"
    exit 1
fi

# Step 2: Check environment variables
echo ""
echo "🔍 Step 2: Checking environment variables..."
cd frontend

if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    grep "NEXT_PUBLIC_API_URL" .env.local || echo "⚠️  NEXT_PUBLIC_API_URL not found in .env.local"
else
    echo "⚠️  .env.local not found - creating it..."
    cat > .env.local << EOF
# Production API URL (uses reverse proxy)
NEXT_PUBLIC_API_URL=https://statmindsports.com/api

# For local development:
# NEXT_PUBLIC_API_URL=http://localhost:4000/api
EOF
    echo "✅ Created .env.local with production API URL"
fi

# Step 3: Clear Next.js cache
echo ""
echo "🧹 Step 3: Clearing Next.js cache..."
rm -rf .next/cache
rm -rf .next/
echo "✅ Cache cleared"

# Step 4: Rebuild frontend
echo ""
echo "🔨 Step 4: Rebuilding frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

# Step 5: Restart frontend with PM2
echo ""
echo "🔄 Step 5: Restarting frontend..."
pm2 restart statmind-frontend

if [ $? -eq 0 ]; then
    echo "✅ Frontend restarted"
else
    echo "❌ Failed to restart frontend"
    exit 1
fi

# Step 6: Wait for frontend to be ready
echo ""
echo "⏳ Waiting 5 seconds for frontend to start..."
sleep 5

# Step 7: Test the frontend API call
echo ""
echo "🧪 Step 7: Testing frontend API call..."
FRONTEND_TEST=$(curl -s https://statmindsports.com/api/predictions/week/2025/7)
FRONTEND_COUNT=$(echo "$FRONTEND_TEST" | jq '.count' 2>/dev/null || echo "0")

if [ "$FRONTEND_COUNT" -gt 0 ]; then
    echo "✅ Public API endpoint working: $FRONTEND_COUNT predictions"
else
    echo "⚠️  Public API check: $FRONTEND_COUNT predictions"
    echo "   This might be a reverse proxy issue"
fi

# Step 8: Show PM2 status
echo ""
echo "📊 Step 8: PM2 Process Status"
pm2 list

echo ""
echo "=========================================="
echo "✨ Fix Complete!"
echo ""
echo "Next steps:"
echo "1. Visit https://statmindsports.com and hard refresh (Ctrl+Shift+R)"
echo "2. Open browser DevTools (F12) and check Console for errors"
echo "3. Check Network tab to see if API calls are succeeding"
echo ""
echo "If predictions still don't show:"
echo "- Run: pm2 logs statmind-frontend"
echo "- Check: curl https://statmindsports.com/api/predictions/week/2025/7"
echo ""
