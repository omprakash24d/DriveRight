/**
 * Production Payment Service
 * Handles intelligent payment gateway selection and processing
 */

import { paymentConfig } from '@/config/paymentConfig';
import { PhonePeService } from '@/services/phonepeService';
import Razorpay from 'razorpay';

export interface PaymentRequest {
  amount: number; // in rupees
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  description: string;
  metadata?: Record<string, any>;
  preferredGateway?: 'razorpay' | 'phonepe' | 'auto';
}

export interface PaymentResponse {
  success: boolean;
  gateway: 'razorpay' | 'phonepe';
  data?: any;
  error?: string;
  fallback?: boolean;
}

export class ProductionPaymentService {
  private static razorpayInstance: Razorpay | null = null;

  /**
   * Initialize Razorpay instance with production config
   */
  private static initializeRazorpay(): Razorpay | null {
    if (this.razorpayInstance) {
      return this.razorpayInstance;
    }

    const config = paymentConfig.getRazorpayConfig();
    if (!config) {
      console.warn('⚠️ Razorpay not configured');
      return null;
    }

    try {
      this.razorpayInstance = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });

      console.log('✅ Razorpay initialized:', {
        isProduction: config.isProduction,
        keyId: `${config.keyId.substring(0, 12)}...`
      });

      return this.razorpayInstance;
    } catch (error) {
      console.error('❌ Failed to initialize Razorpay:', error);
      return null;
    }
  }

  /**
   * Determine the best payment gateway to use
   */
  static selectPaymentGateway(preferredGateway?: string): 'razorpay' | 'phonepe' | null {
    const recommendation = paymentConfig.getGatewayRecommendation();
    
    console.log('🎯 Payment gateway selection:', {
      preferred: preferredGateway,
      recommended: recommendation.recommended,
      reason: recommendation.reason
    });

    // If user has a preference and it's available, use it
    if (preferredGateway && preferredGateway !== 'auto') {
      if (paymentConfig.isGatewayAvailable(preferredGateway as 'razorpay' | 'phonepe')) {
        console.log(`✅ Using preferred gateway: ${preferredGateway}`);
        return preferredGateway as 'razorpay' | 'phonepe';
      } else {
        console.warn(`⚠️ Preferred gateway ${preferredGateway} not available, using recommendation`);
      }
    }

    // Use recommendation
    return recommendation.recommended;
  }

  /**
   * Create Razorpay payment order
   */
  static async createRazorpayOrder(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('💳 Creating Razorpay order...');
    
    const razorpay = this.initializeRazorpay();
    if (!razorpay) {
      return {
        success: false,
        gateway: 'razorpay',
        error: 'Razorpay not configured'
      };
    }

    try {
      const amountInPaise = Math.round(request.amount * 100);
      const razorpayConfig = paymentConfig.getRazorpayConfig()!;
      
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: request.orderId,
        notes: {
          customerName: request.customerInfo.name,
          customerEmail: request.customerInfo.email,
          description: request.description,
          ...request.metadata
        }
      });

      console.log('✅ Razorpay order created:', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });

      return {
        success: true,
        gateway: 'razorpay',
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          config: {
            key: razorpayConfig.keyId,
            name: process.env.NEXT_PUBLIC_SCHOOL_NAME || "DriveRight Driving School",
            description: request.description,
            image: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.jpg`,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            prefill: {
              name: request.customerInfo.name,
              email: request.customerInfo.email,
              contact: request.customerInfo.phone
            },
            theme: {
              color: "#3B82F6"
            },
            modal: {
              backdropClose: false,
              escape: false,
              handleback: false
            }
          }
        }
      };
    } catch (error) {
      console.error('❌ Razorpay order creation failed:', error);
      return {
        success: false,
        gateway: 'razorpay',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create PhonePe payment order
   */
  static async createPhonePeOrder(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('📱 Creating PhonePe order...');
    
    const phonepeConfig = paymentConfig.getPhonePeConfig();
    if (!phonepeConfig) {
      return {
        success: false,
        gateway: 'phonepe',
        error: 'PhonePe not configured'
      };
    }

    try {
      const merchantTransactionId = PhonePeService.generateTransactionId('ORDER');
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
      
      const paymentRequest = {
        amount: Math.round(request.amount * 100), // Convert to paise
        merchantTransactionId,
        merchantUserId: request.customerInfo.email.replace(/[^a-zA-Z0-9]/g, '_'),
        redirectUrl: `${baseUrl}/payment/phonepe/callback`,
        redirectMode: 'POST' as const,
        callbackUrl: `${baseUrl}/api/payment/phonepe/callback`,
        paymentInstrument: {
          type: 'PAY_PAGE' as const
        }
      };

      console.log('📤 PhonePe payment request:', {
        ...paymentRequest,
        amount: request.amount
      });

      const response = await PhonePeService.initiatePayment(paymentRequest);
      
      if (!response.success) {
        throw new Error(`PhonePe API error: ${response.message}`);
      }

      console.log('✅ PhonePe order created:', {
        merchantTransactionId,
        redirectUrl: response.data?.instrumentResponse?.redirectInfo?.url ? 'Available' : 'Missing'
      });

      return {
        success: true,
        gateway: 'phonepe',
        data: {
          merchantTransactionId,
          paymentUrl: response.data?.instrumentResponse?.redirectInfo?.url,
          method: response.data?.instrumentResponse?.redirectInfo?.method,
          config: {
            type: 'redirect',
            url: response.data?.instrumentResponse?.redirectInfo?.url,
            merchantTransactionId,
            amount: request.amount,
            description: request.description
          }
        }
      };
    } catch (error) {
      console.error('❌ PhonePe order creation failed:', error);
      
      // Check if this is a configuration error (no fallback needed)
      if (error instanceof Error && error.message.includes('configuration')) {
        return {
          success: false,
          gateway: 'phonepe',
          error: error.message
        };
      }

      // For API errors, we can create a fallback response
      console.log('🔄 PhonePe API failed, creating fallback response...');
      
      const merchantTransactionId = PhonePeService.generateTransactionId('FALLBACK');
      
      return {
        success: true,
        gateway: 'phonepe',
        fallback: true,
        data: {
          merchantTransactionId,
          fallbackMode: true,
          config: {
            type: 'fallback',
            merchantTransactionId,
            amount: request.amount,
            description: request.description,
            customerInfo: request.customerInfo,
            orderId: request.orderId
          }
        }
      };
    }
  }

  /**
   * Create payment order with intelligent gateway selection
   */
  static async createPaymentOrder(request: PaymentRequest): Promise<PaymentResponse> {
    console.log('🚀 Creating payment order:', {
      amount: request.amount,
      orderId: request.orderId,
      preferredGateway: request.preferredGateway
    });

    // Validate configuration
    const validation = paymentConfig.validateProductionConfig();
    if (!validation.isValid) {
      console.error('❌ Payment configuration validation failed:', validation.errors);
      return {
        success: false,
        gateway: 'razorpay', // Default for error response
        error: `Payment system not properly configured: ${validation.errors.join(', ')}`
      };
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Payment configuration warnings:', validation.warnings);
    }

    // Select gateway
    const selectedGateway = this.selectPaymentGateway(request.preferredGateway);
    if (!selectedGateway) {
      return {
        success: false,
        gateway: 'razorpay', // Default for error response
        error: 'No payment gateways available'
      };
    }

    console.log(`🎯 Selected gateway: ${selectedGateway}`);

    // Create order using selected gateway
    let result: PaymentResponse;
    
    if (selectedGateway === 'razorpay') {
      result = await this.createRazorpayOrder(request);
    } else {
      result = await this.createPhonePeOrder(request);
    }

    // If the selected gateway fails, try fallback
    if (!result.success && !result.fallback) {
      console.log('🔄 Primary gateway failed, attempting fallback...');
      
      const fallbackGateway = selectedGateway === 'razorpay' ? 'phonepe' : 'razorpay';
      
      if (paymentConfig.isGatewayAvailable(fallbackGateway)) {
        console.log(`🔄 Trying fallback gateway: ${fallbackGateway}`);
        
        if (fallbackGateway === 'razorpay') {
          result = await this.createRazorpayOrder(request);
        } else {
          result = await this.createPhonePeOrder(request);
        }
        
        if (result.success) {
          result.fallback = true;
          console.log(`✅ Fallback successful with ${fallbackGateway}`);
        }
      }
    }

    // Log final result
    console.log('📊 Payment order result:', {
      success: result.success,
      gateway: result.gateway,
      fallback: result.fallback || false,
      hasError: !!result.error
    });

    return result;
  }

  /**
   * Get payment gateway status
   */
  static getGatewayStatus(): {
    razorpay: { available: boolean; production: boolean };
    phonepe: { available: boolean; production: boolean };
    primary: string | null;
    production: boolean;
  } {
    const razorpayConfig = paymentConfig.getRazorpayConfig();
    const phonepeConfig = paymentConfig.getPhonePeConfig();
    const recommendation = paymentConfig.getGatewayRecommendation();

    return {
      razorpay: {
        available: !!razorpayConfig,
        production: razorpayConfig?.isProduction ?? false
      },
      phonepe: {
        available: !!phonepeConfig,
        production: phonepeConfig?.isProduction ?? false
      },
      primary: recommendation.recommended,
      production: paymentConfig.isProductionMode()
    };
  }
}

export { ProductionPaymentService as PaymentService };

