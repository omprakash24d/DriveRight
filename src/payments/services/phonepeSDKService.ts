/**
 * PhonePe Node.js SDK Service Implementation
 * Based on official PhonePe Node.js SDK documentation
 */

import { randomUUID } from 'crypto';
import {
  CreateSdkOrderRequest,
  Env,
  MetaInfo,
  PhonePeException,
  RefundRequest,
  StandardCheckoutClient,
  StandardCheckoutPayRequest
} from 'pg-sdk-node';

export interface PhonePeSDKConfig {
  clientId: string;
  clientSecret: string;
  clientVersion: number;
  environment: 'sandbox' | 'production';
  webhookUsername?: string;
  webhookPassword?: string;
}

export interface PaymentInitiationRequest {
  amount: number; // Amount in paisa (₹1 = 100 paisa)
  redirectUrl: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: {
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  };
  merchantOrderId?: string; // Optional, will generate UUID if not provided
}

export interface SDKOrderRequest {
  amount: number; // Amount in paisa
  redirectUrl: string;
  merchantOrderId?: string; // Optional, will generate UUID if not provided
}

export interface RefundInitiationRequest {
  originalMerchantOrderId: string;
  amount: number; // Amount in paisa
  merchantRefundId?: string; // Optional, will generate UUID if not provided
}

export class PhonePeSDKService {
  private static instance: PhonePeSDKService;
  private client: StandardCheckoutClient | null = null;
  private config: PhonePeSDKConfig;

  private constructor(config: PhonePeSDKConfig) {
    this.config = config;
    this.initializeClient();
  }

  /**
   * Get singleton instance of PhonePeSDKService
   */
  public static getInstance(config: PhonePeSDKConfig): PhonePeSDKService {
    if (!PhonePeSDKService.instance) {
      PhonePeSDKService.instance = new PhonePeSDKService(config);
    }
    return PhonePeSDKService.instance;
  }

