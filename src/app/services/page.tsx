import { Breadcrumb } from "@/components/Breadcrumb";
import {
  generateLocalBusinessSchema,
  generateOrganizationSchema,
} from "@/lib/seo-utils";
import { getSiteSettings } from "@/services/settingsService";
import { getTestimonials } from "@/services/testimonialsService";
import type { Metadata } from "next";
import { DrivingTipsBlog } from "./_components/DrivingTipsBlog";
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

  // Fetch testimonials from Firebase
  let testimonials: any[] = [];
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

        {/* Service Sections */}
        <div className="container mx-auto px-4 md:px-6 py-16 space-y-20">
          {/* Basic Service Information */}
          <section className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Our Driving Training Programs
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-blue-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  MCWG Training
                </h3>
                <p className="text-blue-700">
                  Motorcycle training focusing on balance, safety, and traffic
                  navigation. Perfect for beginners and experienced riders
                  looking to get licensed.
                </p>
              </div>
              <div className="bg-green-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-green-900 mb-4">
                  LMV Training
                </h3>
                <p className="text-green-700">
                  Complete car driving course for light motor vehicles. Learn
                  from certified instructors with modern fleet vehicles.
                </p>
              </div>
              <div className="bg-orange-50 p-8 rounded-xl">
                <h3 className="text-xl font-bold text-orange-900 mb-4">
                  HMV Training
                </h3>
                <p className="text-orange-700">
                  Heavy vehicle training for commercial drivers. Build your
                  career in transport and logistics industry.
                </p>
              </div>
            </div>
          </section>

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
