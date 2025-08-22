// Enhanced Services with Pricing & Payment Integration
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { addLog } from "./auditLogService";

// --- Enhanced Service Types with Pricing ---
export interface ServicePricing {
  basePrice: number;
  currency: 'INR' | 'USD';
  discountPercentage?: number;
  discountValidUntil?: Date;
  taxes: {
    gst?: number;
    serviceTax?: number;
    otherCharges?: number;
  };
  finalPrice: number; // Calculated field
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceType: 'training' | 'online';
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  bookingDate: Date;
  scheduledDate?: Date; // For training services
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentDetails?: {
    transactionId: string;
    paymentMethod: 'razorpay' | 'upi' | 'card' | 'netbanking';
    paidAmount: number;
    paymentDate: Date;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionRecord {
  id: string;
  bookingId: string;
  serviceId: string;
  serviceType: 'training' | 'online';
  customerId: string;
  transactionType: 'payment' | 'refund' | 'partial_refund';
  amount: number;
  currency: 'INR' | 'USD';
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  paymentGateway: 'razorpay' | 'upi' | 'card' | 'netbanking';
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  metadata: {
    customerIP?: string;
    userAgent?: string;
    additionalInfo?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedTrainingService {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  icon: string;
  category: 'LMV' | 'MCWG' | 'HMV' | 'Special' | 'Refresher';
  services: string[];
  duration: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
  pricing: ServicePricing;
  features: string[];
  prerequisites?: string[];
  certification?: string;
  instructorRequired: boolean;
  maxStudents?: number;
  ctaHref: string;
  ctaText: string;
  isActive: boolean;
  priority: number; // For ordering
  bookingSettings: {
    requireApproval: boolean;
    allowRescheduling: boolean;
    cancellationPolicy: string;
    advanceBookingDays?: number;
  };
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedOnlineService {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  icon: string;
  category: 'Document' | 'Verification' | 'Download' | 'Inquiry' | 'Application';
  pricing: ServicePricing;
  processingTime: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  requiredDocuments?: string[];
  deliveryMethod: 'email' | 'download' | 'portal' | 'physical';
  features: string[];
  href: string;
  ctaText: string;
  isActive: boolean;
  priority: number;
  automatedProcessing: boolean;
  requiresVerification: boolean;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Service Analytics
export interface ServiceAnalytics {
  serviceId: string;
  serviceType: 'training' | 'online';
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating?: number;
  conversionRate: number; // bookings/views percentage
  popularityScore: number;
  monthlyTrends: {
    month: string;
    bookings: number;
    revenue: number;
  }[];
  updatedAt: Date;
}

const TRAINING_SERVICES_COLLECTION = 'enhancedTrainingServices';
const ONLINE_SERVICES_COLLECTION = 'enhancedOnlineServices';
const SERVICE_BOOKINGS_COLLECTION = 'serviceBookings';
const TRANSACTIONS_COLLECTION = 'transactions';
const SERVICE_ANALYTICS_COLLECTION = 'serviceAnalytics';

// --- Service Management Functions ---

export class EnhancedServicesManager {
  // Training Services
  static async getTrainingServices(): Promise<EnhancedTrainingService[]> {
    if (!db.app) {
      console.warn("Firebase not initialized. Returning empty training services.");
      return [];
    }
    
    try {
      // Simplified query to avoid complex index requirements
      const servicesQuery = query(
        collection(db, TRAINING_SERVICES_COLLECTION),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(servicesQuery);
      
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        pricing: {
          ...doc.data().pricing,
          discountValidUntil: doc.data().pricing?.discountValidUntil?.toDate()
        }
      })) as EnhancedTrainingService[];
      
      // Sort in memory to avoid index requirement
      return services.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    } catch (error) {
      console.error("Error fetching training services:", error);
      return [];
    }
  }

  static async getOnlineServices(): Promise<EnhancedOnlineService[]> {
    if (!db.app) {
      console.warn("Firebase not initialized. Returning empty online services.");
      return [];
    }
    
    try {
      // Simplified query to avoid complex index requirements
      const servicesQuery = query(
        collection(db, ONLINE_SERVICES_COLLECTION),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(servicesQuery);
      
      const services = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        pricing: {
          ...doc.data().pricing,
          discountValidUntil: doc.data().pricing?.discountValidUntil?.toDate()
        }
      })) as EnhancedOnlineService[];
      
      // Sort in memory to avoid index requirement
      return services.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    } catch (error) {
      console.error("Error fetching online services:", error);
      return [];
    }
  }

  // Service Booking Management
  static async createServiceBooking(bookingData: Omit<ServiceBooking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const booking: Omit<ServiceBooking, 'id'> = {
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Prepare data for Firestore, excluding undefined values
      const firestoreData: any = {
        serviceId: booking.serviceId,
        serviceType: booking.serviceType,
        customerInfo: booking.customerInfo,
        bookingDate: Timestamp.fromDate(booking.bookingDate),
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: Timestamp.fromDate(booking.createdAt),
        updatedAt: Timestamp.fromDate(booking.updatedAt)
      };

      // Only add optional fields if they exist and are not undefined
      if (booking.scheduledDate) {
        firestoreData.scheduledDate = Timestamp.fromDate(booking.scheduledDate);
      }

      if (booking.notes && booking.notes.trim() !== '') {
        firestoreData.notes = booking.notes.trim();
      }

      if (booking.paymentDetails) {
        firestoreData.paymentDetails = {
          ...booking.paymentDetails,
          paymentDate: Timestamp.fromDate(booking.paymentDetails.paymentDate)
        };
      }

      const docRef = await addDoc(collection(db, SERVICE_BOOKINGS_COLLECTION), firestoreData);

      await addLog('service_booking_created', `Booking ID: ${docRef.id} for ${bookingData.serviceType} service: ${bookingData.serviceId}`);

      return docRef.id;
    } catch (error) {
      console.error("Error creating service booking:", error);
      throw error;
    }
  }

  // Transaction Recording
  static async recordTransaction(transactionData: Omit<TransactionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const transaction: Omit<TransactionRecord, 'id'> = {
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Prepare data for Firestore, ensuring no undefined values in nested objects
      const firestoreData: any = {
        bookingId: transaction.bookingId,
        serviceId: transaction.serviceId,
        serviceType: transaction.serviceType,
        customerId: transaction.customerId,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        paymentGateway: transaction.paymentGateway,
        metadata: {
          customerIP: transaction.metadata.customerIP || 'unknown',
          userAgent: transaction.metadata.userAgent || 'unknown',
          additionalInfo: transaction.metadata.additionalInfo || {}
        },
        createdAt: Timestamp.fromDate(transaction.createdAt),
        updatedAt: Timestamp.fromDate(transaction.updatedAt)
      };

      // Only add optional gateway fields if they exist
      if (transaction.gatewayTransactionId) {
        firestoreData.gatewayTransactionId = transaction.gatewayTransactionId;
      }
      
      if (transaction.gatewayOrderId) {
        firestoreData.gatewayOrderId = transaction.gatewayOrderId;
      }
      
      if (transaction.gatewayPaymentId) {
        firestoreData.gatewayPaymentId = transaction.gatewayPaymentId;
      }

      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), firestoreData);

      await addLog('transaction_recorded', `Transaction ID: ${docRef.id} for booking: ${transactionData.bookingId}, Amount: ${transactionData.amount} ${transactionData.currency}`);

      return docRef.id;
    } catch (error) {
      console.error("Error recording transaction:", error);
      throw error;
    }
  }

