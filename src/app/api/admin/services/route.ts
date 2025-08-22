import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Admin authentication helper
async function verifyAdminAuth(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Authorization header missing or invalid' };
    }

    const token = authHeader.substring(7);
    
    // For development, allow a simple bypass with environment variable
    if (process.env.NODE_ENV === 'development' && process.env.DEV_ADMIN_BYPASS === 'true') {
      return { success: true, uid: 'dev-admin' };
    }

    // In production, verify the Firebase ID token
    if (process.env.NODE_ENV === 'production') {
      try {
        const { getAdminApp } = await import('@/lib/firebase-admin');
        const { getAuth } = await import('firebase-admin/auth');
        
        const adminApp = getAdminApp();
        const decodedToken = await getAuth(adminApp).verifyIdToken(token);
        
        // Check if user has admin privileges (you should implement your own logic)
        // For now, we'll assume any authenticated user in admin routes is an admin
        return { success: true, uid: decodedToken.uid };
      } catch (error) {
        console.error('Token verification failed:', error);
        return { success: false, error: 'Invalid authentication token' };
      }
    }

    return { success: false, error: 'Authentication not configured properly' };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Authentication verification failed' };
  }
}

// Simplified validation schemas that match the frontend data structure
const simpleServiceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  originalPrice: z.number().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  duration: z.string().min(1, 'Duration is required'),
  category: z.string().transform(val => val || 'General'), // Default to 'General' if empty
  features: z.array(z.string()),
  icon: z.string().min(1, 'Icon is required'),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  order: z.number().nullable().optional().transform(val => val ?? 0), // Default to 0 if null/undefined
});

// Complex schemas for internal service manager (if needed for transformation)
const basePricingSchema = z.object({
  basePrice: z.number().min(0, 'Base price must be non-negative'),
  currency: z.enum(['INR', 'USD']),
  discountPercentage: z.number().min(0).max(100).optional(),
  discountValidUntil: z.string().optional(),
  taxes: z.object({
    gst: z.number().min(0).optional(),
    serviceTax: z.number().min(0).optional(),
    otherCharges: z.number().min(0).optional(),
  }),
  finalPrice: z.number().min(0),
});

const seoMetadataSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.array(z.string()).optional(),
}).optional();

const trainingServiceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().optional(),
  icon: z.string().min(1, 'Icon is required'),
  category: z.enum(['LMV', 'MCWG', 'HMV', 'Special', 'Refresher']),
  services: z.array(z.string()),
  duration: z.object({
    value: z.number().min(1),
    unit: z.enum(['days', 'weeks', 'months']),
  }),
  pricing: basePricingSchema,
  features: z.array(z.string()),
  prerequisites: z.array(z.string()).optional(),
  certification: z.string().optional(),
  instructorRequired: z.boolean(),
  maxStudents: z.number().min(1).optional(),
  ctaHref: z.string().min(1, 'CTA href is required'),
  ctaText: z.string().min(1, 'CTA text is required'),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  bookingSettings: z.object({
    requireApproval: z.boolean(),
    allowRescheduling: z.boolean(),
    cancellationPolicy: z.string(),
    advanceBookingDays: z.number().min(0).optional(),
  }),
  seoMetadata: seoMetadataSchema,
});

const onlineServiceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().optional(),
  icon: z.string().min(1, 'Icon is required'),
  category: z.enum(['Document', 'Verification', 'Download', 'Inquiry', 'Application']),
  pricing: basePricingSchema,
  processingTime: z.object({
    value: z.number().min(1),
    unit: z.enum(['minutes', 'hours', 'days']),
  }),
  requiredDocuments: z.array(z.string()).optional(),
  deliveryMethod: z.enum(['email', 'download', 'portal', 'physical']),
  features: z.array(z.string()),
  href: z.string().min(1, 'Href is required'),
  ctaText: z.string().min(1, 'CTA text is required'),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  automatedProcessing: z.boolean(),
  requiresVerification: z.boolean(),
  seoMetadata: seoMetadataSchema,
});

