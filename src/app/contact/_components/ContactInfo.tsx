import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SiteSettings } from "@/services/settingsService";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

interface ContactInfoProps {
  settings: SiteSettings;
}

export function ContactInfo({ settings }: ContactInfoProps) {
  return (
    <div className="space-y-8 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Our Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <div className="flex items-start gap-4">
            <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <address className="not-italic">{settings.address}</address>
          </div>
          <div className="flex items-center gap-4">
            <Phone className="h-5 w-5 text-primary flex-shrink-0" />
            <a href={`tel:${settings.phone}`} className="hover:text-primary">
              {settings.phone}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-primary flex-shrink-0" />
            <a
              href={`mailto:${settings.contactEmail}`}
              className="hover:text-primary"
            >
              {settings.contactEmail}
            </a>
          </div>
          <div className="pt-4">
            <Button asChild className="w-full sm:w-auto">
              <Link
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="mr-2" /> Message on WhatsApp
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg shadow-xl border h-[400px]">
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=${
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          }&q=${encodeURIComponent(settings.address)}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${settings.schoolName} Location`}
          aria-label={`Google Maps location of ${settings.schoolName}`}
          allow="geolocation"
        ></iframe>
      </div>
    </div>
  );
}