  // Calculate final price with taxes and discounts
  static calculateFinalPrice(pricing: Omit<ServicePricing, 'finalPrice'>): number {
    let price = pricing.basePrice;
    
    // Apply discount if valid
    if (pricing.discountPercentage && pricing.discountValidUntil && pricing.discountValidUntil > new Date()) {
      price = price - (price * pricing.discountPercentage / 100);
    }
    
    // Add taxes
    if (pricing.taxes.gst) {
      price += (price * pricing.taxes.gst / 100);
    }
    if (pricing.taxes.serviceTax) {
      price += (price * pricing.taxes.serviceTax / 100);
    }
    if (pricing.taxes.otherCharges) {
      price += pricing.taxes.otherCharges;
    }
    
    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }

  // Get service analytics
  static async getServiceAnalytics(serviceId: string): Promise<ServiceAnalytics | null> {
    try {
      const analyticsDoc = await getDoc(doc(db, SERVICE_ANALYTICS_COLLECTION, serviceId));
      
      if (!analyticsDoc.exists()) {
        return null;
      }
      
      return {
        ...analyticsDoc.data(),
        updatedAt: analyticsDoc.data().updatedAt?.toDate()
      } as ServiceAnalytics;
    } catch (error) {
      console.error("Error fetching service analytics:", error);
      return null;
    }
  }

