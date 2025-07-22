import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface ServicesHeroProps {
  settings: {
    schoolName: string;
    address: string;
    phone: string;
    contactEmail: string;
  };
}

export function ServicesHero({ settings }: ServicesHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2 text-sm font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Government Authorized Driving School
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Our <span className="text-yellow-400">Driving Services</span>
            </h1>

            <p className="text-xl text-blue-100 leading-relaxed">
              From novice drivers to seasoned professionals, we have a course
              tailored for your needs. Get trained by certified instructors with
              our comprehensive MCWG, LMV, and HMV programs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-semibold px-8 py-3"
              >
                <Link href="/enroll">Start Your Training</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-800 px-8 py-3"
              >
                <Link href="/certificate">Online Services</Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">500+</div>
                <div className="text-sm text-blue-200">Students Trained</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">95%</div>
                <div className="text-sm text-blue-200">Pass Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">15+</div>
                <div className="text-sm text-blue-200">Years Experience</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/driving_school_arwal.png"
                alt="Government Authorized Driving School - Professional Training Services"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            {/* Floating certification badge */}
            <div className="absolute -bottom-6 -right-6 bg-white text-blue-800 p-4 rounded-xl shadow-lg">
              <div className="text-center">
                <div className="text-lg font-bold">RTO</div>
                <div className="text-sm">Certified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
