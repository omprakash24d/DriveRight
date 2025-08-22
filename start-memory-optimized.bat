@echo off
REM DriveRight Memory Optimization Startup Script for Windows
REM This script sets optimal Node.js memory settings and starts the development server

echo 🚀 Starting DriveRight with Memory Optimizations...

REM Set Node.js memory optimization flags
set NODE_OPTIONS=--max-old-space-size=4096 --max-semi-space-size=256 --optimize-for-size

REM Disable Next.js telemetry to save memory
set NEXT_TELEMETRY_DISABLED=1

REM Set development environment
set NODE_ENV=development

REM Force color output
set FORCE_COLOR=1

REM Webpack optimization
set WEBPACK_WORKER_COUNT=2

echo 📊 Memory Settings Applied:
echo    - Max Old Space: 4096MB
echo    - Max Semi Space: 256MB
echo    - Webpack Workers: 2
echo    - Telemetry: Disabled

echo.
echo 🔍 Starting development server on port 9002...
echo 💡 Monitor memory usage: npm run memory:monitor
echo.

REM Start Next.js development server with memory optimizations
npx next dev -p 9002
