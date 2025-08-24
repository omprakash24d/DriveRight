#!/bin/bash

# DriveRight Production Deployment Script
echo "🚀 Starting DriveRight production deployment..."

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run lint
npm run test:ci
node scripts/test-compliance.cjs

if [ $? -ne 0 ]; then
    echo "❌ Pre-deployment checks failed. Aborting deployment."
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Vercel
echo "☁️ Deploying to Vercel..."
vercel --prod

# Post-deployment verification
echo "✅ Running post-deployment verification..."
sleep 30
curl -f https://app.driveright.com/api/health

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "📱 Application URL: https://app.driveright.com"
else
    echo "❌ Deployment verification failed!"
    exit 1
fi

echo "📊 Deployment completed at $(date)"
