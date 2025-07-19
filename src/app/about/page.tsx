
import type { Metadata } from 'next';
import { getSiteSettings } from '@/services/settingsService';
import { getInstructors } from '@/services/instructorsService';
import { getTestimonials } from '@/services/testimonialsService';

import { TestimonialsSection } from '@/app/(home)/_components/TestimonialsSection';
import { CtaSection } from '@/app/(home)/_components/CtaSection';
import { WhyChooseUs } from '@/app/(home)/_components/WhyChooseUs';
import { AboutHeader } from './_components/AboutHeader';
import { StatsSection } from './_components/StatsSection';
import { TeamSection } from './_components/TeamSection';


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: 'About Us',
    description: `Learn more about ${settings.schoolName}, our mission, our values, and the expert team dedicated to making you a safe and confident driver.`,
  };
}

export default async function AboutPage() {
    const settings = await getSiteSettings();
    const instructors = await getInstructors();
    const testimonials = await getTestimonials();

    return (
        <div className="flex flex-col">
            <AboutHeader settings={settings} />
            <StatsSection stats={settings.homepageStats} />
            <WhyChooseUs settings={settings} whyChooseUsPoints={settings.whyChooseUsPoints} />
            <TeamSection instructors={instructors} />
            <TestimonialsSection testimonials={testimonials} />
            <CtaSection />
        </div>
    );
}
