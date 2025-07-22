import { getInstructors } from "@/services/instructorsService";
import { getSiteSettings } from "@/services/settingsService";
import { getTestimonials } from "@/services/testimonialsService";
import type { Metadata } from "next";

import { CtaSection } from "@/app/(home)/_components/CtaSection";
import { TestimonialsSection } from "@/app/(home)/_components/TestimonialsSection";
import { WhyChooseUs } from "@/app/(home)/_components/WhyChooseUs";
import { Breadcrumb, BREADCRUMB_CONFIGS } from "@/components/Breadcrumb";
import { generateFAQSchema, generateOrganizationSchema } from "@/lib/seo-utils";
import { AboutHeader } from "./_components/AboutHeader";
import { StatsSection } from "./_components/StatsSection";
import { TeamSection } from "./_components/TeamSection";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "About Us - Professional Driving Education",
    description: `Learn about ${settings.schoolName}, our mission to provide safe and comprehensive driving education in Arwal, Bihar. Meet our certified instructors, discover our values, and understand why thousands trust us for their driving education needs.`,
    keywords: [
      "about driving school Arwal",
      "driving school history Bihar",
      "certified driving instructors",
      "professional driving education",
      "driving school mission",
      "safe driving training",
      "driving school team",
      "experienced driving instructors",
      "driving education philosophy",
    ],
    openGraph: {
      title: `About ${settings.schoolName}`,
      description: `Professional driving education with experienced instructors and proven methods. Learn why we're Arwal's trusted driving school.`,
      type: "website",
    },
    alternates: {
      canonical: "/about",
    },
  };
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const instructors = await getInstructors();
  const testimonials = await getTestimonials();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

  // Organization Schema
  const organizationSchema = generateOrganizationSchema(settings);

  // FAQ Schema for About page
  const aboutFAQs = [
    {
      question: "How long has the driving school been operating?",
      answer: `${settings.schoolName} has been providing professional driving education in Arwal, Bihar for several years, building a strong reputation for quality training and safety.`,
    },
    {
      question: "What makes your driving school different?",
      answer:
        "We focus on comprehensive safety training, use modern teaching methods, provide personalized attention, and have certified instructors with years of experience.",
    },
    {
      question: "Are your instructors certified?",
      answer:
        "Yes, all our instructors are certified professionals with extensive training in road safety, defensive driving techniques, and effective teaching methods.",
    },
    {
      question: "What is your success rate?",
      answer:
        "We maintain a high success rate with most students passing their driving tests on the first attempt, thanks to our comprehensive training approach.",
    },
  ];

  const faqSchema = generateFAQSchema(aboutFAQs);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="flex flex-col">
        {/* Breadcrumb Navigation */}
        <div className="container mx-auto px-4 md:px-6 pt-8">
          <Breadcrumb items={BREADCRUMB_CONFIGS.about} />
        </div>

        <AboutHeader settings={settings} />
        <StatsSection stats={settings.homepageStats} />
        <WhyChooseUs
          settings={settings}
          whyChooseUsPoints={settings.whyChooseUsPoints}
        />
        <TeamSection instructors={instructors} />
        <TestimonialsSection testimonials={testimonials} />
        <CtaSection />
      </div>
    </>
  );
}
