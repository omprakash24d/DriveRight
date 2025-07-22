import {
  generateFAQSchema,
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
import { AboutSection } from "./(home)/_components/AboutSection";
import { CtaSection } from "./(home)/_components/CtaSection";
import { DeveloperNoteSection } from "./(home)/_components/DeveloperNoteSection";
import { GallerySection } from "./(home)/_components/GallerySection";
import { HeroSection } from "./(home)/_components/HeroSection";
import { LocationSection } from "./(home)/_components/LocationSection";
import { QuickServices } from "./(home)/_components/QuickServices";
import { TestimonialsSection } from "./(home)/_components/TestimonialsSection";
import { VideoSection } from "./(home)/_components/VideoSection";
import { WhyChooseUs } from "./(home)/_components/WhyChooseUs";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: `${settings.schoolName} - Professional Driving School in Arwal, Bihar`,
    description: `Learn to drive safely with ${settings.schoolName}, the leading driving school in Arwal, Bihar. Expert instructors, modern vehicles, and comprehensive courses for cars, motorcycles, and heavy vehicles. Enroll online today!`,
    keywords: [
      "driving school Arwal",
      "driving lessons Bihar",
      "learn to drive Arwal",
      "driving instructor Bihar",
      "LMV training Arwal",
      "MCWG course Bihar",
      "HMV training",
      "driving license test",
      "professional driving school",
      "road safety training",
      settings.schoolName,
    ],
    openGraph: {
      title: `${settings.schoolName} - Your Path to Safe Driving`,
      description: `Professional driving education in Arwal, Bihar. Join thousands who learned to drive safely with our expert instructors and modern training methods.`,
      type: "website",
      locale: "en_IN",
      siteName: settings.schoolName,
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.schoolName} - Professional Driving School`,
      description:
        "Expert driving education in Arwal, Bihar. LMV, MCWG, and HMV courses available.",
    },
    alternates: {
      canonical: "/",
    },
  };
}

// Note: Metadata is now handled in layout.tsx for a centralized approach

export default async function Home() {
  const settings = await getSiteSettings();
  const testimonials = await getTestimonials();
  const trainingServices = await getTrainingServices();
  const onlineServices = await getOnlineServices();

  // Generate structured data
  const organizationSchema = generateOrganizationSchema(settings);
  const localBusinessSchema = generateLocalBusinessSchema(settings);

  // FAQ Schema for homepage
  const faqData = [
    {
      question: "What types of driving courses do you offer?",
      answer: `We offer comprehensive driving courses including LMV (Light Motor Vehicle/Car), MCWG (Motorcycle Without Gear), and HMV (Heavy Motor Vehicle) training programs.`,
    },
    {
      question: "How long does it take to complete a driving course?",
      answer:
        "Most of our courses take 4-6 weeks to complete, depending on the type of vehicle and your learning pace. We offer flexible scheduling to accommodate your needs.",
    },
    {
      question: "Do you provide pickup and drop services?",
      answer:
        "Yes, we provide convenient pickup and drop services within Arwal city limits for our enrolled students.",
    },
    {
      question: "What is the minimum age requirement for driving courses?",
      answer:
        "For LMV (car) training, the minimum age is 18 years. For MCWG (motorcycle), you can start at 16 years with parental consent.",
    },
  ];

  const faqSchema = generateFAQSchema(faqData);

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="flex flex-col">
        <HeroSection settings={settings} />
        <QuickServices
          settings={settings}
          trainingServices={trainingServices}
          onlineServices={onlineServices}
        />
        <WhyChooseUs
          settings={settings}
          whyChooseUsPoints={settings.whyChooseUsPoints}
        />
        <GallerySection settings={settings} />
        <AboutSection settings={settings} />
        <LocationSection settings={settings} />
        <TestimonialsSection testimonials={testimonials} />
        <VideoSection settings={settings} />
        <DeveloperNoteSection settings={settings} />
        <CtaSection />
      </div>
    </>
  );
}
