
import { Button } from "@/components/ui/button";
import { SiteSettings } from "@/services/settingsService";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface DeveloperNoteSectionProps {
  settings: SiteSettings;
}

export function DeveloperNoteSection({ settings }: DeveloperNoteSectionProps) {
  const { developerNoteTitle, developerNoteText, developerAvatarUrl } = settings;

  if (!developerNoteTitle || !developerNoteText || !developerAvatarUrl) {
    return null;
  }

  return (
    <section id="developer-note" className="w-full py-20 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 items-center bg-secondary/30 rounded-lg p-8 shadow-sm">
            <div className="md:col-span-1 flex justify-center">
              <div className="relative h-[150px] w-[150px] rounded-full overflow-hidden border-4 border-background shadow-lg transition-transform duration-300 ease-in-out hover:scale-110">
                <Image
                  src={developerAvatarUrl}
                  alt="Developer's profile picture"
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                {developerNoteTitle}
              </h2>
              <blockquote className="space-y-4 text-muted-foreground border-l-4 pl-4 italic">
                <p>{developerNoteText}</p>
              </blockquote>
              <div className="mt-6">
                <Button asChild>
                  <Link href="https://om.indhinditech.com/" target="_blank" rel="noopener noreferrer">
                    Know More <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
