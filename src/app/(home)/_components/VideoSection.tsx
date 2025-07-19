import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteSettings } from "@/services/settingsService";

const videos = [
    {
      id: "Qc0s4WMPaxY",
      title: "How to pass driving test in 1st attempt",
    },
    {
      id: "SJSe0TbdhHo",
      title: "Two Wheeler Driving Skill Testing Track Measurement",
    },
];

interface VideoSectionProps {
  settings: SiteSettings;
}

export function VideoSection({ settings }: VideoSectionProps) {
  return (
    <section id="videos" className="w-full py-20 md:py-24 bg-background" role="region" aria-labelledby="video-section-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 id="video-section-title" className="text-3xl md:text-4xl font-bold tracking-tight">
            {settings.videoSectionTitle}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {settings.videoSectionSubtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden group">
              <figure>
                <div className="w-full aspect-video">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${video.id}?rel=0&modestbranding=1`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    aria-label={`Embedded YouTube video: ${video.title}`}
                  ></iframe>
                </div>
                <CardHeader>
                  <figcaption>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{video.title}</CardTitle>
                  </figcaption>
                </CardHeader>
              </figure>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
