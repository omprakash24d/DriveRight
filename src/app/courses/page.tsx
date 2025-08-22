import { Breadcrumb, BREADCRUMB_CONFIGS } from "@/components/Breadcrumb";
import CoursesList from "@/components/CoursesList";
import { getCourses } from "@/services/coursesService";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Driving Courses | DriveRight Driving School",
  description:
    "Explore our comprehensive driving courses designed to help you become a confident and safe driver. Choose from beginner courses, defensive driving, and specialized programs.",
  keywords:
    "driving courses, driving lessons, defensive driving, driver education, driving school",
  openGraph: {
    title: "Driving Courses | DriveRight Driving School",
    description:
      "Comprehensive driving courses for all skill levels. Start your journey to safe driving today.",
    type: "website",
  },
};

export default async function CoursesPage() {
  // Get courses data
  const coursesResult = await getCourses();
  const courses = coursesResult.success ? coursesResult.data : [];

  return (
    <div className="min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-2">
        <Breadcrumb items={BREADCRUMB_CONFIGS.courses} />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Our Driving Courses
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Comprehensive driving education programs designed for every
              learner. From beginner basics to advanced techniques, we&apos;ll
              help you become a confident and safe driver.
            </p>
          </div>
        </div>
      </section>

      {/* Courses Content */}
      <section className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <CoursesList courses={courses} coursesResult={coursesResult} />
      </section>
    </div>
  );
}
