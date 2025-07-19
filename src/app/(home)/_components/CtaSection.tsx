import { Button } from "@/components/ui/button";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="relative w-full overflow-hidden bg-primary text-primary-foreground" role="region" aria-labelledby="cta-title">
       <div 
        aria-hidden="true" 
        className="absolute inset-0 bg-grid-white/[0.1] "
      />
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center py-20 md:py-24">
        <h2 id="cta-title" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Ready to Get Behind the Wheel?
        </h2>
        <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
          Your journey towards becoming a confident and safe driver starts with a single step. Enroll in one of our courses today!
        </p>
        <Button asChild size="lg" variant="secondary">
          <Link href="/enroll" aria-label="Enroll in driving courses">Enroll Today</Link>
        </Button>
      </div>
    </section>
  );
}