  // Admin functions
  static async updateServicePricing(serviceId: string, serviceType: 'training' | 'online', newPricing: Omit<ServicePricing, 'finalPrice'>): Promise<void> {
    try {
      const collectionName = serviceType === 'training' ? TRAINING_SERVICES_COLLECTION : ONLINE_SERVICES_COLLECTION;
      const finalPrice = this.calculateFinalPrice(newPricing);
      
      const pricingWithFinal: ServicePricing = {
        ...newPricing,
        finalPrice
      };
      
      await updateDoc(doc(db, collectionName, serviceId), {
        pricing: {
          ...pricingWithFinal,
          discountValidUntil: newPricing.discountValidUntil ? Timestamp.fromDate(newPricing.discountValidUntil) : null
        },
        updatedAt: Timestamp.fromDate(new Date())
      });

      await addLog('service_pricing_updated', `${serviceType} service pricing updated for ID: ${serviceId}, New final price: ${pricingWithFinal.finalPrice} ${pricingWithFinal.currency}`);
    } catch (error) {
      console.error("Error updating service pricing:", error);
      throw error;
    }
  }

  // Service CRUD Operations
  static async createTrainingService(serviceData: Omit<EnhancedTrainingService, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const service: Omit<EnhancedTrainingService, 'id'> = {
        ...serviceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, TRAINING_SERVICES_COLLECTION), {
        ...service,
        createdAt: Timestamp.fromDate(service.createdAt),
        updatedAt: Timestamp.fromDate(service.updatedAt),
        pricing: {
          ...service.pricing,
          discountValidUntil: service.pricing.discountValidUntil ? Timestamp.fromDate(service.pricing.discountValidUntil) : null
        }
      });

