/**
 * Production Payment Configuration Service
 * Handles environment-specific payment gateway configuration
 */

export interface PaymentGatewayConfig {
  name: string;
  enabled: boolean;
  isProduction: boolean;
  priority: number; // Lower number = higher priority
}

export interface RazorpayConfig extends PaymentGatewayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

export interface PhonePeConfig extends PaymentGatewayConfig {
  merchantId: string;
  clientId: string;
  clientSecret: string;
  saltKey: string;
  saltIndex: string;
  apiUrl: string;
  environment: 'sandbox' | 'production';
}

export class ProductionPaymentConfig {
  private static instance: ProductionPaymentConfig;
  private razorpayConfig: RazorpayConfig | null = null;
  private phonepeConfig: PhonePeConfig | null = null;

  private constructor() {
    this.initializeConfigurations();
  }

  static getInstance(): ProductionPaymentConfig {
    if (!ProductionPaymentConfig.instance) {
      ProductionPaymentConfig.instance = new ProductionPaymentConfig();
    }
    return ProductionPaymentConfig.instance;
  }

  private initializeConfigurations(): void {
    console.log('🔧 Initializing production payment configurations...');
    
    // Initialize Razorpay Configuration
    this.initializeRazorpay();
    
    // Initialize PhonePe Configuration
    this.initializePhonePe();

    // Log configuration status
    this.logConfigurationStatus();
  }

  private initializeRazorpay(): void {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (keyId && keySecret) {
      const isProduction = keyId.startsWith('rzp_live_');
      
      this.razorpayConfig = {
        name: 'Razorpay',
        enabled: true,
        isProduction,
        priority: isProduction ? 1 : 2, // Production Razorpay gets higher priority
        keyId: keyId.trim(),
        keySecret: keySecret.trim(),
        webhookSecret: webhookSecret?.trim()
      };

      console.log('✅ Razorpay configured:', {
        enabled: true,
        isProduction,
        keyId: `${keyId.substring(0, 12)}...`,
        hasWebhookSecret: !!webhookSecret
      });
    } else {
      console.warn('⚠️ Razorpay not configured - missing credentials');
    }
  }

  private initializePhonePe(): void {
    const merchantId = process.env.PHONEPE_MERCHANT_ID;
    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    const environment = (process.env.PHONEPE_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';
    
    // Determine API URL based on environment
    const apiUrl = environment === 'production' 
      ? 'https://api.phonepe.com'
      : 'https://api-preprod.phonepe.com';

    if (merchantId && clientId && clientSecret && saltKey) {
      const isProduction = environment === 'production';
      
      this.phonepeConfig = {
        name: 'PhonePe',
        enabled: true,
        isProduction,
        priority: isProduction ? 1 : 3, // Production PhonePe gets priority
        merchantId: merchantId.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        saltKey: saltKey.trim(),
        saltIndex: saltIndex.trim(),
        apiUrl: apiUrl,
        environment
      };

      console.log('✅ PhonePe v2 configured:', {
        enabled: true,
        isProduction,
        environment,
        merchantId,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        saltIndex,
        apiUrl
      });
    } else {
      console.warn('⚠️ PhonePe v2 not configured - missing credentials:', {
        hasMerchantId: !!merchantId,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasSaltKey: !!saltKey
      });
    }
  }

  private logConfigurationStatus(): void {
    const availableGateways = this.getAvailableGateways();
    const productionGateways = availableGateways.filter(g => g.isProduction);
    
    console.log('📊 Payment Gateway Status:', {
      totalGateways: availableGateways.length,
      productionGateways: productionGateways.length,
      primaryGateway: this.getPrimaryGateway()?.name || 'None',
      environment: process.env.NODE_ENV
    });

    if (productionGateways.length === 0 && process.env.NODE_ENV === 'production') {
      console.error('🚨 WARNING: No production payment gateways configured in production environment!');
    }
  }

  /**
   * Get all available payment gateways
   */
  getAvailableGateways(): PaymentGatewayConfig[] {
    const gateways: PaymentGatewayConfig[] = [];
    
    if (this.razorpayConfig) gateways.push(this.razorpayConfig);
    if (this.phonepeConfig) gateways.push(this.phonepeConfig);
    
    return gateways.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get primary payment gateway (highest priority)
   */
  getPrimaryGateway(): PaymentGatewayConfig | null {
    const available = this.getAvailableGateways();
    return available.length > 0 ? available[0] : null;
  }

  /**
   * Get Razorpay configuration
   */
  getRazorpayConfig(): RazorpayConfig | null {
    return this.razorpayConfig;
  }

  /**
   * Get PhonePe configuration
   */
  getPhonePeConfig(): PhonePeConfig | null {
    return this.phonepeConfig;
  }

  /**
   * Check if a specific gateway is available and configured
   */
  isGatewayAvailable(gateway: 'razorpay' | 'phonepe'): boolean {
    switch (gateway) {
      case 'razorpay':
        return this.razorpayConfig?.enabled ?? false;
      case 'phonepe':
        return this.phonepeConfig?.enabled ?? false;
      default:
        return false;
    }
  }

  /**
   * Get gateway by name
   */
  getGatewayConfig(gateway: 'razorpay' | 'phonepe'): PaymentGatewayConfig | null {
    switch (gateway) {
      case 'razorpay':
        return this.razorpayConfig;
      case 'phonepe':
        return this.phonepeConfig;
      default:
        return null;
    }
  }

  /**
   * Check if we're in production mode
   */
  isProductionMode(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Get production-ready gateways only
   */
  getProductionGateways(): PaymentGatewayConfig[] {
    return this.getAvailableGateways().filter(gateway => gateway.isProduction);
  }

  /**
   * Validate payment configuration for production
   */
  validateProductionConfig(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const availableGateways = this.getAvailableGateways();
    const productionGateways = this.getProductionGateways();
    
    // Check if we have at least one gateway
    if (availableGateways.length === 0) {
      errors.push('No payment gateways configured');
    }
    
    // Check production configuration in production environment
    if (this.isProductionMode()) {
      if (productionGateways.length === 0) {
        errors.push('No production payment gateways configured in production environment');
      }
      
      // Check webhook configurations
      if (this.razorpayConfig?.isProduction && !this.razorpayConfig.webhookSecret) {
        warnings.push('Razorpay webhook secret not configured for production');
      }
    }
    
    // Check SSL in production
    if (this.isProductionMode()) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl && !appUrl.startsWith('https://')) {
        errors.push('Production environment must use HTTPS');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get gateway recommendation based on current configuration
   */
  getGatewayRecommendation(): {
    recommended: 'razorpay' | 'phonepe' | null;
    reason: string;
  } {
    const productionGateways = this.getProductionGateways();
    const availableGateways = this.getAvailableGateways();
    
    if (this.isProductionMode()) {
      if (productionGateways.length === 0) {
        return {
          recommended: null,
          reason: 'No production gateways available'
        };
      }
      
      const primary = productionGateways[0];
      return {
        recommended: primary.name.toLowerCase() as 'razorpay' | 'phonepe',
        reason: `${primary.name} is configured for production with highest priority`
      };
    } else {
      if (availableGateways.length === 0) {
        return {
          recommended: null,
          reason: 'No gateways available'
        };
      }
      
      const primary = availableGateways[0];
      return {
        recommended: primary.name.toLowerCase() as 'razorpay' | 'phonepe',
        reason: `${primary.name} has highest priority among available gateways`
      };
    }
  }
}

// Export singleton instance
export const paymentConfig = ProductionPaymentConfig.getInstance();
