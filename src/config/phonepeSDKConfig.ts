/**
 * PhonePe SDK Configuration
 * Based on official PhonePe Node.js SDK documentation
 */

import { PhonePeSDKConfig } from '../services/phonepeSDKService';

export class PhonePeSDKConfiguration {
  private static instance: PhonePeSDKConfiguration;
  private config: PhonePeSDKConfig | null = null;

  private constructor() {
    this.initializeConfiguration();
  }

  public static getInstance(): PhonePeSDKConfiguration {
    if (!PhonePeSDKConfiguration.instance) {
      PhonePeSDKConfiguration.instance = new PhonePeSDKConfiguration();
    }
    return PhonePeSDKConfiguration.instance;
  }

  private initializeConfiguration(): void {
    try {
      // Get environment variables
      const clientId = process.env.PHONEPE_CLIENT_ID;
      const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
      const clientVersion = process.env.PHONEPE_CLIENT_VERSION;
      const environment = process.env.PHONEPE_ENVIRONMENT || 'sandbox';
      const webhookUsername = process.env.PHONEPE_WEBHOOK_USERNAME;
      const webhookPassword = process.env.PHONEPE_WEBHOOK_PASSWORD;

      // Validate required configuration
      if (!clientId || !clientSecret || !clientVersion) {
        console.warn('⚠️ PhonePe SDK configuration incomplete. Some environment variables are missing.');
        return;
      }

      // Parse client version
      const parsedClientVersion = parseInt(clientVersion, 10);
      if (isNaN(parsedClientVersion)) {
        console.error('❌ Invalid PhonePe client version. Must be a number.');
        return;
      }

      // Validate environment
      if (environment !== 'sandbox' && environment !== 'production') {
        console.error('❌ Invalid PhonePe environment. Must be "sandbox" or "production".');
        return;
      }

      this.config = {
        clientId,
        clientSecret,
        clientVersion: parsedClientVersion,
        environment: environment as 'sandbox' | 'production',
        webhookUsername,
        webhookPassword
      };

      console.log('✅ PhonePe SDK configuration loaded successfully:', {
        environment: this.config.environment,
        clientId: this.maskSensitiveValue(this.config.clientId),
        clientVersion: this.config.clientVersion,
        hasWebhookCredentials: !!(webhookUsername && webhookPassword)
      });

    } catch (error) {
      console.error('❌ Failed to initialize PhonePe SDK configuration:', error);
    }
  }

  /**
   * Get the complete PhonePe SDK configuration
   */
  public getConfig(): PhonePeSDKConfig | null {
    return this.config;
  }

  /**
   * Check if PhonePe SDK is properly configured
   */
  public isConfigured(): boolean {
    return !!this.config;
  }

  /**
   * Get environment info
   */
  public getEnvironment(): 'sandbox' | 'production' | null {
    return this.config?.environment || null;
  }

  /**
   * Check if running in production
   */
  public isProduction(): boolean {
    return this.config?.environment === 'production';
  }

  /**
   * Check if webhook credentials are configured
   */
  public hasWebhookCredentials(): boolean {
    return !!(this.config?.webhookUsername && this.config?.webhookPassword);
  }

  /**
   * Get configuration status for debugging
   */
  public getConfigStatus() {
    if (!this.config) {
      return {
        configured: false,
        missingVariables: this.getMissingEnvironmentVariables()
      };
    }

    return {
      configured: true,
      environment: this.config.environment,
      clientId: this.maskSensitiveValue(this.config.clientId),
      clientVersion: this.config.clientVersion,
      hasWebhookCredentials: this.hasWebhookCredentials(),
      isProduction: this.isProduction()
    };
  }

  /**
   * Get list of missing environment variables
   */
  private getMissingEnvironmentVariables(): string[] {
    const missing: string[] = [];
    
    if (!process.env.PHONEPE_CLIENT_ID) missing.push('PHONEPE_CLIENT_ID');
    if (!process.env.PHONEPE_CLIENT_SECRET) missing.push('PHONEPE_CLIENT_SECRET');
    if (!process.env.PHONEPE_CLIENT_VERSION) missing.push('PHONEPE_CLIENT_VERSION');

    return missing;
  }

  /**
   * Mask sensitive values for logging
   */
  private maskSensitiveValue(value: string): string {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  /**
   * Validate configuration and throw error if invalid
   */
  public validateConfiguration(): void {
    if (!this.config) {
      const missing = this.getMissingEnvironmentVariables();
      throw new Error(
        `PhonePe SDK configuration is incomplete. Missing environment variables: ${missing.join(', ')}`
      );
    }

    if (this.config.clientVersion < 1) {
      throw new Error('Invalid PhonePe client version. Must be a positive number.');
    }
  }

  /**
   * Get redirect URLs based on environment
   */
  public getRedirectUrls() {
    const baseUrl = this.isProduction() 
      ? process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    return {
      success: `${baseUrl}/payment/phonepe/callback?status=success&merchantOrderId={{merchantOrderId}}`,
      failure: `${baseUrl}/payment/phonepe/callback?status=failure&merchantOrderId={{merchantOrderId}}`,
      cancel: `${baseUrl}/payment/phonepe/callback?status=cancel&merchantOrderId={{merchantOrderId}}`
    };
  }

  /**
   * Get webhook URL based on environment
   */
  public getWebhookUrl(): string {
    const baseUrl = this.isProduction() 
      ? process.env.NEXT_PUBLIC_PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    return `${baseUrl}/api/payments/phonepe/webhook`;
  }
}

/**
 * Environment Variables Guide for PhonePe SDK
 * 
 * Add these to your .env.local file:
 * 
 * # PhonePe SDK Configuration
 * PHONEPE_CLIENT_ID=your_client_id
 * PHONEPE_CLIENT_SECRET=your_client_secret
 * PHONEPE_CLIENT_VERSION=1
 * PHONEPE_ENVIRONMENT=sandbox  # or 'production' for live
 * 
 * # PhonePe Webhook Configuration (Optional but recommended)
 * PHONEPE_WEBHOOK_USERNAME=your_webhook_username
 * PHONEPE_WEBHOOK_PASSWORD=your_webhook_password
 * 
 * # Application URLs
 * NEXT_PUBLIC_BASE_URL=http://localhost:9002
 * NEXT_PUBLIC_PRODUCTION_URL=https://yourdomain.com
 */

export default PhonePeSDKConfiguration;
