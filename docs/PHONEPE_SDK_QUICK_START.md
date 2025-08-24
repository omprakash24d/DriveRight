# PhonePe Node.js SDK - Quick Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies (Already Done)
```bash
npm install pg-sdk-node
```

### 2. Environment Variables
Copy `.env.phonepe.template` to `.env.local` and configure:

```env
# PhonePe SDK Configuration (REQUIRED)
PHONEPE_CLIENT_ID=your_phonepe_client_id
PHONEPE_CLIENT_SECRET=your_phonepe_client_secret
PHONEPE_CLIENT_VERSION=1
PHONEPE_ENVIRONMENT=sandbox

# Webhook Configuration (RECOMMENDED)
PHONEPE_WEBHOOK_USERNAME=your_webhook_username
PHONEPE_WEBHOOK_PASSWORD=your_webhook_password

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:9002
NEXT_PUBLIC_PRODUCTION_URL=https://yourdomain.com
```

### 3. Test Configuration
```bash
curl http://localhost:9002/api/payments/phonepe/test
```

### 4. Test Payment
```bash
curl -X POST http://localhost:9002/api/payments/phonepe/test \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

## 📝 Getting PhonePe Credentials

### For Sandbox/UAT:
1. Contact PhonePe Integration Team
2. Request sandbox credentials
3. Provide your business details

### For Production:
1. Visit [PhonePe Business Dashboard](https://business.phonepe.com/)
2. Complete merchant onboarding
3. Get production credentials

## 🔧 API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/payments/phonepe/initiate` | Initiate payment |
| `/api/payments/phonepe/status` | Check order status |
| `/api/payments/phonepe/refund` | Process refunds |
| `/api/payments/phonepe/webhook` | Handle callbacks |
| `/api/payments/phonepe/create-sdk-order` | Mobile app integration |
| `/api/payments/phonepe/test` | Test configuration |

## 📱 Usage in Your Application

The PhonePe SDK is now integrated into your existing payment system. When users select PhonePe as their payment gateway:

1. **Automatic Detection**: The system detects if PhonePe SDK is configured
2. **Fallback Support**: Falls back to legacy PhonePe if SDK not configured
3. **Unified Experience**: Same UI for both Razorpay and PhonePe

## 🔍 Test Your Integration

1. Start your development server: `npm run dev`
2. Visit: `http://localhost:9002/api/payments/phonepe/test`
3. Check configuration status
4. Test payment initiation

## 📞 Support

- **Documentation**: `PHONEPE_SDK_INTEGRATION_COMPLETE.md`
- **Environment Template**: `.env.phonepe.template`
- **Test Endpoint**: `/api/payments/phonepe/test`

## ✅ Integration Checklist

- [x] PhonePe SDK installed (`pg-sdk-node`)
- [x] API routes created
- [x] Configuration management implemented
- [x] Callback page updated
- [x] Integration with existing payment system
- [ ] Environment variables configured
- [ ] PhonePe credentials obtained
- [ ] UAT testing completed
- [ ] Production deployment

Your PhonePe Node.js SDK integration is complete and ready for configuration!
