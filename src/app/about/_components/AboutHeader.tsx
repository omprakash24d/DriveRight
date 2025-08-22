import { SiteSettings } from "@/services/settingsService";
import Image from "next/image";

interface AboutHeaderProps {
  settings: SiteSettings;
}

export function AboutHeader({ settings }: AboutHeaderProps) {
  return (
    <section className="w-full section-padding bg-background">
      <div className="container mx-auto container-padding">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-last md:order-first">
            <h1 className="heading-xl">{settings.aboutPageTitle}</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {settings.aboutPageSubtitle}
            </p>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>{settings.aboutPageText1}</p>
              <p>{settings.aboutPageText2}</p>
            </div>
          </div>
          <div>
            <Image
              src="/images/1.jpeg"
              alt="Instructor teaching a student in a car"
              data-ai-hint="driving instructor student"
              width={600}
              height={400}
              className="rounded-xl card-elevated object-cover w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
