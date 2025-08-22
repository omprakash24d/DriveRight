#!/bin/bash

# DriveRight Enhanced Payment System Setup Script
echo "🚀 Setting up DriveRight Enhanced Payment System..."

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << 'EOF'
# Razorpay Configuration (Required for Payments)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id_here

# Email Configuration (Required for Notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
CONTACT_EMAIL=info@driveright.com
CONTACT_PHONE=+91-XXXXXXXXXX

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000

EOF
    echo "✅ .env.local created! Please update with your actual credentials."
else
    echo "⚠️  .env.local already exists. Please manually add the new environment variables."
fi

# Install dependencies
echo "📦 Installing required dependencies..."
npm install nodemailer razorpay
npm install --save-dev @types/nodemailer

echo ""
echo "🎉 Enhanced Payment System Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env.local with your Razorpay and email credentials"
echo "2. Set up Razorpay account at https://razorpay.com"
echo "3. Configure Gmail App Password for email notifications"
echo "4. Test the payment flow in development"
echo "5. Deploy to production with proper environment variables"
echo ""
echo "📖 For detailed setup instructions, see: ENHANCED_PAYMENT_SYSTEM.md"
echo ""
echo "🚀 Your DriveRight website now has industry-standard payment integration!"
