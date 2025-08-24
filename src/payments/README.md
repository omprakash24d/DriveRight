# Payment Module

This module contains all payment-related functionality for the DriveRight application.

## Structure

```
src/payments/
├── index.ts                    # Main module exports
├── types/
│   └── payment.ts             # Payment type definitions
├── config/
│   ├── paymentConfig.ts       # General payment configuration
│   └── phonepeSDKConfig.ts    # PhonePe SDK configuration
├── services/
│   ├── phonepeService.ts      # PhonePe service implementation
│   ├── phonepeSDKService.ts   # PhonePe SDK service (official)
│   └── unifiedPaymentService.ts # Unified payment service
├── api/
│   ├── phonepe/               # PhonePe API routes
│   ├── phonepe-extended/      # Extended PhonePe API routes
│   └── services/              # Service payment API routes
├── components/
│   ├── paymentService.ts      # Payment component service
│   └── callback/              # Payment callback components
└── public/
    ├── test-payment.html      # Payment testing page
    └── production-payment-test.html # Production payment testing
```

## Features

### PhonePe Integration
- **Official SDK Integration**: Uses the official `pg-sdk-node` package
- **Standard Checkout**: Complete payment flow implementation
- **Webhook Support**: Secure webhook handling and validation
- **Order Management**: Create, track, and manage payment orders
- **Refund Support**: Full refund functionality
- **Status Tracking**: Real-time payment status checking

### Unified Payment Service
- **Multi-Gateway Support**: Abstracts different payment gateways
- **Consistent Interface**: Unified API across all payment providers
- **Error Handling**: Comprehensive error handling and recovery
- **Type Safety**: Full TypeScript support with proper typing

## Usage

### Basic Payment Flow

```typescript
import { PhonePeSDKService } from '@/payments';

// Initialize PhonePe service
const phonepeService = PhonePeSDKService.getInstance(config);
await phonepeService.initialize();

// Create payment order
const paymentResponse = await phonepeService.initiatePayment({
  amount: 10000, // in paise
  orderId: 'order_123',
  userDetails: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210'
  },
  redirectUrl: 'https://yoursite.com/callback'
});
```

### Using Unified Payment Service

```typescript
import { UnifiedPaymentService } from '@/payments';

const paymentService = UnifiedPaymentService.getInstance();

// Initiate payment (automatically selects available gateway)
const response = await paymentService.initiatePayment({
  amount: 10000,
  orderId: 'order_123',
  userDetails: { /* ... */ },
  redirectUrl: 'https://yoursite.com/callback'
});
```

## Configuration

### Environment Variables

```env
# PhonePe Configuration
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_CLIENT_ID=your_client_id
PHONEPE_CLIENT_SECRET=your_client_secret
PHONEPE_SALT_KEY=your_salt_key
PHONEPE_ENVIRONMENT=sandbox # or production
PHONEPE_WEBHOOK_USERNAME=your_webhook_username
PHONEPE_WEBHOOK_PASSWORD=your_webhook_password
```

## API Routes

### PhonePe Routes
- `POST /api/payment/phonepe/create-order` - Create payment order
- `POST /api/payment/phonepe/callback` - Handle payment callback
- `POST /api/payment/phonepe/verify` - Verify payment status
- `POST /api/payment/phonepe/mock-confirm` - Mock payment confirmation (testing)

### Extended PhonePe Routes
- `POST /api/payments/phonepe/initiate` - Initiate payment
- `POST /api/payments/phonepe/status` - Check payment status
- `POST /api/payments/phonepe/refund` - Process refunds
- `POST /api/payments/phonepe/webhook` - Webhook endpoint

## Testing

### Test Pages
- `/src/payments/public/test-payment.html` - Development testing
- `/src/payments/public/production-payment-test.html` - Production testing

### Mock Endpoints
- Mock confirmation API for testing payment flows
- Callback simulation for development

## Security

- **Webhook Validation**: All webhooks are validated using PhonePe's signature verification
- **Environment Isolation**: Separate configurations for sandbox and production
- **Data Encryption**: Sensitive data is properly encrypted
- **Production Ready**: Console logs removed for production deployment

## Migration Notes

All payment-related files have been moved from their original locations:
- `src/types/payment.ts` → `src/payments/types/payment.ts`
- `src/config/paymentConfig.ts` → `src/payments/config/paymentConfig.ts`
- `src/services/phonepe*.ts` → `src/payments/services/`
- API routes consolidated under `src/payments/api/`

Update your imports accordingly:
```typescript
// Old
import { PaymentConfig } from '@/config/paymentConfig';

// New
import { PaymentConfig } from '@/payments/config/paymentConfig';
// Or use the module export
import { paymentConfig } from '@/payments';
```
