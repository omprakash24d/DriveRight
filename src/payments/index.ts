/**
 * Payment Module - Centralized Payment System
 * 
 * This module contains all payment-related functionality including:
 * - PhonePe integration (official SDK)
 * - Unified payment service
 * - Payment configuration
 * - Payment types and interfaces
 * - API routes for payment processing
 * - Payment components and pages
 */

// Export payment services
export { PhonePeSDKService } from './services/phonepeSDKService';
export { PhonePeService } from './services/phonepeService';
export { UnifiedPaymentService } from './services/unifiedPaymentService';

// Export payment configuration
export { paymentConfig } from './config/paymentConfig';
export { PhonePeSDKConfiguration } from './config/phonepeSDKConfig';

// Export payment types
export * from './types/payment';

// Export payment constants
export const PAYMENT_GATEWAYS = {
  PHONEPE: 'phonepe',
  RAZORPAY: 'razorpay'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
} as const;

// Payment module metadata
export const PAYMENT_MODULE_INFO = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  supportedGateways: ['phonepe', 'razorpay'],
  features: [
    'Standard Checkout',
    'Webhook Handling',
    'Payment Status Tracking',
    'Refund Management',
    'Order Management'
  ]
};
