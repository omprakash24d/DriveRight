
import { Suspense } from "react";
import type { Metadata } from "next";
import { EnrollmentFormComponent } from "./_components/EnrollmentForm";
import { getSiteSettings } from "@/services/settingsService";


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: 'Enroll Now',
    description: `Start your driving journey today. Fill out the online enrollment form for ${settings.schoolName} to join our driving courses in Arwal.`,
  };
}

export default function EnrollmentPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 md:px-6 py-16 md:py-24">Loading...</div>}>
            <EnrollmentFormComponent />
        </Suspense>
    )
}
