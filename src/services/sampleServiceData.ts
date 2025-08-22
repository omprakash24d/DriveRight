// Sample Enhanced Services Data for Testing
import { EnhancedOnlineService, EnhancedTrainingService } from './enhancedServicesService';

export const sampleTrainingServices: EnhancedTrainingService[] = [
  {
    id: 'training-lmv-basic',
    title: 'LMV Training (Basic)',
    description: 'Comprehensive Light Motor Vehicle (LMV) training program for beginners. Learn the fundamentals of safe driving with our experienced instructors.',
    shortDescription: 'Complete LMV training for beginners with hands-on experience',
    icon: 'Car',
    category: 'LMV',
    services: [
      'Theory classes for traffic rules',
      'Practical driving sessions',
      'Parking and maneuvering techniques',
      'Highway driving experience',
      'Mock test preparations'
    ],
    duration: {
      value: 30,
      unit: 'days'
    },
    pricing: {
      basePrice: 6000,
      currency: 'INR',
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0
      },
      finalPrice: 6000
    },
    features: [
      'Experienced instructors',
      'Dual control vehicles',
      'Flexible timings',
      'Certificate of completion',
      'Free pickup and drop'
    ],
    prerequisites: ['Valid Learner\'s License', 'Age 18+'],
    certification: 'DriveRight Training Certificate',
    instructorRequired: true,
    maxStudents: 1,
    ctaHref: '/training/lmv-basic',
    ctaText: 'Book Now',
    isActive: true,
    priority: 1,
    bookingSettings: {
      requireApproval: false,
      allowRescheduling: true,
      cancellationPolicy: 'Free cancellation up to 24 hours before the session',
      advanceBookingDays: 3
    },
    seoMetadata: {
      metaTitle: 'LMV Training - Learn Car Driving | DriveRight',
      metaDescription: 'Professional LMV training with experienced instructors. Learn car driving safely with our comprehensive training program.',
      keywords: ['LMV training', 'car driving lessons', 'driving school', 'learn driving']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'training-hmv-advanced',
    title: 'HMV Training (Heavy Motor Vehicle)',
    description: 'Professional Heavy Motor Vehicle training for commercial driving licenses. Learn to operate trucks, buses and other heavy vehicles safely.',
    shortDescription: 'Complete HMV training for commercial vehicle licensing',
    icon: 'Truck',
    category: 'HMV',
    services: [
      'Heavy vehicle operation training',
      'Commercial driving techniques',
      'Load management and safety',
      'Highway and city driving',
      'Vehicle maintenance basics'
    ],
    duration: {
      value: 45,
      unit: 'days'
    },
    pricing: {
      basePrice: 11000,
      currency: 'INR',
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0
      },
      finalPrice: 11000
    },
    features: [
      'Professional instructors',
      'Heavy vehicle practice',
      'Commercial license prep',
      'Safety certification',
      'Job placement assistance'
    ],
    prerequisites: ['Valid LMV License', 'Age 20+', 'Medical fitness certificate'],
    certification: 'HMV Training Certificate',
    instructorRequired: true,
    maxStudents: 2,
    ctaHref: '/training/hmv-advanced',
    ctaText: 'Enroll Now',
    isActive: true,
    priority: 2,
    bookingSettings: {
      requireApproval: true,
      allowRescheduling: true,
      cancellationPolicy: 'Cancellation fee applies after 48 hours',
      advanceBookingDays: 7
    },
    seoMetadata: {
      metaTitle: 'HMV Training - Heavy Vehicle Driving | DriveRight',
      metaDescription: 'Professional HMV training for commercial vehicles. Learn truck and bus driving with certified instructors.',
      keywords: ['HMV training', 'heavy vehicle driving', 'commercial license', 'truck driving']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'training-mcwg-advanced',
    title: 'MCWG Training (Motorcycle with Gear)',
    description: 'Motor Cycle With Gear training for geared motorcycle licenses. Master motorcycle riding techniques and safety measures.',
    shortDescription: 'Complete MCWG training for geared motorcycles',
    icon: 'Bike',
    category: 'MCWG',
    services: [
      'Geared motorcycle operation',
      'Clutch and gear management',
      'Traffic navigation skills',
      'Safety riding techniques',
      'Emergency handling'
    ],
    duration: {
      value: 2,
      unit: 'weeks'
    },
    pricing: {
      basePrice: 5000,
      currency: 'INR',
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0
      },
      finalPrice: 5000
    },
    features: [
      'Professional riding instructors',
      'Safety gear provided',
      'Practical training sessions',
      'Traffic rule education',
      'Safety certification'
    ],
    prerequisites: ['Valid Learner\'s License', 'Age 16+'],
    certification: 'MCWG Training Certificate',
    instructorRequired: true,
    maxStudents: 4,
    ctaHref: '/training/mcwg-advanced',
    ctaText: 'Enroll Now',
    isActive: true,
    priority: 3,
    bookingSettings: {
      requireApproval: false,
      allowRescheduling: true,
      cancellationPolicy: 'Free cancellation up to 24 hours before the session',
      advanceBookingDays: 3
    },
    seoMetadata: {
      metaTitle: 'MCWG Training - Motorcycle with Gear | DriveRight',
      metaDescription: 'Professional MCWG training for geared motorcycles. Learn safe riding with certified instructors.',
      keywords: ['MCWG training', 'motorcycle riding', 'geared bike', 'motorcycle safety']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'training-refresher-course',
    title: 'Refresher Course',
    description: 'Refresher training for licensed drivers who want to improve their driving skills or regain confidence on the road.',
    shortDescription: 'Refresher training to boost your driving confidence',
    icon: 'Car',
    category: 'Refresher',
    services: [
      'Skill assessment and improvement',
      'Confidence building sessions',
      'Updated traffic rules',
      'Parking practice',
      'Defensive driving techniques'
    ],
    duration: {
      value: 1,
      unit: 'weeks'
    },
    pricing: {
      basePrice: 3500,
      currency: 'INR',
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0
      },
      finalPrice: 3500
    },
    features: [
      'Personalized training',
      'Flexible scheduling',
      'Expert instructors',
      'Confidence building',
      'Modern techniques'
    ],
    prerequisites: ['Valid Driving License'],
    certification: 'Refresher Training Certificate',
    instructorRequired: true,
    maxStudents: 1,
    ctaHref: '/training/refresher-course',
    ctaText: 'Book Now',
    isActive: true,
    priority: 4,
    bookingSettings: {
      requireApproval: false,
      allowRescheduling: true,
      cancellationPolicy: 'Free cancellation up to 24 hours before the session',
      advanceBookingDays: 1
    },
    seoMetadata: {
      metaTitle: 'Refresher Driving Course | DriveRight',
      metaDescription: 'Refresher driving course to improve skills and regain confidence. Personalized training with expert instructors.',
      keywords: ['refresher course', 'driving improvement', 'confidence building', 'skill enhancement']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

export const sampleOnlineServices: EnhancedOnlineService[] = [
  {
    id: 'online-dl-printout',
    title: 'DL Printout Service',
    description: 'Get official printout of your Driving License with proper formatting and verification. High-quality print service.',
    shortDescription: 'Official DL printout with verification',
    icon: 'Printer',
    category: 'Document',
    pricing: {
      basePrice: 450,
      currency: 'INR',
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0
      },
      finalPrice: 450
    },
    processingTime: {
      value: 30,
      unit: 'minutes'
    },
    requiredDocuments: [
      'DL Number',
      'Date of Birth',
      'Mobile Number (registered)'
    ],
    deliveryMethod: 'physical',
    features: [
      'Official format printout',
      'High-quality paper',
      'Verification included',
      'Same day service',
      'Secure process'
    ],
    href: '/services/dl-printout',
    ctaText: 'Order Printout',
    isActive: true,
    priority: 1,
    automatedProcessing: false,
    requiresVerification: true,
    seoMetadata: {
      metaTitle: 'DL Printout Service | DriveRight',
      metaDescription: 'Get official driving license printout with verification. High-quality print service available.',
      keywords: ['DL printout', 'driving license print', 'official printout', 'license copy']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'online-license-download',
    title: 'License Download (Free)',
    description: 'Download your driving license document digitally for free. Instant download with official verification.',
    shortDescription: 'Free digital license download service',
    icon: 'Download',
    category: 'Download',
    pricing: {
      basePrice: 0,
      currency: 'INR',
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0
      },
      finalPrice: 0
    },
    processingTime: {
      value: 2,
      unit: 'minutes'
    },
    requiredDocuments: [
      'DL Number',
      'Date of Birth',
      'Registered Mobile Number'
    ],
    deliveryMethod: 'download',
    features: [
      'Instant download',
      'Free of cost',
      'Official verification',
      'Multiple format options',
      'High resolution'
    ],
    href: '/services/license-download',
    ctaText: 'Download Free',
    isActive: true,
    priority: 2,
    automatedProcessing: true,
    requiresVerification: true,
    seoMetadata: {
      metaTitle: 'Free License Download | DriveRight',
      metaDescription: 'Download your driving license for free. Instant digital download with official verification.',
      keywords: ['free license download', 'DL download', 'digital license', 'free service']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'online-certificate-verification',
    title: 'Certificate Verification',
    description: 'Verify the authenticity of driving certificates and licenses. Quick online verification service.',
    shortDescription: 'Verify driving certificates and licenses online',
    icon: 'BadgeCheck',
    category: 'Verification',
    pricing: {
      basePrice: 200,
      currency: 'INR',
      taxes: {
        gst: 0,
        serviceTax: 0,
        otherCharges: 0
      },
      finalPrice: 200
    },
    processingTime: {
      value: 2,
      unit: 'hours'
    },
    requiredDocuments: [
      'Certificate copy',
      'ID proof',
      'Contact details'
    ],
    deliveryMethod: 'email',
    features: [
      'Official verification',
      'Digital certificate',
      'Fast processing',
      'Detailed report',
      'Legal compliance'
    ],
    href: '/services/certificate-verification',
    ctaText: 'Verify Now',
    isActive: true,
    priority: 3,
    automatedProcessing: false,
    requiresVerification: true,
    seoMetadata: {
      metaTitle: 'Certificate Verification Online | DriveRight',
      metaDescription: 'Verify driving certificates and licenses online. Official verification service with detailed reports.',
      keywords: ['certificate verification', 'license verification', 'driving certificate', 'verify DL']
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

export const serviceCategories = {
  training: ['LMV', 'MCWG', 'HMV', 'Special', 'Refresher'],
  online: ['Document', 'Verification', 'Download', 'Inquiry', 'Application']
};

export const paymentMethods = ['razorpay', 'upi', 'card', 'netbanking'];
export const deliveryMethods = ['email', 'download', 'portal', 'physical'];
export const currencies = ['INR', 'USD'];
export const timeUnits = ['minutes', 'hours', 'days', 'weeks', 'months'];
