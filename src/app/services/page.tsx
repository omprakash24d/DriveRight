import { Breadcrumb } from "@/components/Breadcrumb";
import {
  generateLocalBusinessSchema,
  generateOrganizationSchema,
} from "@/lib/seo-utils";
import {
  getOnlineServices,
  getTrainingServices,
} from "@/services/quickServicesService";
import { getSiteSettings } from "@/services/settingsService";
import { getTestimonials } from "@/services/testimonialsService";
import type { Metadata } from "next";
import { DrivingTipsBlog } from "./_components/DrivingTipsBlog";
import { ServiceCards } from "./_components/ServiceCards";
import { ServicesHero } from "./_components/ServicesHero";
import { ServicesTestimonials } from "./_components/ServicesTestimonials";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title:
      "Driving Services - Government Authorized Driving School | MCWG, LMV & HMV Courses",
    description: `Comprehensive driving services at ${settings.schoolName}. Government authorized driving school offering MCWG motorcycle training, LMV car courses, HMV heavy vehicle training, and online license services in Arwal, Bihar. Apply for driving license online today.`,
    keywords: [
      "driving school services",
      "government authorized driving school",
      "apply for driving license online",
      "MCWG training Arwal",
      "LMV driving course Bihar",
      "HMV heavy vehicle training",
      "motorcycle training Arwal",
      "driving license application",
      "certified driving instructors",
      "driving test preparation",
      "online driving services",
      "driving school Arwal Bihar",
    ],
    openGraph: {
      title: `Complete Driving Services | ${settings.schoolName}`,
      description:
        "Government authorized driving school offering comprehensive MCWG, LMV & HMV training courses. Apply for your driving license online with expert instructors.",
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: "Complete Driving Services - Government Authorized",
      description:
        "MCWG, LMV & HMV training courses with certified instructors. Apply online today!",
    },
    alternates: {
      canonical: "/services",
    },
  };
}

export default async function ServicesPage() {
  const settings = await getSiteSettings();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

  // Fetch services data from Firebase
  let trainingServices: any[] = [];
  let onlineServices: any[] = [];
  let testimonials: any[] = [];

  try {
    trainingServices = await getTrainingServices();
  } catch (error) {
    console.error("Error fetching training services:", error);
    // Fallback data
    trainingServices = [
      {
        id: "1",
        icon: "Truck",
        title: "Heavy Motor Training",
        description:
          "Comprehensive training for heavy vehicles including trucks and buses, preparing you for professional driving.",
        services: [
          "New Enrollment",
          "HMV Training Only",
          "Refresher Course",
          "License Renewal",
        ],
        ctaText: "Enroll in HMV",
        ctaHref: "/enroll?vehicleType=hmv",
      },
      {
        id: "2",
        icon: "Car",
        title: "LMV Training",
        description:
          "Everything you need to get your Light Motor Vehicle license, from learning to test.",
        services: [
          "New Enrollment",
          "LMV Training",
          "LMV Learning",
          "LMV Driving License",
        ],
        ctaText: "Enroll in LMV",
        ctaHref: "/enroll?vehicleType=lmv",
      },
      {
        id: "3",
        icon: "Bike",
        title: "Motorcycle Training",
        description:
          "Specialized training for two-wheelers, focusing on balance, safety, and traffic navigation.",
        services: [
          "MCWG New Application",
          "Balance & Control",
          "Safety Protocols",
          "On-road Practice",
        ],
        ctaText: "Enroll in MCWG",
        ctaHref: "/enroll?vehicleType=mcwg",
      },
    ];
  }

  try {
    onlineServices = await getOnlineServices();
  } catch (error) {
    console.error("Error fetching online services:", error);
    // Fallback data
    onlineServices = [
      {
        id: "1",
        icon: "FileCheck2",
        title: "Learning License Exam Pass",
        description:
          "Get your LL test passed online. Enter your application number, DOB, and phone to have our team assist you.",
        ctaText: "Check LL Status",
        href: "/ll-exam-pass",
      },
      {
        id: "2",
        icon: "Printer",
        title: "Driving License Print",
        description:
          "Request a print-ready copy of your official driving license via email for any class of vehicle.",
        ctaText: "Request License Print",
        href: "/license-print",
      },
      {
        id: "3",
        icon: "Download",
        title: "Certificate Download",
        description:
          "Passed your test? Download your official driving school document here.",
        ctaText: "Download Certificate",
        href: "/certificate/download",
      },
      {
        id: "4",
        icon: "BadgeCheck",
        title: "Verify Certificate",
        description:
          "Verify the authenticity of any certificate issued by Driving School Arwal.",
        ctaText: "Verify Certificate",
        href: "/certificate/verify",
      },
    ];
  }

  // Fetch testimonials from Firebase
  try {
    testimonials = await getTestimonials();
    // Transform Firebase testimonials to match our component interface
    testimonials = testimonials.map((testimonial: any) => ({
      id: testimonial.id,
      name: testimonial.name,
      course: testimonial.course,
      rating: 5, // Default rating since not in original schema
      text: testimonial.quote,
      location: "Arwal, Bihar", // Default location
      date: new Date().toISOString(), // Default to current date
      verified: true,
    }));
  } catch (error) {
    console.error("Error fetching testimonials:", error);
  }

  // Structured Data Schemas
  const organizationSchema = generateOrganizationSchema(settings);
  const localBusinessSchema = generateLocalBusinessSchema(settings);

  // Service Schema for driving courses
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Comprehensive Driving Training Services",
    description:
      "Government authorized driving school offering MCWG, LMV, and HMV training courses",
    provider: {
      "@type": "EducationalOrganization",
      "@id": `${appBaseUrl}#organization`,
      name: settings.schoolName,
      url: appBaseUrl,
    },
    areaServed: {
      "@type": "Place",
      name: "Arwal, Bihar, India",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Driving Training Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "EducationalService",
            name: "MCWG Motorcycle Training",
            description:
              "Comprehensive motorcycle training focusing on balance, safety, and traffic navigation",
            educationalLevel: "Beginner to Advanced",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "EducationalService",
            name: "LMV Car Training",
            description:
              "Complete light motor vehicle training for cars and small vehicles",
            educationalLevel: "Beginner to Advanced",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "EducationalService",
            name: "HMV Heavy Vehicle Training",
            description:
              "Professional heavy motor vehicle training for commercial drivers",
            educationalLevel: "Intermediate to Advanced",
          },
        },
      ],
    },
  };

  // Breadcrumb configuration for services page
  const breadcrumbItems = [
    { name: "Our Services", url: "/services", current: true },
  ];

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />

      <main className="min-h-screen">
        {/* Breadcrumb Navigation */}
        <div className="container mx-auto px-4 md:px-6 pt-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <ServicesHero settings={settings} />

        {/* Service Cards */}
        <ServiceCards
          trainingServices={trainingServices}
          onlineServices={onlineServices}
        />

        {/* Service Sections */}
        <div className="container mx-auto px-4 md:px-6 py-16 space-y-20">
          {/* Testimonials Section */}
          <section id="testimonials" aria-labelledby="testimonials-heading">
            <ServicesTestimonials testimonials={testimonials} />
          </section>

          {/* Blog Section */}
          <section id="driving-tips" aria-labelledby="blog-heading">
            <DrivingTipsBlog />
          </section>
        </div>
      </main>
    </>
  );
}
