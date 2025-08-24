# PhonePe Node.js SDK Integration Guide

## 🎯 **INTEGRATION COMPLETE**

Your DriveRight application now supports the **official PhonePe Node.js SDK** according to the latest PhonePe documentation. This implementation provides a robust, production-ready payment gateway that follows PhonePe's official guidelines.

---

## 🚀 **NEW FEATURES IMPLEMENTED**

### **1. Official PhonePe SDK Integration**
- ✅ **PhonePe Node.js SDK** - Using official `pg-sdk-node` package
- ✅ **Standard Checkout** - Complete web payment flow
- ✅ **SDK Order Creation** - For mobile app integration
- ✅ **Order Status Tracking** - Real-time payment status
- ✅ **Refund Management** - Initiate and track refunds
- ✅ **Webhook Validation** - Secure callback verification

### **2. Comprehensive API Routes**
- ✅ **Payment Initiation** - `/api/payments/phonepe/initiate`
- ✅ **Order Status** - `/api/payments/phonepe/status`
- ✅ **Refund Management** - `/api/payments/phonepe/refund`
- ✅ **Webhook Handler** - `/api/payments/phonepe/webhook`
- ✅ **SDK Order Creation** - `/api/payments/phonepe/create-sdk-order`

### **3. Enhanced Security**
- ✅ **SDK-based Validation** - Official PhonePe SDK handles all security
- ✅ **Webhook Verification** - Automatic callback validation
- ✅ **Environment-based Config** - Separate sandbox and production
- ✅ **Error Handling** - Comprehensive error management

---

## 🔧 **SETUP INSTRUCTIONS**

### **1. Install Dependencies**

The PhonePe SDK has already been installed. Verify installation:

```bash
npm list pg-sdk-node
```

### **2. Environment Configuration**

Copy the environment template and configure your credentials:

```bash
cp .env.phonepe.template .env.local
```

Edit `.env.local` and add your PhonePe credentials:

```env
# PhonePe SDK Configuration
PHONEPE_CLIENT_ID=your_client_id
PHONEPE_CLIENT_SECRET=your_client_secret
PHONEPE_CLIENT_VERSION=1
PHONEPE_ENVIRONMENT=sandbox

# Webhook Configuration (Recommended)
PHONEPE_WEBHOOK_USERNAME=your_webhook_username
PHONEPE_WEBHOOK_PASSWORD=your_webhook_password

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:9002
NEXT_PUBLIC_PRODUCTION_URL=https://yourdomain.com
```

### **3. Get PhonePe Credentials**

#### **For UAT/Sandbox:**
1. Contact PhonePe Integration Team
2. Request sandbox credentials
3. Get Client ID, Client Secret, and Client Version

