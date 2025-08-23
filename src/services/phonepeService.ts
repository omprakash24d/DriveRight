import { PhonePeConfig } from '@/types/payment';

export interface PhonePePaymentRequest {
  amount: number; // in paise
  merchantTransactionId: string;
  merchantUserId: string;
  redirectUrl: string;
  redirectMode: 'POST' | 'GET';
  callbackUrl: string;
  paymentInstrument: {
    type: 'PAY_PAGE';
  };
}

export interface PhonePeInitiateResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    instrumentResponse: {
      type: string;
      redirectInfo: {
        url: string;
        method: string;
      };
    };
  };
}

export interface PhonePeStatusResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: 'PENDING' | 'COMPLETED' | 'FAILED';
    responseCode: string;
    paymentInstrument: {
      type: string;
      utr?: string;
    };
  };
}

interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class PhonePeService {
  private config: PhonePeConfig;
  private baseUrl: string;
  private authUrl: string;
  private authToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor(config?: PhonePeConfig) {
    // Default config from environment variables if not provided
    this.config = config || {
      merchantId: process.env.PHONEPE_MERCHANT_ID || '',
      clientId: process.env.PHONEPE_CLIENT_ID || '',
      clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
      saltKey: '', // Not used in Standard Checkout API v2
      saltIndex: '1', // Not used in Standard Checkout API v2
      environment: (process.env.PHONEPE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };

    // Set URLs based on environment
    if (this.config.environment === 'production') {
      this.baseUrl = 'https://api.phonepe.com/apis/pg';
      this.authUrl = 'https://api.phonepe.com/apis/identity-manager';
    } else {
      // For sandbox, use the appropriate URLs
      this.baseUrl = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
      this.authUrl = 'https://api-preprod.phonepe.com/apis/identity-manager';
    }

    console.log('🏗️ PhonePe Service initialized:', {
      environment: this.config.environment,
      merchantId: this.config.merchantId,
      baseUrl: this.baseUrl,
      authUrl: this.authUrl,
      hasClientId: !!this.config.clientId,
      hasClientSecret: !!this.config.clientSecret
    });

    this.validateConfig();
  }

  private validateConfig(): void {
    const missing: string[] = [];
    
    if (!this.config.merchantId) missing.push('merchantId');
    if (!this.config.clientId) missing.push('clientId');
    if (!this.config.clientSecret) missing.push('clientSecret');
    // Salt key is not required for Standard Checkout API v2

    if (missing.length > 0) {
      const error = `PhonePe configuration missing: ${missing.join(', ')}`;
      console.error('❌', error);
      throw new Error(error);
    }

    console.log('✅ PhonePe configuration validated successfully');
  }

  /**
   * Get OAuth access token for PhonePe API
   */
  private async getAuthToken(): Promise<string> {
    // For sandbox environment, use mock token that will gracefully fail
    if (this.config.environment === 'sandbox') {
      console.log('🔐 Using sandbox mode - PhonePe sandbox requires proper JWT from merchant dashboard');
      console.log('💡 Note: To use real PhonePe sandbox, get JWT token from PhonePe merchant dashboard');
      // Return a placeholder token that will trigger graceful fallback
      return 'O-Bearer SANDBOX_PLACEHOLDER_TOKEN';
    }

    const currentTime = Date.now();
    
    // Return cached token if still valid (with 5 min buffer)
    if (this.authToken && currentTime < (this.tokenExpiryTime - 300000)) {
      return `O-Bearer ${this.authToken}`;
    }

    console.log('🔐 Requesting new PhonePe auth token...');
    console.log('🔐 Auth URL:', `${this.authUrl}/v1/oauth/token`);
    console.log('🔐 Client ID:', this.config.clientId);
    
    try {
      const response = await fetch(`${this.authUrl}/v1/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });

      console.log('🔐 OAuth response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PhonePe auth failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`PhonePe auth failed: ${response.status} - ${errorText}`);
      }

      const authData: AuthToken = await response.json();
      
      this.authToken = authData.access_token;
      this.tokenExpiryTime = currentTime + (authData.expires_in * 1000);
      
      console.log('✅ PhonePe auth token obtained:', {
        tokenType: authData.token_type,
        expiresIn: authData.expires_in,
        scope: authData.scope
      });

      return `O-Bearer ${this.authToken}`;
    } catch (error) {
      console.error('❌ PhonePe auth error:', error);
      throw new Error(`Failed to get PhonePe auth token: ${error}`);
    }
  }

  /**
   * Initiate PhonePe payment using Standard Checkout API v2
   */
  async initiatePayment(paymentRequest: PhonePePaymentRequest): Promise<PhonePeInitiateResponse> {
    console.log('🔍 PhonePe initiatePayment called with:', paymentRequest);
    
    try {
      // Get OAuth token
      const token = await this.getAuthToken();

      const payload = {
        merchantId: this.config.merchantId,
        merchantTransactionId: paymentRequest.merchantTransactionId,
        merchantUserId: paymentRequest.merchantUserId,
        amount: paymentRequest.amount,
        redirectUrl: paymentRequest.redirectUrl,
        redirectMode: paymentRequest.redirectMode,
        callbackUrl: paymentRequest.callbackUrl,
        paymentInstrument: paymentRequest.paymentInstrument
      };

      console.log('📦 PhonePe payload prepared:', payload);

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      console.log('🔐 Base64 payload:', base64Payload);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': token, // Always include Authorization header
        'X-MERCHANT-ID': this.config.merchantId,
        'accept': 'application/json'
      };

      const options = {
        method: 'POST',
        headers,
        body: JSON.stringify({
          request: base64Payload
        })
      };

      console.log('🌐 Making request to PhonePe API:', {
        url: `${this.baseUrl}/checkout/v2/pay`,
        headers: { ...headers, 'Authorization': '[HIDDEN]' },
        bodyLength: options.body.length
      });

      const response = await fetch(`${this.baseUrl}/checkout/v2/pay`, options);
      console.log('📥 PhonePe API response status:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('📥 PhonePe API raw response:', responseText);

      let responseData: PhonePeInitiateResponse;
      try {
        responseData = JSON.parse(responseText);
        console.log('📥 PhonePe API parsed response:', responseData);
      } catch (parseError) {
        console.error('❌ Failed to parse PhonePe response:', parseError);
        throw new Error(`Invalid JSON response from PhonePe: ${responseText}`);
      }

      if (!response.ok) {
        console.error('❌ PhonePe API error response:', {
          status: response.status,
          data: responseData
        });
        throw new Error(`PhonePe API error: ${response.status} - ${responseData.message || 'Unknown error'}`);
      }

      if (!responseData.success) {
        console.error('❌ PhonePe payment initiation failed:', responseData);
        throw new Error(`PhonePe API error: ${responseData.code} - ${responseData.message}`);
      }

      console.log('✅ PhonePe payment initiation successful');
      return responseData;

    } catch (error) {
      console.error('❌ PhonePe payment initiation failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  /**
   * Check payment status using Standard Checkout API v2
   */
  public async checkPaymentStatus(merchantTransactionId: string): Promise<PhonePeStatusResponse> {
    console.log('🔍 Checking PhonePe order status for:', merchantTransactionId);

    try {
      // Get OAuth token
      const token = await this.getAuthToken();

      const endpoint = `/checkout/v2/order/${merchantTransactionId}/status`;

      console.log('🌐 Making status request to PhonePe API:', {
        url: `${this.baseUrl}${endpoint}`,
        merchantTransactionId
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': token, // Always include Authorization header
        'X-MERCHANT-ID': this.config.merchantId,
        'Accept': 'application/json'
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers
      });

      const responseData: PhonePeStatusResponse = await response.json();
      
      console.log('📥 PhonePe status response:', {
        status: response.status,
        data: responseData
      });

      if (!response.ok) {
        throw new Error(`PhonePe status check failed: ${response.status} - ${responseData.message}`);
      }

      return responseData;
    } catch (error) {
      console.error('❌ PhonePe status check failed:', error);
      throw error;
    }
  }

  /**
   * Verify payment using order status
   */
  public async verifyPayment(merchantTransactionId: string, checksum?: string): Promise<boolean> {
    console.log('🔍 Verifying PhonePe payment:', { merchantTransactionId });

    try {
      const statusResponse = await this.checkPaymentStatus(merchantTransactionId);
      
      if (!statusResponse.success) {
        console.log('❌ PhonePe payment verification failed - API response not successful');
        return false;
      }

      const isPaymentComplete = statusResponse.data?.state === 'COMPLETED';
      console.log('✅ PhonePe payment verification result:', {
        merchantTransactionId,
        state: statusResponse.data?.state,
        isComplete: isPaymentComplete
      });

      return isPaymentComplete;
    } catch (error) {
      console.error('❌ PhonePe payment verification error:', error);
      return false;
    }
  }

  /**
   * Generate merchant transaction ID
   */
  public generateTransactionId(prefix: string = 'TXN'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Static method for generating transaction IDs (for backward compatibility)
   */
  public static generateTransactionId(prefix: string = 'TXN'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Static method for initiating payment (for backward compatibility)
   * Creates a temporary instance to handle the request
   */
  public static async initiatePayment(request: PhonePePaymentRequest): Promise<PhonePeInitiateResponse> {
    console.warn('⚠️ Using deprecated static PhonePeService.initiatePayment - please migrate to unifiedPaymentService');
    
    try {
      // Create a temporary instance with env vars
      const tempService = new PhonePeService({
        merchantId: process.env.PHONEPE_MERCHANT_ID || '',
        clientId: process.env.PHONEPE_CLIENT_ID || '',
        clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
        saltKey: '', // Not used in Standard Checkout API v2
        saltIndex: '1', // Not used in Standard Checkout API v2
        environment: (process.env.PHONEPE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'
      });
      
      return await tempService.initiatePayment(request);
    } catch (error) {
      console.error('Static initiatePayment failed:', error);
      return {
        success: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Payment initiation failed'
      };
    }
  }

  /**
   * Static method for checking payment status (for backward compatibility)
   * Creates a temporary instance to handle the request
   */
  public static async checkPaymentStatus(merchantTransactionId: string): Promise<PhonePeStatusResponse> {
    console.warn('⚠️ Using deprecated static PhonePeService.checkPaymentStatus - please migrate to unifiedPaymentService');
    
    try {
      // Create a temporary instance with env vars
      const tempService = new PhonePeService({
        merchantId: process.env.PHONEPE_MERCHANT_ID || '',
        clientId: process.env.PHONEPE_CLIENT_ID || '',
        clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
        saltKey: '', // Not used in Standard Checkout API v2
        saltIndex: '1', // Not used in Standard Checkout API v2
        environment: (process.env.PHONEPE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'
      });
      
      return await tempService.checkPaymentStatus(merchantTransactionId);
    } catch (error) {
      console.error('Static checkPaymentStatus failed:', error);
      return {
        success: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  /**
   * Format amount for PhonePe (convert to paise)
   */
  public formatAmount(amount: number): number {
    // PhonePe expects amount in paise (multiply by 100)
    return Math.round(amount * 100);
  }

  /**
   * Get environment URLs for reference
   */
  public getEnvironmentInfo() {
    return {
      environment: this.config.environment,
      baseUrl: this.baseUrl,
      authUrl: this.authUrl,
      merchantId: this.config.merchantId
    };
  }
}
