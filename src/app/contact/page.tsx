import { Breadcrumb, BREADCRUMB_CONFIGS } from "@/components/Breadcrumb";
import {
  generateFAQSchema,
  generateLocalBusinessSchema,
} from "@/lib/seo-utils";
import { getSiteSettings } from "@/services/settingsService";
import type { Metadata } from "next";
import { ContactForm } from "./_components/ContactForm";
import { ContactInfo } from "./_components/ContactInfo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Contact Us - Get in Touch",
    description: `Contact ${settings.schoolName} for driving course inquiries, enrollment assistance, or any questions about our services. We're here to help you start your driving journey in Arwal, Bihar. Call, email, or visit us today.`,
    keywords: [
      "contact driving school Arwal",
      "driving school phone number",
      "driving school address Bihar",
      "enrollment inquiry",
      "driving course information",
      "driving school location Arwal",
      "get driving license help",
      "driving instructor contact",
    ],
    openGraph: {
      title: `Contact ${settings.schoolName}`,
      description: `Get in touch with our friendly team for any driving course questions or enrollment assistance.`,
      type: "website",
    },
    alternates: {
      canonical: "/contact",
    },
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

  // Local Business Schema for contact page
  const localBusinessSchema = generateLocalBusinessSchema(settings);

  // FAQ Schema for contact-related questions
  const contactFAQs = [
    {
      question: "What are your office hours?",
      answer:
        "We are open Monday to Saturday from 9:00 AM to 6:00 PM. Sunday by appointment only.",
    },
    {
      question: "How can I enroll in a driving course?",
      answer:
        "You can enroll online through our website, call us directly, or visit our office in Arwal. We'll guide you through the entire process.",
    },
    {
      question: "Do you offer free consultations?",
      answer:
        "Yes, we offer free consultations to help you choose the right driving course based on your needs and experience level.",
    },
    {
      question: "What documents do I need to bring for enrollment?",
      answer:
        "Please bring a valid ID proof, address proof, passport-size photographs, and any existing driving license (if applicable).",
    },
  ];

  const faqSchema = generateFAQSchema(contactFAQs);

  return (
    <>
      {/* Structured Data */}
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

      <main className="min-h-screen w-full bg-muted/40 p-4 py-12 sm:p-6 md:p-8">
        <div className="container mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-8">
            <Breadcrumb items={BREADCRUMB_CONFIGS.contact} />
          </div>

          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold tracking-tight mb-4">
                Get In Touch
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                We&apos;d love to hear from you. Reach out with any questions or
                to get started on your driving journey with expert guidance and
                support.
              </p>
              <ContactInfo settings={settings} />
            </div>
            <div className="lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