#### **For Production:**
1. Visit [PhonePe Business Dashboard](https://business.phonepe.com/)
2. Complete merchant onboarding
3. Get production credentials

---

## 📖 **API ENDPOINTS**

### **1. Payment Initiation**
```http
POST /api/payments/phonepe/initiate
```

**Request Body:**
```json
{
  "serviceId": "service_123",
  "amount": 1000,
  "currency": "INR",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  },
  "serviceTitle": "Driving Lesson",
  "metadata": {
    "bookingId": "booking_123",
    "serviceType": "lesson"
  }
}
```

**Response:**
```json
{
  "success": true,
  "gateway": "phonepe",
  "merchantOrderId": "uuid-generated",
  "orderId": "phonepe-order-id",
  "checkoutUrl": "https://phonepe-checkout-url",
  "state": "PENDING",
  "amount": 1000,
  "expireAt": 1640995200000
}
```

### **2. Order Status Check**
```http
POST /api/payments/phonepe/status
GET /api/payments/phonepe/status?merchantOrderId=uuid
```

**Response:**
```json
{
  "success": true,
  "merchantOrderId": "uuid",
  "orderId": "phonepe-order-id",
  "state": "COMPLETED",
  "amount": 100000,
  "amountInRupees": 1000,
  "paymentDetails": [...]
}
```

### **3. Refund Initiation**
```http
POST /api/payments/phonepe/refund
```

**Request Body:**
```json
{
  "originalMerchantOrderId": "original-order-id",
  "amount": 500,
  "reason": "Customer cancellation"
}
```

### **4. Webhook Handler**
```http
POST /api/payments/phonepe/webhook
```

Automatically processes PhonePe callbacks with validation.

---

## 🔄 **PAYMENT FLOW**

### **Web Payment Flow:**
1. Customer selects service and provides details
2. Call `/api/payments/phonepe/initiate` to create payment
3. Redirect customer to `checkoutUrl`
4. Customer completes payment on PhonePe
5. PhonePe redirects to callback page
6. Callback page verifies payment status
7. Update booking status based on result

### **Mobile App Integration:**
1. Create SDK order using `/api/payments/phonepe/create-sdk-order`
2. Use returned token with PhonePe Mobile SDK
3. Handle payment result in mobile app
4. Verify status using `/api/payments/phonepe/status`

---

## 🎯 **CALLBACK PAGE**

The callback page at `/payment/phonepe/callback` now supports both:
- **SDK Callbacks** - New implementation with order status verification
- **Legacy Callbacks** - Backward compatibility

**URL Parameters:**
- `status` - success/failure/cancel
- `merchantOrderId` - Order ID for verification

---

## 🔐 **WEBHOOK CONFIGURATION**

### **Development:**
```
Webhook URL: http://localhost:9002/api/payments/phonepe/webhook
```

### **Production:**
```
Webhook URL: https://yourdomain.com/api/payments/phonepe/webhook
```

**Configure in PhonePe Dashboard:**
1. Go to Settings → Webhooks
2. Add webhook URL
3. Set username and password
4. Add to environment variables

---

## 🧪 **TESTING**

### **1. Configuration Test**
```bash
curl http://localhost:9002/api/payments/phonepe/initiate
```

### **2. Payment Test**
```bash
curl -X POST http://localhost:9002/api/payments/phonepe/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "test_service",
    "amount": 100,
    "customerInfo": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "9876543210"
    },
    "serviceTitle": "Test Service"
  }'
```

### **3. UAT Sandbox Testing**

Use PhonePe UAT Sandbox for testing:
- **Environment:** `sandbox`
- **Host URL:** `https://api-preprod.phonepe.com/apis/pgsandbox`
- **Test Cards:** Use PhonePe provided test cards
- **Test UPI:** Use `success@ybl`, `failed@ybl`, `pending@ybl`

---

## 📊 **PAYMENT STATES**

| State | Description | Action Required |
|-------|-------------|-----------------|
| `PENDING` | Payment in progress | Monitor and wait |
| `COMPLETED` | Payment successful | Fulfill order |
| `FAILED` | Payment failed | Handle failure |

---

## 🔄 **RECONCILIATION SCHEDULE**

When payment state is `PENDING`, check status:
1. First check: 20-25 seconds after initiation
2. Every 3 seconds for next 30 seconds
3. Every 6 seconds for next 60 seconds
4. Every 10 seconds for next 60 seconds
5. Every 30 seconds for next 60 seconds
6. Every 1 minute until terminal state

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **1. Update Environment:**
```env
PHONEPE_ENVIRONMENT=production
PHONEPE_CLIENT_ID=rzp_live_xxx
PHONEPE_CLIENT_SECRET=live_secret
NEXT_PUBLIC_PRODUCTION_URL=https://yourdomain.com
```

### **2. Update Webhook URLs:**
- Configure production webhook in PhonePe Dashboard
- Test webhook endpoint: `GET /api/payments/phonepe/webhook`

### **3. SSL Certificate:**
Ensure your production domain has valid SSL certificate.

---

## 🎯 **INTEGRATION CHECKLIST**

### **Mandatory Requirements:**
- [x] Authorization API token management
- [x] Payment API with unique merchantOrderId
- [x] Order Status API with reconciliation
- [x] Webhook handling with validation
- [x] Refund API (if applicable)
- [x] Exception handling
- [x] UAT testing

### **Best Practices:**
- [x] Avoid strict deserialization
- [x] Use root-level state for decisions
- [x] Implement proper reconciliation
- [x] Validate webhook authenticity
- [x] Handle PENDING states appropriately

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues:**

**1. SDK Not Configured:**
- Check environment variables
- Verify credentials format
- Ensure PHONEPE_CLIENT_VERSION is numeric

**2. Webhook Validation Failed:**
- Verify webhook credentials
- Check Authorization header format
- Ensure webhook URL is accessible

**3. Payment Verification Failed:**
- Check merchantOrderId format
- Verify order exists in PhonePe
- Check API response format

### **Debug Information:**
- Check configuration: `GET /api/payments/phonepe/initiate`
- View logs in browser console
- Monitor webhook endpoint: `GET /api/payments/phonepe/webhook`

---

## 🌟 **SUMMARY**

**PhonePe Node.js SDK integration is now complete!** 

Your application now features:
- ✅ Official PhonePe SDK implementation
- ✅ Comprehensive payment flow handling
- ✅ Production-ready security measures
- ✅ UAT and production environment support
- ✅ Mobile app integration capabilities
- ✅ Automated reconciliation and webhooks

**Test the integration at: http://localhost:9002**

---

*This implementation follows PhonePe's official Node.js SDK documentation and provides enterprise-grade payment processing capabilities.*
