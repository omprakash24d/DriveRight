import { Breadcrumb, BREADCRUMB_CONFIGS } from "@/components/Breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCourses } from "@/services/coursesService";
import { getSiteSettings } from "@/services/settingsService";
import { Bike, Car, PartyPopper, Route, Truck } from "lucide-react";
import type { Metadata } from "next";
import type { ElementType } from "react";
import { CourseEnrollButton } from "./_components/CourseEnrollButton";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Driving Courses - Complete Training Programs",
    description: `Explore comprehensive driving courses at ${settings.schoolName}. Professional training for LMV (Car), MCWG (Motorcycle), and HMV (Heavy Vehicle) with certified instructors in Arwal, Bihar. Choose your perfect driving program today.`,
    keywords: [
      "driving courses Arwal",
      "LMV training Bihar",
      "MCWG course Arwal",
      "HMV training Bihar",
      "car driving lessons",
      "motorcycle training",
      "heavy vehicle course",
      "driving school programs",
      "professional driving education",
      "certified driving instructors",
    ],
    openGraph: {
      title: `Driving Courses | ${settings.schoolName}`,
      description: `Professional driving courses in Arwal, Bihar. Expert training for all vehicle types with modern methods and certified instructors.`,
      type: "website",
    },
    alternates: {
      canonical: "/courses",
    },
  };
}

// A robust icon map to safely handle dynamic icons
const iconMap: { [key: string]: ElementType } = {
  Car,
  Bike,
  Truck,
  Route,
  PartyPopper,
};

export default async function CoursesPage() {
  const courses = await getCourses();
  const settings = await getSiteSettings();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Driving Courses at ${settings.schoolName}`,
    description: `Comprehensive list of driving courses offered by ${settings.schoolName} in Arwal, Bihar.`,
    url: `${appBaseUrl}/courses`,
    numberOfItems: courses.length,
    itemListElement: courses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        "@id": `${appBaseUrl}/courses/${course.id}`,
        url: `${appBaseUrl}/courses/${course.id}`,
        name: course.title,
        description: course.description,
        provider: {
          "@type": "EducationalOrganization",
          name: settings.schoolName,
          url: appBaseUrl,
        },
        courseCode: course.id,
        educationalLevel: "Beginner to Advanced",
        teaches: (course as any).features || [],
        timeRequired: (course as any).duration || "P4W",
        offers: {
          "@type": "Offer",
          price:
            course.price === "Free"
              ? "0"
              : course.price?.replace(/[^\d]/g, "") || "0",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          validFrom: new Date().toISOString(),
          seller: {
            "@type": "Organization",
            name: settings.schoolName,
          },
        },
      },
    })),
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="mb-8">
        <Breadcrumb items={BREADCRUMB_CONFIGS.courses} />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Our Driving Courses
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          Choose the perfect program to start your journey or enhance your
          skills. All courses are taught by certified professionals with modern
          vehicles and proven teaching methods.
        </p>
      </div>

      {courses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {courses.map((course) => {
              const IconComponent = iconMap[course.icon] || Car;
              const isFree = course.price.toLowerCase() === "free";
              const cardTitleId = `course-title-${course.id}`;

              return (
                <Card
                  key={course.id}
                  className="flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  aria-labelledby={cardTitleId}
                >
                  <CardHeader className="items-center text-center pb-4">
                    <div className="p-3 bg-primary/10 rounded-full mb-4">
                      <IconComponent
                        className="h-8 w-8 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <CardTitle id={cardTitleId} className="text-xl">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="text-2xl font-bold text-primary">
                      {isFree ? (
                        <div className="flex items-center justify-center gap-2">
                          <PartyPopper className="h-7 w-7" />
                          <span>Free</span>
                        </div>
                      ) : (
                        course.price
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-center">
                      {course.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch gap-2 mt-auto">
                    <CourseEnrollButton course={course} />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No courses have been added yet. Please check back later.
          </p>
        </div>
      )}
    </div>
  );
}
