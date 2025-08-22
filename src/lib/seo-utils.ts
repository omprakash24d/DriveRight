// lib/seo-utils.ts - SEO utilities and schema markup generators

import { schoolConfig } from './config';
import { getPriceInfo } from "./priceUtils";

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

export interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization" | "EducationalOrganization";
  name: string;
  description: string;
  url: string;
  logo: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  contactPoint: {
    "@type": "ContactPoint";
    telephone: string;
    contactType: "customer service";
    email: string;
  };
  sameAs: string[];
}

export interface CourseSchema {
  "@context": "https://schema.org";
  "@type": "Course";
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  url: string;
  courseCode?: string;
  educationalLevel?: string;
  teaches?: string[];
  timeRequired?: string;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

export interface LocalBusinessSchema {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  "@id": string;
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    "@type": "PostalAddress";
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  openingHours: string[];
  priceRange: string;
  image: string[];
  sameAs: string[];
  serviceArea: {
    "@type": "Place";
    name: string;
  };
  hasOfferCatalog: {
    "@type": "OfferCatalog";
    name: string;
    itemListElement: Array<{
      "@type": "Offer";
      itemOffered: {
        "@type": "Service";
        name: string;
        description: string;
      };
    }>;
  };
}

export interface FAQSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateOrganizationSchema(settings: any): OrganizationSchema {
  const baseUrl = schoolConfig.appBaseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: settings.schoolName,
    description: `Professional driving school in Arwal, Bihar offering comprehensive driving lessons for cars, motorcycles, and heavy vehicles.`,
    url: baseUrl,
    logo: `${baseUrl}/images/logo.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.contactAddress || "Jinpura Near Police line and collectorate, Arwal Sipah Panchayat",
      addressLocality: "Arwal",
      addressRegion: "Bihar",
      addressCountry: "IN"
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: settings.contactPhone || "+91-9876543210",
      contactType: "customer service",
      email: settings.contactEmail || "contact@drivingschoolarwal.in"
    },
    sameAs: [
      `https://facebook.com/${settings.schoolName?.toLowerCase().replace(/\s+/g, '')}`,
      `https://instagram.com/${settings.schoolName?.toLowerCase().replace(/\s+/g, '')}`,
    ]
  };
}

export function generateLocalBusinessSchema(settings: any): LocalBusinessSchema {
  const baseUrl = schoolConfig.appBaseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}#business`,
    name: settings.schoolName,
    description: "Professional driving school offering comprehensive training for safe driving in Arwal, Bihar",
    url: baseUrl,
    telephone: settings.contactPhone || "+91-9876543210",
    email: settings.contactEmail || "contact@drivingschoolarwal.in",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.contactAddress || "Jinpura Near Police line and collectorate",
      addressLocality: "Arwal",
      addressRegion: "Bihar",
      postalCode: "804401",
      addressCountry: "IN"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 25.2544, // Approximate coordinates for Arwal
      longitude: 84.6806
    },
    openingHours: [
      "Mo-Sa 09:00-18:00"
    ],
    priceRange: "₹₹",
    image: [
      `${baseUrl}/images/1.jpeg`,
      `${baseUrl}/images/2.jpeg`,
      `${baseUrl}/images/3.jpeg`
    ],
    sameAs: [
      `https://facebook.com/${settings.schoolName?.toLowerCase().replace(/\s+/g, '')}`,
      `https://instagram.com/${settings.schoolName?.toLowerCase().replace(/\s+/g, '')}`
    ],
    serviceArea: {
      "@type": "Place",
      name: "Arwal, Bihar, India"
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Driving Courses",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "LMV (Car) Training",
            description: "Comprehensive car driving lessons for light motor vehicles"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "MCWG (Motorcycle) Training",
            description: "Professional motorcycle riding lessons for two-wheelers"
          }
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "HMV (Heavy Vehicle) Training",
            description: "Advanced training for heavy motor vehicles and commercial driving"
          }
        }
      ]
    }
  };
}

export function generateCourseSchema(course: any, schoolName: string): CourseSchema {
  const baseUrl = schoolConfig.appBaseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: schoolName,
      url: baseUrl
    },
    url: `${baseUrl}/courses/${course.id}`,
    courseCode: course.id,
    educationalLevel: "Beginner to Advanced",
    teaches: course.features || [],
    timeRequired: course.duration || "4-6 weeks",
    offers: {
      "@type": "Offer",
      price: String(getPriceInfo(course.price).numericPrice),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock"
    }
  };
}

export function generateBreadcrumbSchema(items: Array<{name: string, url: string}>): BreadcrumbSchema {
  const baseUrl = schoolConfig.appBaseUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`
    }))
  };
}

export function generateFAQSchema(faqs: Array<{question: string, answer: string}>): FAQSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

// SEO optimization utilities
export function optimizeTitle(title: string, schoolName: string, maxLength: number = 60): string {
  const fullTitle = `${title} | ${schoolName}`;
  if (fullTitle.length <= maxLength) return fullTitle;
  
  // If too long, try without school name
  if (title.length <= maxLength) return title;
  
  // Truncate and add ellipsis
  return `${title.substring(0, maxLength - 3)}...`;
}

export function optimizeDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) return description;
  
  const truncated = description.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 ? `${truncated.substring(0, lastSpace)}...` : `${truncated}...`;
}

export function generateCanonicalUrl(path: string): string {
  const baseUrl = schoolConfig.appBaseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

// Common SEO keywords for driving schools
export const DRIVING_SCHOOL_KEYWORDS = [
  'driving school',
  'driving lessons',
  'learn to drive',
  'driving instructor',
  'driving course',
  'driving license',
  'driving test',
  'car driving',
  'motorcycle training',
  'heavy vehicle training',
  'driving school Arwal',
  'driving school Bihar',
  'LMV training',
  'MCWG training',
  'HMV training',
  'defensive driving',
  'road safety',
  'driving education'
];

export function generatePageKeywords(pageKeywords: string[], location: string = 'Arwal'): string[] {
  const locationKeywords = [
    `driving school ${location}`,
    `driving lessons ${location}`,
    `learn to drive ${location}`,
    `driving instructor ${location}`
  ];
  
  return [...new Set([...pageKeywords, ...locationKeywords, ...DRIVING_SCHOOL_KEYWORDS])];
}
