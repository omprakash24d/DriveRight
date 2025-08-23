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

      {/* Courses Content */}
      <section className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <CoursesList courses={courses} coursesResult={coursesResult} />
      </section>
    </div>
  );
}