// Helper function to transform enhanced services to simple format for frontend
function transformToSimpleFormat(service: any, serviceType: 'training' | 'online') {
  return {
    id: service.id,
    title: service.title,
    shortDescription: service.shortDescription || service.description?.substring(0, 100) + '...',
    longDescription: service.description,
    price: service.pricing?.finalPrice || service.pricing?.basePrice || 0,
    originalPrice: service.pricing?.basePrice !== service.pricing?.finalPrice ? service.pricing?.basePrice : undefined,
    discountPercent: service.pricing?.discountPercentage,
    duration: serviceType === 'training' 
      ? `${service.duration?.value || 1} ${service.duration?.unit || 'days'}` 
      : `${service.processingTime?.value || 1} ${service.processingTime?.unit || 'days'}`,
    category: service.category,
    features: service.features || [],
    icon: service.icon || 'FileText',
    status: service.isActive ? 'active' : 'inactive',
    order: service.priority || 0,
    createdAt: service.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: service.updatedAt?.toISOString() || new Date().toISOString(),
  };
}
function transformToComplexFormat(serviceData: any, serviceType: 'training' | 'online') {
  const baseTransformed = {
    title: serviceData.title,
    description: serviceData.longDescription || serviceData.shortDescription || serviceData.title,
    shortDescription: serviceData.shortDescription,
    icon: serviceData.icon,
    features: serviceData.features,
    isActive: serviceData.status === 'active',
    priority: serviceData.order || 0,
    pricing: {
      basePrice: serviceData.price,
      currency: 'INR' as const,
      discountPercentage: serviceData.discountPercent,
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0,
      },
      finalPrice: serviceData.originalPrice || serviceData.price,
    },
  };

  if (serviceType === 'training') {
    return {
      ...baseTransformed,
      category: serviceData.category as any,
      services: ['Driving Training'],
      duration: {
        value: parseInt(serviceData.duration) || 30,
        unit: 'days' as const,
      },
      prerequisites: [],
      instructorRequired: true,
      ctaHref: '/book-training',
      ctaText: 'Book Now',
      bookingSettings: {
        requireApproval: true,
        allowRescheduling: true,
        cancellationPolicy: 'Standard cancellation policy applies',
      },
    };
  } else {
    return {
      ...baseTransformed,
      category: serviceData.category as any,
      processingTime: {
        value: 1,
        unit: 'days' as const,
      },
      deliveryMethod: 'email' as const,
      href: '/online-services',
      ctaText: 'Apply Now',
      automatedProcessing: false,
      requiresVerification: true,
    };
  }
}

// GET - Fetch services
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'training' | 'online' | null;

    let services;
    if (type === 'training') {
      const rawServices = await EnhancedServicesManager.getTrainingServices();
      services = rawServices.map(service => transformToSimpleFormat(service, 'training'));
    } else if (type === 'online') {
      const rawServices = await EnhancedServicesManager.getOnlineServices();
      services = rawServices.map(service => transformToSimpleFormat(service, 'online'));
    } else {
      // Return both types
      const [rawTrainingServices, rawOnlineServices] = await Promise.all([
        EnhancedServicesManager.getTrainingServices(),
        EnhancedServicesManager.getOnlineServices(),
      ]);
      services = {
        training: rawTrainingServices.map(service => transformToSimpleFormat(service, 'training')),
        online: rawOnlineServices.map(service => transformToSimpleFormat(service, 'online')),
      };
    }

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch services',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    
    const { type: serviceType, service: serviceData } = body;

    // Validate service type
    if (!serviceType || !['training', 'online'].includes(serviceType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid service type',
          message: 'Service type must be either "training" or "online"',
        },
        { status: 400 }
      );
    }

    // Validate service data using simplified schema
    const validatedData = simpleServiceSchema.parse(serviceData);

    // Transform to complex format for the service manager
    const transformedData = transformToComplexFormat(validatedData, serviceType);

    // Create the service
    let serviceId;
    if (serviceType === 'training') {
      serviceId = await EnhancedServicesManager.createTrainingService(transformedData as any);
    } else {
      serviceId = await EnhancedServicesManager.createOnlineService(transformedData as any);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: serviceId,
        serviceType,
        ...validatedData,
      },
    });
  } catch (error) {
    console.error('Error creating service:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create service',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing service
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    
    const { id, type: serviceType, service: serviceData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service ID is required',
        },
        { status: 400 }
      );
    }

    // Validate service type
    if (!serviceType || !['training', 'online'].includes(serviceType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid service type',
          message: 'Service type must be either "training" or "online"',
        },
        { status: 400 }
      );
    }

    // Validate service data using simplified schema (partial for updates)
    const validatedData = simpleServiceSchema.partial().parse(serviceData);

    // Transform to complex format for the service manager
    const transformedData = transformToComplexFormat(validatedData, serviceType);

    // Update the service
    if (serviceType === 'training') {
      await EnhancedServicesManager.updateTrainingService(id, transformedData as any);
    } else {
      await EnhancedServicesManager.updateOnlineService(id, transformedData as any);
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        serviceType,
        ...validatedData,
      },
    });
  } catch (error) {
    console.error('Error updating service:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update service',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const serviceType = searchParams.get('type') as 'training' | 'online';

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service ID is required',
        },
        { status: 400 }
      );
    }

    if (!serviceType || !['training', 'online'].includes(serviceType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid service type',
          message: 'Service type must be either "training" or "online"',
        },
        { status: 400 }
      );
    }

    // Delete the service
    if (serviceType === 'training') {
      await EnhancedServicesManager.deleteTrainingService(id);
    } else {
      await EnhancedServicesManager.deleteOnlineService(id);
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete service',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}