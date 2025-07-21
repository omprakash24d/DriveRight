import { getSiteSettings } from "@/services/settingsService";
import type { Metadata } from "next";
import { ContactForm } from "./_components/ContactForm";
import { ContactInfo } from "./_components/ContactInfo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Contact Us",
    description: `Get in touch with ${settings.schoolName}. Contact us for any questions about courses, enrollment, or other services. We are here to help!`,
  };
}

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <main className="min-h-screen w-full bg-muted/40 p-4 py-12 sm:p-6 md:p-8">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight">Get In Touch</h1>
            <p className="text-muted-foreground mt-2">
              We&apos;d love to hear from you. Reach out with any questions or
              to get started on your driving journey.
            </p>
            <ContactInfo settings={settings} />
          </div>
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}
