export type PaymentGateway = 'phonepe' | 'razorpay';

export interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  priority: number;
  enabled: boolean;
  name: string;
  logo: string;
  description: string;
}

export interface PhonePeConfig {
  merchantId: string;
  clientId: string;
  clientSecret: string;
  saltKey?: string; // Legacy field, not used in Standard Checkout API v2
  saltIndex?: string; // Legacy field, not used in Standard Checkout API v2
  environment: 'sandbox' | 'production';
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  environment: 'sandbox' | 'production';
}

export interface UnifiedPaymentOptions {
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  callbackUrl: string;
  metadata?: any;
}

export interface UnifiedPaymentResponse {
  success: boolean;
  gateway: PaymentGateway;
  paymentUrl?: string;
  orderId: string;
  transactionId: string;
  error?: string;
}

export const PAYMENT_GATEWAYS: PaymentGatewayConfig[] = [
  {
    gateway: 'phonepe',
    priority: 1,
    enabled: true,
    name: 'PhonePe',
    logo: '/images/phonepe-logo.png',
    description: 'Pay using PhonePe - UPI, Cards, Wallets'
  },
  {
    gateway: 'razorpay',
    priority: 2,
    enabled: true,
    name: 'Razorpay',
    logo: '/images/razorpay-logo.png',
    description: 'Pay using Razorpay - Cards, Net Banking, UPI'
  }
];