      await addLog('Added Training Service', `Training service created: ${service.title} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating training service:", error);
      throw error;
    }
  }

  static async createOnlineService(serviceData: Omit<EnhancedOnlineService, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const service: Omit<EnhancedOnlineService, 'id'> = {
        ...serviceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, ONLINE_SERVICES_COLLECTION), {
        ...service,
        createdAt: Timestamp.fromDate(service.createdAt),
        updatedAt: Timestamp.fromDate(service.updatedAt),
        pricing: {
          ...service.pricing,
          discountValidUntil: service.pricing.discountValidUntil ? Timestamp.fromDate(service.pricing.discountValidUntil) : null
        }
      });

      await addLog('Added Training Service', `Online service created: ${service.title} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating online service:", error);
      throw error;
    }
  }

  static async updateTrainingService(id: string, serviceData: Partial<Omit<EnhancedTrainingService, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const updateData: any = {
        ...serviceData,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (serviceData.pricing) {
        updateData.pricing = {
          ...serviceData.pricing,
          discountValidUntil: serviceData.pricing.discountValidUntil ? Timestamp.fromDate(serviceData.pricing.discountValidUntil) : null
        };
      }

      await updateDoc(doc(db, TRAINING_SERVICES_COLLECTION, id), updateData);
      await addLog('Updated Training Service', `Training service updated: ID ${id}`);
    } catch (error) {
      console.error("Error updating training service:", error);
      throw error;
    }
  }

  static async updateOnlineService(id: string, serviceData: Partial<Omit<EnhancedOnlineService, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const updateData: any = {
        ...serviceData,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (serviceData.pricing) {
        updateData.pricing = {
          ...serviceData.pricing,
          discountValidUntil: serviceData.pricing.discountValidUntil ? Timestamp.fromDate(serviceData.pricing.discountValidUntil) : null
        };
      }

      await updateDoc(doc(db, ONLINE_SERVICES_COLLECTION, id), updateData);
      await addLog('Updated Training Service', `Online service updated: ID ${id}`);
    } catch (error) {
      console.error("Error updating online service:", error);
      throw error;
    }
  }

  static async deleteTrainingService(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, TRAINING_SERVICES_COLLECTION, id), {
        isActive: false,
        updatedAt: Timestamp.fromDate(new Date())
      });
      await addLog('Deleted Training Service', `Training service deactivated: ID ${id}`);
    } catch (error) {
      console.error("Error deleting training service:", error);
      throw error;
    }
  }

  static async deleteOnlineService(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, ONLINE_SERVICES_COLLECTION, id), {
        isActive: false,
        updatedAt: Timestamp.fromDate(new Date())
      });
      await addLog('Deleted Training Service', `Online service deactivated: ID ${id}`);
    } catch (error) {
      console.error("Error deleting online service:", error);
      throw error;
    }
  }

  // Seeding Functions
  static async seedSampleServices(): Promise<{ trainingSeeded: number; onlineSeeded: number }> {
    try {
      // Import sample data dynamically to avoid circular dependencies
      const { sampleTrainingServices, sampleOnlineServices } = await import('./sampleServiceData');
      
      let trainingSeeded = 0;
      let onlineSeeded = 0;

      // Check existing training services to avoid duplicates
      const existingTrainingServices = await this.getTrainingServices();
      const existingTrainingTitles = new Set(existingTrainingServices.map(s => s.title));

      // Check existing online services to avoid duplicates
      const existingOnlineServices = await this.getOnlineServices();
      const existingOnlineTitles = new Set(existingOnlineServices.map(s => s.title));

      // Seed training services
      for (const sampleService of sampleTrainingServices) {
        if (!existingTrainingTitles.has(sampleService.title)) {
          const { id, ...serviceData } = sampleService;
          await this.createTrainingService(serviceData);
          trainingSeeded++;
        }
      }

      // Seed online services
      for (const sampleService of sampleOnlineServices) {
        if (!existingOnlineTitles.has(sampleService.title)) {
          const { id, ...serviceData } = sampleService;
          await this.createOnlineService(serviceData);
          onlineSeeded++;
        }
      }

      await addLog('Added Training Service', `Seeded ${trainingSeeded} training services and ${onlineSeeded} online services`);

      return { trainingSeeded, onlineSeeded };
    } catch (error) {
      console.error("Error seeding sample services:", error);
      throw new Error("Failed to seed sample services: " + error);
    }
  }

  // Admin helper to reseed all services (with confirmation)
  static async reseedAllServices(force: boolean = false): Promise<{ trainingSeeded: number; onlineSeeded: number }> {
    if (!force) {
      throw new Error("Reseed operation requires force=true to confirm destructive action");
    }

    try {
      // Get all existing services
      const existingTraining = await this.getTrainingServices();
      const existingOnline = await this.getOnlineServices();

      // Deactivate existing services
      for (const service of existingTraining) {
        await this.deleteTrainingService(service.id);
      }

      for (const service of existingOnline) {
        await this.deleteOnlineService(service.id);
      }

      // Seed fresh services
      const result = await this.seedSampleServices();

      await addLog('Added Training Service', `Reseeded all services: ${result.trainingSeeded} training, ${result.onlineSeeded} online`);

      return result;
    } catch (error) {
      console.error("Error reseeding services:", error);
      throw error;
    }
  }
}
