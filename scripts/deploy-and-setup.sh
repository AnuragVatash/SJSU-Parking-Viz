#!/bin/bash

echo "🚀 SJSU Parking Viz - Deployment & Setup"
echo "========================================"
echo ""

echo "📋 Pre-deployment checklist:"
echo "✅ QStash account created at https://console.upstash.com/qstash"
echo "✅ Environment variables added to Vercel project:"
echo "   - DATABASE_URL (Neon PostgreSQL)"
echo "   - QSTASH_TOKEN (from Upstash)"
echo "   - QSTASH_CURRENT_SIGNING_KEY (from Upstash)" 
echo "   - QSTASH_NEXT_SIGNING_KEY (from Upstash)"
echo "   - CRON_SECRET (any secure random string)"
echo "   - SJSU_PARKING_URL (SJSU parking status URL)"
echo ""

echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    
    read -p "Enter your deployed URL (e.g., https://your-app.vercel.app): " DEPLOYED_URL
    read -p "Enter your CRON_SECRET: " CRON_SECRET
    
    echo ""
    echo "🔧 Setting up 24/7 automatic scheduler..."
    
    SETUP_RESPONSE=$(curl -s -X POST "${DEPLOYED_URL}/api/setup-scheduler" \
        -H "Authorization: Bearer ${CRON_SECRET}" \
        -H "Content-Type: application/json")
    
    echo "Setup Response: $SETUP_RESPONSE"
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📊 Your SJSU Parking system is now:"
    echo "   • Scraping data every 3 minutes, 24/7"
    echo "   • Storing data in TimescaleDB"
    echo "   • Generating forecasts automatically"
    echo "   • Tracking analytics with Vercel"
    echo ""
    echo "🔗 Access your dashboard: ${DEPLOYED_URL}"
    echo "📈 Check system status: ${DEPLOYED_URL}/status"
    echo "📊 View analytics: https://vercel.com/dashboard/analytics"
    echo ""
    echo "🎯 The system will start collecting data immediately!"
    
else
    echo "❌ Deployment failed. Please check your Vercel configuration."
fi
