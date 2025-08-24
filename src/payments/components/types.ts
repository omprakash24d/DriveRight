// Shared types for service components

// Import enhanced service types
import {
  EnhancedOnlineService,
  EnhancedTrainingService,
} from "@/services/enhancedServicesService";

// Core service pricing interface
export interface ServicePricing {
  basePrice: number;
  finalPrice: number;
  currency: string;
  discountPercentage?: number;
  discountValidUntil?: Date;
  taxes?: number;
}

// Core service interface
export interface Service {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  duration: string | { value: number; unit: string };
  category: string;
  pricing: ServicePricing;
  isActive: boolean;
  features?: string[];
  tags?: string[];
  icon?: string;
  image?: string;
  metadata?: Record<string, any>;
}

// Training-specific service interface
export interface TrainingService extends Service {
  type: 'training';
  vehicleType?: string;
  instructorLevel?: 'beginner' | 'intermediate' | 'advanced';
  location?: string;
  capacity?: number;
}

// Online service interface
export interface OnlineService extends Service {
  type: 'online';
  accessDuration?: string;
  downloadable?: boolean;
  certificateProvided?: boolean;
  prerequisites?: string[];
}

// Union type for all services - use Enhanced types from service layer with better discrimination
export type AnyService = EnhancedTrainingService | EnhancedOnlineService;

// Type guard functions for safe type discrimination
export function isEnhancedTrainingService(service: AnyService): service is EnhancedTrainingService {
  return 'instructorRequired' in service && 'duration' in service && 'maxStudents' in service;
}

export function isEnhancedOnlineService(service: AnyService): service is EnhancedOnlineService {
  return 'processingTime' in service && 'deliveryMethod' in service && 'automatedProcessing' in service;
}

export interface BookingFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  scheduledDate?: string;
  notes?: string;
}

export interface ValidationErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  scheduledDate?: string;
  notes?: string;
}

export interface ServiceCardProps {
  service: AnyService;
  type: 'training' | 'online';
  index?: number;
}

export interface PaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  prefill: any;
  theme: any;
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}
