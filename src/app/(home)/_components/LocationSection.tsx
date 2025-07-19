import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteSettings } from "@/services/settingsService";

interface LocationSectionProps {
  settings: SiteSettings;
}

export function LocationSection({ settings }: LocationSectionProps) {
  return (
    <section id="location" className="w-full py-20 md:py-24 bg-background" role="region" aria-labelledby="location-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 id="location-title" className="text-3xl md:text-4xl font-bold tracking-tight">Find Us</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Visit us for a personal consultation. We're conveniently located and ready to help you start your driving journey.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <div>
                  <p className="font-semibold text-foreground">Address:</p>
                  <address className="not-italic" aria-label="Postal address">{settings.address}</address>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Hours:</p>
                  <p>Monday to Friday, 9 AM - 5 PM</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Phone:</p>
                  <a href={`tel:${settings.phone}`} className="text-primary hover:underline" aria-label={`Call ${settings.phone}`}>{settings.phone}</a>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Email:</p>
                  <a href={`mailto:${settings.contactEmail}`} className="text-primary hover:underline" aria-label={`Email ${settings.contactEmail}`}>{settings.contactEmail}</a>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="overflow-hidden rounded-lg shadow-xl border h-[400px]">
            <iframe
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.641578351545!2d84.6845417!3d25.2360307!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7b93b2a26569d%3A0x756b463b77299599!2s${encodeURIComponent(settings.schoolName)}!5e0!3m2!1sen!2sin!4v1720512111181!5m2!1sen!2sin`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${settings.schoolName} Location`}
              aria-label={`Google Maps location of ${settings.schoolName}`}
            ></iframe>
        </div>
        </div>
      </div>
    </section>
  );
}
