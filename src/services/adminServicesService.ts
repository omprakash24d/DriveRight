// Enhanced Services with Admin SDK - Server-side only
import { ErrorService } from "@/lib/error-service";
import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Collection names
const TRAINING_SERVICES_COLLECTION = 'enhancedTrainingServices';
const ONLINE_SERVICES_COLLECTION = 'enhancedOnlineServices';
const LOGS_COLLECTION = 'auditLogs';

// Admin-specific audit log function
async function addAdminLog(action: string, target: string): Promise<void> {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    
    await db.collection(LOGS_COLLECTION).add({
      user: 'Admin',
      action,
      target,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    ErrorService.logError('Failed to add audit log', {
      component: 'adminServicesService',
      action: 'addAdminLog',
      metadata: { action, target }
    });
  }
}

export class AdminServicesManager {
  private static adminDb: FirebaseFirestore.Firestore | null = null;

  private static getDb(): FirebaseFirestore.Firestore {
    if (!this.adminDb) {
      const adminApp = getAdminApp();
      this.adminDb = getFirestore(adminApp);
    }
    return this.adminDb;
  }

  // Create Training Service (Admin only)
  static async createTrainingService(serviceData: any): Promise<string> {
    try {
      const db = this.getDb();
      
      // Clean up undefined values for Firestore
      const cleanedPricing = {
        basePrice: serviceData.pricing.basePrice,
        currency: serviceData.pricing.currency,
        finalPrice: serviceData.pricing.finalPrice,
        taxes: {
          gst: serviceData.pricing.taxes.gst || 0,
          serviceTax: serviceData.pricing.taxes.serviceTax || 0,
          otherCharges: serviceData.pricing.taxes.otherCharges || 0,
        },
        ...(serviceData.pricing.discountPercentage !== undefined && { 
          discountPercentage: serviceData.pricing.discountPercentage 
        }),
        ...(serviceData.pricing.discountValidUntil && { 
          discountValidUntil: Timestamp.fromDate(serviceData.pricing.discountValidUntil) 
        })
      };

      const serviceWithTimestamps = {
        ...serviceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        pricing: cleanedPricing
      };

      const docRef = await db.collection(TRAINING_SERVICES_COLLECTION).add(serviceWithTimestamps);

      await addAdminLog('Added Training Service', `Training service created: ${serviceData.title} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating training service:", error);
      throw error;
    }
  }

  // Create Online Service (Admin only)
  static async createOnlineService(serviceData: any): Promise<string> {
    try {
      const db = this.getDb();
      
      // Clean up undefined values for Firestore
      const cleanedPricing = {
        basePrice: serviceData.pricing.basePrice,
        currency: serviceData.pricing.currency,
        finalPrice: serviceData.pricing.finalPrice,
        taxes: {
          gst: serviceData.pricing.taxes.gst || 0,
          serviceTax: serviceData.pricing.taxes.serviceTax || 0,
          otherCharges: serviceData.pricing.taxes.otherCharges || 0,
        },
        ...(serviceData.pricing.discountPercentage !== undefined && { 
          discountPercentage: serviceData.pricing.discountPercentage 
        }),
        ...(serviceData.pricing.discountValidUntil && { 
          discountValidUntil: Timestamp.fromDate(serviceData.pricing.discountValidUntil) 
        })
      };

      const serviceWithTimestamps = {
        ...serviceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        pricing: cleanedPricing
      };

      const docRef = await db.collection(ONLINE_SERVICES_COLLECTION).add(serviceWithTimestamps);

      await addAdminLog('Added Online Service', `Online service created: ${serviceData.title} (ID: ${docRef.id})`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating online service:", error);
      throw error;
    }
  }

  // Update Training Service (Admin only)
  static async updateTrainingService(id: string, serviceData: any): Promise<void> {
    try {
      const db = this.getDb();
      
      const updateData: any = {
        ...serviceData,
        updatedAt: Timestamp.now()
      };

      if (serviceData.pricing) {
        const cleanedPricing = {
          basePrice: serviceData.pricing.basePrice,
          currency: serviceData.pricing.currency,
          finalPrice: serviceData.pricing.finalPrice,
          taxes: {
            gst: serviceData.pricing.taxes.gst || 0,
            serviceTax: serviceData.pricing.taxes.serviceTax || 0,
            otherCharges: serviceData.pricing.taxes.otherCharges || 0,
          },
          ...(serviceData.pricing.discountPercentage !== undefined && { 
            discountPercentage: serviceData.pricing.discountPercentage 
          }),
          ...(serviceData.pricing.discountValidUntil && { 
            discountValidUntil: Timestamp.fromDate(serviceData.pricing.discountValidUntil) 
          })
        };
        updateData.pricing = cleanedPricing;
      }

      await db.collection(TRAINING_SERVICES_COLLECTION).doc(id).update(updateData);
      await addAdminLog('Updated Training Service', `Training service updated: ID ${id}`);
    } catch (error) {
      console.error("Error updating training service:", error);
      throw error;
    }
  }

  // Update Online Service (Admin only)
  static async updateOnlineService(id: string, serviceData: any): Promise<void> {
    try {
      const db = this.getDb();
      
      const updateData: any = {
        ...serviceData,
        updatedAt: Timestamp.now()
      };

      if (serviceData.pricing) {
        const cleanedPricing = {
          basePrice: serviceData.pricing.basePrice,
          currency: serviceData.pricing.currency,
          finalPrice: serviceData.pricing.finalPrice,
          taxes: {
            gst: serviceData.pricing.taxes.gst || 0,
            serviceTax: serviceData.pricing.taxes.serviceTax || 0,
            otherCharges: serviceData.pricing.taxes.otherCharges || 0,
          },
          ...(serviceData.pricing.discountPercentage !== undefined && { 
            discountPercentage: serviceData.pricing.discountPercentage 
          }),
          ...(serviceData.pricing.discountValidUntil && { 
            discountValidUntil: Timestamp.fromDate(serviceData.pricing.discountValidUntil) 
          })
        };
        updateData.pricing = cleanedPricing;
      }

      await db.collection(ONLINE_SERVICES_COLLECTION).doc(id).update(updateData);
      await addAdminLog('Updated Online Service', `Online service updated: ID ${id}`);
    } catch (error) {
      console.error("Error updating online service:", error);
      throw error;
    }
  }

  // Delete Training Service (Admin only)
  static async deleteTrainingService(id: string): Promise<void> {
    try {
      const db = this.getDb();
      
      await db.collection(TRAINING_SERVICES_COLLECTION).doc(id).update({
        isActive: false,
        updatedAt: Timestamp.now()
      });
      
      await addAdminLog('Deleted Training Service', `Training service deactivated: ID ${id}`);
    } catch (error) {
      console.error("Error deleting training service:", error);
      throw error;
    }
  }

  // Delete Online Service (Admin only)
  static async deleteOnlineService(id: string): Promise<void> {
    try {
      const db = this.getDb();
      
      await db.collection(ONLINE_SERVICES_COLLECTION).doc(id).update({
        isActive: false,
        updatedAt: Timestamp.now()
      });
      
      await addAdminLog('Deleted Online Service', `Online service deactivated: ID ${id}`);
    } catch (error) {
      console.error("Error deleting online service:", error);
      throw error;
    }
  }
}
