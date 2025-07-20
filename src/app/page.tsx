
import { HeroSection } from "./(home)/_components/HeroSection";
import { WhyChooseUs } from "./(home)/_components/WhyChooseUs";
import { GallerySection } from "./(home)/_components/GallerySection";
import { QuickServices } from "./(home)/_components/QuickServices";
import { AboutSection } from "./(home)/_components/AboutSection";
import { LocationSection } from "./(home)/_components/LocationSection";
import { TestimonialsSection } from "./(home)/_components/TestimonialsSection";
import { VideoSection } from "./(home)/_components/VideoSection";
import { CtaSection } from "./(home)/_components/CtaSection";
import { DeveloperNoteSection } from './(home)/_components/DeveloperNoteSection';
import { getSiteSettings } from "@/services/settingsService";
import { getTestimonials } from "@/services/testimonialsService";
import { getTrainingServices, getOnlineServices } from "@/services/quickServicesService";

// Note: Metadata is now handled in layout.tsx for a centralized approach

export default async function Home() {
  const settings = await getSiteSettings();
  const testimonials = await getTestimonials();
  const trainingServices = await getTrainingServices();
  const onlineServices = await getOnlineServices();

  return (
    <div className="flex flex-col">
      <HeroSection settings={settings} />
      <QuickServices 
        settings={settings} 
        trainingServices={trainingServices}
        onlineServices={onlineServices}
      />
      <WhyChooseUs settings={settings} whyChooseUsPoints={settings.whyChooseUsPoints} />
      <GallerySection settings={settings} />
      <AboutSection settings={settings} />
      <LocationSection settings={settings} />
      <TestimonialsSection testimonials={testimonials} />
      <VideoSection settings={settings} />
      <DeveloperNoteSection settings={settings} />
      <CtaSection />
    </div>
  );
}
