# 🚀 Production Payment System Setup Guide

## Overview
This guide will help you configure a production-ready payment system for DriveRight with both Razorpay and PhonePe gateways.

## ⚙️ Environment Configuration

### 1. Create Production Environment File

Create a `.env.production` file with the following configuration:

```bash
# ===========================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ===========================================

# Application Environment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Business Information
NEXT_PUBLIC_SCHOOL_NAME="DriveRight Driving School"
NEXT_PUBLIC_CONTACT_EMAIL=contact@driveright.com
NEXT_PUBLIC_PHONE=+919876543210
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
NEXT_PUBLIC_ADDRESS="Your Complete Address"
NEXT_PUBLIC_ADMIN_EMAILS=admin@driveright.com

# ===========================================
# PAYMENT GATEWAY CONFIGURATION
# ===========================================

# Razorpay Production Credentials
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXXXX

# PhonePe Production Credentials
PHONEPE_MERCHANT_ID=MERCHANTUAT
PHONEPE_SALT_KEY=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
PHONEPE_API_URL=https://api.phonepe.com/apis/hermes
NEXT_PUBLIC_PHONEPE_MERCHANT_ID=MERCHANTUAT

# ===========================================
# FIREBASE PRODUCTION CONFIGURATION
# ===========================================

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-production-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-production-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Firebase Admin Service Account (Single Line JSON)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com","client_id":"client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"cert-url","universe_domain":"googleapis.com"}

# ===========================================
# EMAIL CONFIGURATION
# ===========================================

# Production Email Configuration (Gmail/Corporate Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=noreply@driveright.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=noreply@driveright.com
TO_EMAIL=admin@driveright.com

# ===========================================
# SECURITY CONFIGURATION
# ===========================================

# Security Keys (Generate new ones for production)
ENCRYPTION_KEY=your-32-character-encryption-key-here
JWT_SECRET=your-64-character-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Rate Limiting (Redis for production)
RATE_LIMIT_REDIS_URL=redis://your-redis-server:6379

# ===========================================
# MONITORING & ANALYTICS
# ===========================================

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
SENTRY_ORG=your-org
SENTRY_PROJECT=driveright
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# ===========================================
# COMPLIANCE & BACKUP
# ===========================================

# GDPR & Privacy
GDPR_NOTIFICATION_EMAIL=privacy@driveright.com
DPO_EMAIL=dpo@driveright.com
SECURITY_TEAM_EMAIL=security@driveright.com

# Backup Configuration
BACKUP_STORAGE_BUCKET=driveright-backups
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key
```

## 🏦 Payment Gateway Setup

### 1. Razorpay Production Setup

