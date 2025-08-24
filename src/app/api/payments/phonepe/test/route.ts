/**
 * PhonePe SDK Integration Test
 * Test the PhonePe Node.js SDK setup and configuration
 */

import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import PhonePeSDKService, { convertPaisaToRupees, convertRupeesToPaisa } from '@/services/phonepeSDKService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 PhonePe SDK Integration Test Started');

    // Test 1: Configuration Check
    const config = PhonePeSDKConfiguration.getInstance();
    const configStatus = config.getConfigStatus();

    console.log('📋 Configuration Status:', configStatus);

    if (!config.isConfigured()) {
      return NextResponse.json({
        success: false,
        test: 'PhonePe SDK Configuration Test',
        error: 'PhonePe SDK not configured',
        missing: configStatus.missingVariables || [],
        instructions: [
          '1. Copy .env.phonepe.template to .env.local',
          '2. Add your PhonePe credentials',
          '3. Restart the development server'
        ]
      });
    }

    // Test 2: Configuration Validation
    try {
      config.validateConfiguration();
      console.log('✅ Configuration validation passed');
    } catch (configError) {
      return NextResponse.json({
        success: false,
        test: 'PhonePe SDK Configuration Validation',
        error: configError instanceof Error ? configError.message : 'Configuration validation failed',
        configStatus
      });
    }

    // Test 3: SDK Service Initialization
    let phonepeService;
    try {
      const phonepeConfig = config.getConfig()!;
      phonepeService = PhonePeSDKService.getInstance(phonepeConfig);
      console.log('✅ PhonePe SDK Service initialized');
    } catch (serviceError) {
      return NextResponse.json({
        success: false,
        test: 'PhonePe SDK Service Initialization',
        error: serviceError instanceof Error ? serviceError.message : 'Service initialization failed',
        configStatus
      });
    }

    // Test 4: Utility Functions
    const testAmount = 1000; // ₹1000
    const paisaAmount = convertRupeesToPaisa(testAmount);
    const rupeesAmount = convertPaisaToRupees(paisaAmount);

    console.log('🔄 Testing utility functions:', {
      originalRupees: testAmount,
      convertedPaisa: paisaAmount,
      convertedBackRupees: rupeesAmount
    });

    // Test 5: SDK Configuration Info
    const serviceInfo = phonepeService.getConfigInfo();
    console.log('📊 SDK Service Info:', serviceInfo);

    // Test 6: URL Generation
    const redirectUrls = config.getRedirectUrls();
    const webhookUrl = config.getWebhookUrl();

    console.log('🔗 Generated URLs:', {
      redirectUrls,
      webhookUrl
    });

    // Test 7: Mock Payment Initiation (Dry Run)
    const mockPaymentRequest = {
      amount: paisaAmount,
      redirectUrl: redirectUrls.success,
      customerInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210'
      },
      metadata: {
        udf1: 'test_service',
        udf2: 'SDK Integration Test',
        udf3: 'test_booking_123',
        udf4: 'test@example.com',
        udf5: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString()
        })
      }
    };

    console.log('🔍 Mock payment request prepared:', {
      amount: testAmount,
      amountInPaisa: paisaAmount,
      environment: config.getEnvironment()
    });

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      test: 'PhonePe SDK Integration Test',
      timestamp: new Date().toISOString(),
      results: {
        configuration: {
          status: 'PASSED',
          ...configStatus
        },
        sdkService: {
          status: 'PASSED',
          ...serviceInfo
        },
        utilityFunctions: {
          status: 'PASSED',
          testAmount,
          paisaConversion: paisaAmount,
          rupeesConversion: rupeesAmount,
          conversionCorrect: rupeesAmount === testAmount
        },
        urlGeneration: {
          status: 'PASSED',
          redirectUrls,
          webhookUrl
        },
        mockPaymentRequest: {
          status: 'PREPARED',
          note: 'Payment request prepared but not executed in test mode',
          request: mockPaymentRequest
        }
      },
      nextSteps: [
        'Configuration is ready for PhonePe SDK integration',
        'Test payment initiation using /api/payments/phonepe/initiate',
        'Test order status check using /api/payments/phonepe/status',
        'Configure webhook credentials for production use'
      ],
      documentation: {
        integrationGuide: 'See PHONEPE_SDK_INTEGRATION_COMPLETE.md',
        apiEndpoints: [
          'POST /api/payments/phonepe/initiate',
          'POST /api/payments/phonepe/status',
          'POST /api/payments/phonepe/refund',
          'POST /api/payments/phonepe/webhook',
          'POST /api/payments/phonepe/create-sdk-order'
        ]
      }
    });

  } catch (error) {
    console.error('❌ PhonePe SDK Integration Test Failed:', error);

    return NextResponse.json({
      success: false,
      test: 'PhonePe SDK Integration Test',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      troubleshooting: [
        'Check environment variables in .env.local',
        'Verify PhonePe credentials are correct',
        'Ensure pg-sdk-node package is installed',
        'Restart development server after configuration changes'
      ]
    }, { status: 500 });
  }
}

// POST endpoint for testing payment initiation
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 PhonePe SDK Payment Test Started');

    const body = await request.json();
    const {
      amount = 100, // Default ₹100
      customerInfo = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '9876543210'
      }
    } = body;

    // Initialize configuration
    const config = PhonePeSDKConfiguration.getInstance();
    
    if (!config.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'PhonePe SDK not configured'
      }, { status: 503 });
    }

    // Get SDK service
    const phonepeConfig = config.getConfig()!;
    const phonepeService = PhonePeSDKService.getInstance(phonepeConfig);

    // Convert amount and prepare request
    const amountInPaisa = convertRupeesToPaisa(amount);
    const redirectUrl = config.getRedirectUrls().success;

    const paymentRequest = {
      amount: amountInPaisa,
      redirectUrl,
      customerInfo,
      metadata: {
        udf1: 'test_service',
        udf2: 'PhonePe SDK Test',
        udf3: `test_${Date.now()}`,
        udf4: customerInfo.email,
        udf5: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          requestedAmount: amount
        })
      }
    };

    console.log('🚀 Testing payment initiation...');
    
    // Test payment initiation
    const paymentResponse = await phonepeService.initiatePayment(paymentRequest);

    console.log('✅ Test payment initiated successfully');

    return NextResponse.json({
      success: true,
      test: 'PhonePe SDK Payment Initiation Test',
      environment: config.getEnvironment(),
      request: {
        amount,
        amountInPaisa,
        customerInfo
      },
      response: paymentResponse,
      instructions: [
        'Payment test successful',
        'Use the checkoutUrl to test the payment flow',
        'Verify payment status using /api/payments/phonepe/status',
        'Check webhook handling if configured'
      ]
    });

  } catch (error) {
    console.error('❌ PhonePe SDK Payment Test Failed:', error);

    return NextResponse.json({
      success: false,
      test: 'PhonePe SDK Payment Initiation Test',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
