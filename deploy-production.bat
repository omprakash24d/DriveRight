@echo off
setlocal enabledelayedexpansion

REM ===========================================
REM Production Deployment Script for DriveRight (Windows)
REM ===========================================

echo.
echo 🚀 Starting Production Deployment for DriveRight Payment System
echo ===============================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if .env.production exists
if not exist ".env.production" (
    echo [ERROR] .env.production file not found. Please create it using the template in PRODUCTION_PAYMENT_SETUP.md
    pause
    exit /b 1
)

REM Step 1: Environment Setup
echo [STEP] 1. Setting up production environment...
set NODE_ENV=production
echo [INFO] Environment set to production

REM Step 2: Install Dependencies
echo.
echo [STEP] 2. Installing production dependencies...
call npm ci --only=production
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [INFO] Dependencies installed successfully

REM Step 3: Build Application
echo.
echo [STEP] 3. Building application for production...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [INFO] Application built successfully

REM Step 4: Payment Gateway Configuration Check
echo.
echo [STEP] 4. Checking payment gateway configuration...

REM Load environment variables from .env.production
for /f "usebackq tokens=1,2 delims==" %%a in (".env.production") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set "%%a=%%b"
    )
)

REM Check critical variables
set missing_vars=
if "%RAZORPAY_KEY_ID%"=="" set missing_vars=!missing_vars! RAZORPAY_KEY_ID
if "%RAZORPAY_KEY_SECRET%"=="" set missing_vars=!missing_vars! RAZORPAY_KEY_SECRET
if "%NEXT_PUBLIC_FIREBASE_PROJECT_ID%"=="" set missing_vars=!missing_vars! NEXT_PUBLIC_FIREBASE_PROJECT_ID
if "%FIREBASE_SERVICE_ACCOUNT_KEY%"=="" set missing_vars=!missing_vars! FIREBASE_SERVICE_ACCOUNT_KEY
if "%SMTP_HOST%"=="" set missing_vars=!missing_vars! SMTP_HOST
if "%SMTP_USER%"=="" set missing_vars=!missing_vars! SMTP_USER
if "%SMTP_PASS%"=="" set missing_vars=!missing_vars! SMTP_PASS

if not "%missing_vars%"=="" (
    echo [ERROR] Missing required environment variables:
    echo %missing_vars%
    echo Please check your .env.production file
    pause
    exit /b 1
)

echo [INFO] All required environment variables are set

REM Step 5: Security Check
echo.
echo [STEP] 5. Running security checks...

REM Check if HTTPS is enabled
echo %NEXT_PUBLIC_APP_URL% | findstr /i "https://" >nul
if errorlevel 1 (
    echo [WARNING] HTTPS not enabled. This is required for production!
) else (
    echo [INFO] HTTPS enabled in configuration
)

REM Check for development environment file
if exist ".env" (
    echo [WARNING] .env file found. Make sure it doesn't contain production secrets!
)

echo [INFO] Security checks completed

REM Step 6: Create deployment package
echo.
echo [STEP] 6. Creating deployment package...

if exist "deployment" rmdir /s /q "deployment"
mkdir deployment
xcopy /s /e ".next" "deployment\.next\" >nul
copy "package.json" "deployment\" >nul
copy "package-lock.json" "deployment\" >nul
copy ".env.production" "deployment\.env" >nul
xcopy /s /e "public" "deployment\public\" >nul

echo [INFO] Deployment package created in .\deployment directory

REM Final recommendations
echo.
echo [STEP] 7. Production deployment recommendations...
echo.
echo 📋 Pre-deployment Checklist:
echo ==============================
echo ✅ Application built successfully
echo ✅ Environment variables configured
echo ✅ Deployment package created
echo.
echo 🔧 Next Steps:
echo 1. Deploy to your hosting platform (Vercel/Netlify/etc.)
echo 2. Configure domain and SSL certificate
echo 3. Set up monitoring and alerts
echo 4. Configure backup strategy
echo 5. Test payment flows in production environment
echo.
echo 🔗 Important URLs after deployment:
echo - Payment Test: https://yourdomain.com/test-payment.html
echo - Admin Panel: https://yourdomain.com/admin
echo - API Health: https://yourdomain.com/api/services/payment/create-order?checkConfig=true
echo.
echo [INFO] 🎉 Production deployment preparation completed successfully!
echo [INFO] Your DriveRight payment system is ready for production deployment.
echo.
echo ⚠️  Remember to:
echo 1. Test thoroughly in production environment
echo 2. Monitor payment transactions closely
echo 3. Set up alerts for payment failures
echo 4. Keep backups of your Firebase data
echo.

pause
exit /b 0
