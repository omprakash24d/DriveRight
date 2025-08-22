#!/bin/bash

# DriveRight Memory Optimization Startup Script
# This script sets optimal Node.js memory settings and starts the development server

echo "🚀 Starting DriveRight with Memory Optimizations..."

# Set Node.js memory optimization flags
export NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=256 --optimize-for-size"

# Disable Next.js telemetry to save memory
export NEXT_TELEMETRY_DISABLED=1

# Set development environment
export NODE_ENV=development

# Force color output
export FORCE_COLOR=1

# Webpack optimization
export WEBPACK_WORKER_COUNT=2

echo "📊 Memory Settings Applied:"
echo "   - Max Old Space: 4096MB"
echo "   - Max Semi Space: 256MB"
echo "   - Webpack Workers: 2"
echo "   - Telemetry: Disabled"

echo ""
echo "🔍 Starting development server on port 9002..."
echo "💡 Monitor memory usage: npm run memory:monitor"
echo ""

# Start Next.js development server with memory optimizations
npx next dev -p 9002
