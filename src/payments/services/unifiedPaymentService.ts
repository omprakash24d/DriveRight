import { paymentConfig } from '../config/paymentConfig';
import { PhonePePaymentRequest, PhonePeService } from './phonepeService';

export interface PaymentInitiationRequest {
  amount: number;
  currency?: string;
  orderId: string;
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
  redirectUrl: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitiationResponse {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  qrCode?: string;
  error?: string;
  gatewayUsed: 'phonepe';
  rawResponse?: any;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  amount?: number;
  error?: string;
  gatewayUsed: 'phonepe';
  rawResponse?: any;
}

export class UnifiedPaymentService {
  private static instance: UnifiedPaymentService;
  private phonepeService: PhonePeService | null = null;

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): UnifiedPaymentService {
    if (!UnifiedPaymentService.instance) {
      UnifiedPaymentService.instance = new UnifiedPaymentService();
    }
    return UnifiedPaymentService.instance;
  }

  private initializeServices(): void {
    // Initialize PhonePe if available
    if (paymentConfig.isGatewayAvailable('phonepe')) {
      try {
        const phonepeConfig = paymentConfig.getPhonePeConfig();
        if (phonepeConfig) {
          this.phonepeService = new PhonePeService({
            merchantId: phonepeConfig.merchantId,
            clientId: phonepeConfig.clientId,
            clientSecret: phonepeConfig.clientSecret,
            saltKey: phonepeConfig.saltKey,
            saltIndex: phonepeConfig.saltIndex,
            environment: phonepeConfig.environment
          });
        }
      } catch (error) {
        // PhonePe service initialization failed
      }
    }

    this.logServiceStatus();
  }

  private logServiceStatus(): void {
    // Service status logging removed for production
  }

  isServiceAvailable(): boolean {
    return !!this.phonepeService;
  }

  async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    if (!this.phonepeService) {
      throw new Error('PhonePe service not available');
    }

    try {
      const phonepeRequest: PhonePePaymentRequest = {
        merchantTransactionId: request.orderId,
        merchantUserId: request.userDetails.phone,
        amount: request.amount,
        redirectUrl: request.redirectUrl,
        redirectMode: 'POST',
        callbackUrl: request.callbackUrl || request.redirectUrl,
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const response = await this.phonepeService.initiatePayment(phonepeRequest);
      
      return {
        success: response.success,
        paymentId: response.data?.merchantTransactionId || request.orderId,
        redirectUrl: response.data?.instrumentResponse?.redirectInfo?.url || '',
        gatewayUsed: 'phonepe'
      };
    } catch (error) {
      throw error;
    }
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    if (!this.phonepeService) {
      return {
        success: false,
        status: 'failed',
        error: 'PhonePe service not available',
        gatewayUsed: 'phonepe'
      };
    }

    try {
      const response = await this.phonepeService.checkPaymentStatus(transactionId);
      
      return {
        success: response.success,
        status: this.mapPhonePeStatus(response.data?.state),
        transactionId: response.data?.transactionId,
        amount: response.data?.amount ? response.data.amount / 100 : undefined, // Convert from paise
        error: response.success ? undefined : response.message,
        gatewayUsed: 'phonepe',
        rawResponse: response
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed',
        gatewayUsed: 'phonepe'
      };
    }
  }

  private mapPhonePeStatus(state?: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    switch (state?.toUpperCase()) {
      case 'COMPLETED':
        return 'completed';
      case 'PENDING':
        return 'pending';
      case 'FAILED':
        return 'failed';
      default:
        return 'pending';
    }
  }

  async processWebhook(
    payload: any,
    signature: string
  ): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      // PhonePe webhook processing would go here
      // Currently not implemented in the service
      return {
        success: false,
        error: 'PhonePe webhook processing not implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      };
    }
  }

  getServiceHealth(): {
    overall: 'healthy' | 'degraded' | 'down';
    services: Record<string, { available: boolean; configured: boolean; error?: string }>;
  } {
    const services: Record<string, { available: boolean; configured: boolean; error?: string }> = {};

    // Check PhonePe
    services.phonepe = {
      available: !!this.phonepeService,
      configured: paymentConfig.isGatewayAvailable('phonepe')
    };

    const availableCount = Object.values(services).filter(s => s.available).length;
    const configuredCount = Object.values(services).filter(s => s.configured).length;

    let overall: 'healthy' | 'degraded' | 'down' = 'down';
    if (availableCount >= 1) {
      overall = configuredCount >= 1 ? 'healthy' : 'degraded';
    }

    return { overall, services };
  }
}

// Export singleton instance
export const unifiedPaymentService = UnifiedPaymentService.getInstance();
