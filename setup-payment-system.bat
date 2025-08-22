@echo off
echo 🚀 Setting up DriveRight Enhanced Payment System...

REM Create environment file if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local file...
    (
    echo # Razorpay Configuration ^(Required for Payments^)
    echo RAZORPAY_KEY_ID=your_razorpay_key_id_here
    echo RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
    echo NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here
    echo.
    echo # Email Configuration ^(Required for Notifications^)
    echo SMTP_HOST=smtp.gmail.com
    echo SMTP_PORT=587
    echo SMTP_USER=your_email@gmail.com
    echo SMTP_PASS=your_app_password_here
    echo CONTACT_EMAIL=info@driveright.com
    echo CONTACT_PHONE=+91-XXXXXXXXXX
    echo.
    echo # Application URLs
    echo NEXT_PUBLIC_BASE_URL=http://localhost:3000
    ) > .env.local
    echo ✅ .env.local created! Please update with your actual credentials.
) else (
    echo ⚠️  .env.local already exists. Please manually add the new environment variables.
)

REM Install dependencies
echo 📦 Installing required dependencies...
call npm install nodemailer razorpay
call npm install --save-dev @types/nodemailer

echo.
echo 🎉 Enhanced Payment System Setup Complete!
echo.
echo 📋 Next Steps:
echo 1. Update .env.local with your Razorpay and email credentials
echo 2. Set up Razorpay account at https://razorpay.com
echo 3. Configure Gmail App Password for email notifications
echo 4. Test the payment flow in development
echo 5. Deploy to production with proper environment variables
echo.
echo 📖 For detailed setup instructions, see: ENHANCED_PAYMENT_SYSTEM.md
echo.
echo 🚀 Your DriveRight website now has industry-standard payment integration!
pause