1. **Create Razorpay Account**
   - Visit [https://razorpay.com](https://razorpay.com)
   - Sign up for a business account
   - Complete KYC verification

2. **Get Production Credentials**
   ```bash
   # Go to Razorpay Dashboard > Settings > API Keys
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Configure Webhooks**
   - Add webhook URL: `https://yourdomain.com/api/payment/razorpay/webhook`
   - Select events: `payment.captured`, `payment.failed`, `order.paid`

### 2. PhonePe Production Setup

1. **PhonePe Merchant Onboarding**
   - Visit [PhonePe Merchant Portal](https://business.phonepe.com/)
   - Complete merchant registration
   - Get production credentials

2. **Production Configuration**
   ```bash
   PHONEPE_MERCHANT_ID=YOUR_PRODUCTION_MERCHANT_ID
   PHONEPE_SALT_KEY=your-production-salt-key
   PHONEPE_API_URL=https://api.phonepe.com/apis/hermes
   ```

## 🔧 Production Payment System Features

### Intelligent Gateway Selection
- **Auto-detection**: System automatically selects the best available gateway
- **Fallback mechanism**: If primary gateway fails, automatically tries secondary
- **Production-first**: Prioritizes production gateways over sandbox
- **Load balancing**: Distributes load between available gateways

### Enhanced Security
- **Rate limiting**: Prevents payment abuse and DDoS attacks
- **Input validation**: Comprehensive validation of all payment data
- **HTTPS enforcement**: Ensures all payments are processed over secure connections
- **PCI compliance**: Follows PCI DSS guidelines for payment processing

### Monitoring & Analytics
- **Real-time status**: Live monitoring of payment gateway availability
- **Transaction logging**: Comprehensive audit trail of all payments
- **Error tracking**: Automatic error reporting and alerting
- **Performance metrics**: Payment success rates and response times

## 🚀 Deployment Process

### Option 1: Windows Deployment
```bash
# Run the Windows deployment script
.\deploy-production.bat
```

### Option 2: Linux/Mac Deployment
```bash
# Run the Unix deployment script
chmod +x deploy-production.sh
./deploy-production.sh
```

### Option 3: Manual Deployment

1. **Environment Setup**
   ```bash
   # Copy environment file
   cp .env.production .env
   
   # Install dependencies
   npm ci --only=production
   
   # Build application
   npm run build
   ```

2. **Configuration Validation**
   ```bash
   # Test configuration
   npm start &
   curl -s "http://localhost:3000/api/services/payment/create-order?checkConfig=true"
   ```

3. **Deploy to Platform**
   - **Vercel**: `vercel --prod`
   - **Netlify**: `netlify deploy --prod`
   - **AWS**: Use AWS CLI or console
   - **Google Cloud**: Use gcloud CLI

## 🧪 Production Testing

### 1. Payment System Test Interface
Access the production test interface at:
```
https://yourdomain.com/production-payment-test.html
```

### 2. API Endpoint Testing
```bash
# Check system status
curl "https://yourdomain.com/api/services/payment/create-order?checkConfig=true"

# Test payment creation
curl -X POST "https://yourdomain.com/api/services/payment/create-order" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "test-service",
    "serviceType": "training",
    "customerInfo": {
      "name": "Test Customer",
      "email": "test@example.com",
      "phone": "9876543210"
    },
    "paymentGateway": "auto"
  }'
```

### 3. Gateway-Specific Testing

**Razorpay Test Cards:**
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

**PhonePe Test:**
- Use test UPI IDs in sandbox
- Production testing requires real accounts

## 📊 Monitoring & Maintenance

### 1. Health Checks
```bash
# System health
https://yourdomain.com/api/health

# Payment system status
https://yourdomain.com/api/services/payment/create-order?checkConfig=true
```

### 2. Log Monitoring
Monitor these log patterns:
- `Payment gateway selection:`
- `Payment order creation:`
- `Gateway fallback activated:`
- `Configuration validation:`

### 3. Alert Setup
Set up alerts for:
- Payment gateway failures
- High error rates
- Configuration issues
- Security violations

## 🔒 Security Checklist

- [ ] HTTPS enforced across all endpoints
- [ ] Environment variables secured
- [ ] Webhook signatures validated
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Audit logging enabled
- [ ] Access controls implemented

## 🚨 Troubleshooting

### Common Issues

1. **"No payment gateways available"**
   - Check environment variables
   - Verify API credentials
   - Test network connectivity

2. **"Payment configuration invalid"**
   - Run configuration validation
   - Check credential format
   - Verify webhook URLs

3. **"Gateway API error"**
   - Check gateway service status
   - Verify API endpoints
   - Review rate limits

### Debug Commands
```bash
# Check environment
node -e "console.log(process.env.NODE_ENV)"

# Validate configuration
curl "https://yourdomain.com/api/services/payment/create-order?checkConfig=true" | jq

# Test gateway connectivity
curl -I "https://api.razorpay.com"
curl -I "https://api.phonepe.com"
```

## 📞 Support

### Technical Support
- **Email**: tech-support@driveright.com
- **Documentation**: [Internal Wiki]
- **Monitoring**: [Dashboard URL]

### Gateway Support
- **Razorpay**: support@razorpay.com
- **PhonePe**: merchantsupport@phonepe.com

### Emergency Contacts
- **System Admin**: admin@driveright.com
- **Security Team**: security@driveright.com

---

## 🎯 Production Checklist

Before going live, ensure:

- [ ] All environment variables configured
- [ ] SSL certificate installed
- [ ] Domain configured properly
- [ ] Payment gateways tested
- [ ] Email notifications working
- [ ] Monitoring systems active
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Performance optimized
- [ ] Security hardened

**🚀 Your DriveRight payment system is now production-ready!**