  /**
   * Initialize the StandardCheckoutClient
   */
  private initializeClient(): void {
    try {
      if (!this.config.clientId || !this.config.clientSecret || !this.config.clientVersion) {
        throw new Error('PhonePe SDK configuration is incomplete');
      }

      const env = this.config.environment === 'production' ? Env.PRODUCTION : Env.SANDBOX;
      
      this.client = StandardCheckoutClient.getInstance(
        this.config.clientId,
        this.config.clientSecret,
        this.config.clientVersion,
        env
      );
    } catch (error) {
      throw new Error(`PhonePe SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initiate a payment transaction
   */
  public async initiatePayment(request: PaymentInitiationRequest) {
    if (!this.client) {
      throw new Error('PhonePe SDK client not initialized');
    }

    try {
      // Generate merchant order ID if not provided
      const merchantOrderId = request.merchantOrderId || randomUUID();

      // Validate amount (minimum 100 paisa = ₹1)
      if (request.amount < 100) {
        throw new Error('Minimum payment amount is ₹1 (100 paisa)');
      }

      // Replace placeholder in redirect URL with actual merchantOrderId
      const actualRedirectUrl = request.redirectUrl.replace('{{merchantOrderId}}', merchantOrderId);

      // Create MetaInfo if metadata is provided
      let metaInfo;
      if (request.metadata) {
        const metaBuilder = MetaInfo.builder();
        if (request.metadata.udf1) metaBuilder.udf1(request.metadata.udf1);
        if (request.metadata.udf2) metaBuilder.udf2(request.metadata.udf2);
        if (request.metadata.udf3) metaBuilder.udf3(request.metadata.udf3);
        if (request.metadata.udf4) metaBuilder.udf4(request.metadata.udf4);
        if (request.metadata.udf5) metaBuilder.udf5(request.metadata.udf5);
        metaInfo = metaBuilder.build();
      }

      // Build payment request
      const paymentRequestBuilder = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(request.amount)
        .redirectUrl(actualRedirectUrl);

      if (metaInfo) {
        paymentRequestBuilder.metaInfo(metaInfo);
      }

      const paymentRequest = paymentRequestBuilder.build();

      // Initiate payment
      const response = await this.client.pay(paymentRequest);

      return {
        success: true,
        merchantOrderId,
        orderId: response.orderId,
        checkoutUrl: response.redirectUrl,
        state: response.state,
        expireAt: response.expireAt,
        amount: request.amount
      };

    } catch (error) {
      if (error instanceof PhonePeException) {
        throw new Error(`PhonePe API Error: ${error.message} (Code: ${error.code})`);
      }
      
      throw new Error(`Payment initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create SDK order for mobile app integration
   */
  public async createSDKOrder(request: SDKOrderRequest) {
    if (!this.client) {
      throw new Error('PhonePe SDK client not initialized');
    }

    try {
      // Generate merchant order ID if not provided
      const merchantOrderId = request.merchantOrderId || randomUUID();

      // Validate amount (minimum 100 paisa = ₹1)
      if (request.amount < 100) {
        throw new Error('Minimum payment amount is ₹1 (100 paisa)');
      }

      // Replace placeholder in redirect URL with actual merchantOrderId
      const actualRedirectUrl = request.redirectUrl.replace('{{merchantOrderId}}', merchantOrderId);

      // Build SDK order request
      const sdkOrderRequest = CreateSdkOrderRequest.StandardCheckoutBuilder()
        .merchantOrderId(merchantOrderId)
        .amount(request.amount)
        .redirectUrl(actualRedirectUrl)
        .build();

      // Create SDK order
      const response = await this.client.createSdkOrder(sdkOrderRequest);

      return {
        success: true,
        merchantOrderId,
        orderId: response.orderId,
        token: response.token,
        state: response.state,
        expireAt: response.expireAt
      };

    } catch (error) {
      if (error instanceof PhonePeException) {
        throw new Error(`PhonePe API Error: ${error.message} (Code: ${error.code})`);
      }
      
      throw new Error(`SDK order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check order status
   */
  public async getOrderStatus(merchantOrderId: string, includeAllDetails: boolean = false) {
    if (!this.client) {
      throw new Error('PhonePe SDK client not initialized');
    }

    try {
      const response = await this.client.getOrderStatus(merchantOrderId);

      return {
        success: true,
        orderId: response.orderId,
        state: response.state,
        amount: response.amount,
        expireAt: response.expireAt,
        metaInfo: response.metaInfo,
        paymentDetails: includeAllDetails ? response.paymentDetails : response.paymentDetails?.slice(-1) // Latest attempt only
      };

    } catch (error) {
      if (error instanceof PhonePeException) {
        throw new Error(`PhonePe API Error: ${error.message} (Code: ${error.code})`);
      }
      
      throw new Error(`Order status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initiate refund
   */
  public async initiateRefund(request: RefundInitiationRequest) {
    if (!this.client) {
      throw new Error('PhonePe SDK client not initialized');
    }

    try {
      // Generate merchant refund ID if not provided
      const merchantRefundId = request.merchantRefundId || randomUUID();

      // Validate amount (minimum 100 paisa = ₹1)
      if (request.amount < 100) {
        throw new Error('Minimum refund amount is ₹1 (100 paisa)');
      }

      // Build refund request
      const refundRequest = RefundRequest.builder()
        .amount(request.amount)
        .merchantRefundId(merchantRefundId)
        .originalMerchantOrderId(request.originalMerchantOrderId)
        .build();

      // Initiate refund
      const response = await this.client.refund(refundRequest);

      return {
        success: true,
        merchantRefundId,
        refundId: response.refundId,
        state: response.state,
        amount: response.amount
      };

    } catch (error) {
      if (error instanceof PhonePeException) {
        throw new Error(`PhonePe API Error: ${error.message} (Code: ${error.code})`);
      }
      
      throw new Error(`Refund initiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check refund status
   */
  public async getRefundStatus(refundId: string) {
    if (!this.client) {
      throw new Error('PhonePe SDK client not initialized');
    }

    try {
      const response = await this.client.getRefundStatus(refundId);

      return {
        success: true,
        merchantId: response.merchantId,
        merchantRefundId: response.merchantRefundId,
        state: response.state,
        amount: response.amount,
        paymentDetails: response.paymentDetails
      };

    } catch (error) {
      if (error instanceof PhonePeException) {
        throw new Error(`PhonePe API Error: ${error.message} (Code: ${error.code})`);
      }
      
      throw new Error(`Refund status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate webhook callback
   */
  public validateCallback(
    authorizationHeader: string,
    responseBody: string,
    username?: string,
    password?: string
  ) {
    if (!this.client) {
      throw new Error('PhonePe SDK client not initialized');
    }

    try {
      // Use configured credentials or fallback to provided ones
      const webhookUsername = username || this.config.webhookUsername;
      const webhookPassword = password || this.config.webhookPassword;

      if (!webhookUsername || !webhookPassword) {
        throw new Error('Webhook credentials not configured');
      }

      const callbackResponse = this.client.validateCallback(
        webhookUsername,
        webhookPassword,
        authorizationHeader,
        responseBody
      );

      return {
        success: true,
        type: callbackResponse.type,
        payload: callbackResponse.payload
      };

    } catch (error) {
      if (error instanceof PhonePeException) {
        throw new Error(`PhonePe API Error: ${error.message} (Code: ${error.code})`);
      }
      
      throw new Error(`Callback validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get client configuration info (for debugging)
   */
  public getConfigInfo() {
    return {
      environment: this.config.environment,
      clientId: this.config.clientId,
      clientVersion: this.config.clientVersion,
      isInitialized: !!this.client,
      hasWebhookCredentials: !!(this.config.webhookUsername && this.config.webhookPassword)
    };
  }
}

/**
 * Utility function to convert amount from rupees to paisa
 */
export const convertRupeesToPaisa = (rupees: number): number => {
  return Math.round(rupees * 100);
};

/**
 * Utility function to convert amount from paisa to rupees
 */
export const convertPaisaToRupees = (paisa: number): number => {
  return paisa / 100;
};

export default PhonePeSDKService;
