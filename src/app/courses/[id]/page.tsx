import { Breadcrumb, BREADCRUMB_CONFIGS } from "@/components/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { schoolConfig } from "@/lib/config";
import { generateCourseSchema } from "@/lib/seo-utils";
import { getCourse } from "@/services/coursesService";
import { getSiteSettings } from "@/services/settingsService";
import { BookOpen, Clock, Star } from "lucide-react";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { CourseEnrollButton } from "../_components/CourseEnrollButton";
import { CourseContentWrapper } from "./_components/CourseContentWrapper";

type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const courseResult = await getCourse(params.id);

  if (!courseResult.success) {
    return {
      title: "Course Not Found",
      description: "The course you are looking for could not be found.",
    };
  }

  const course = courseResult.data;

  const settings = await getSiteSettings();
  const appBaseUrl = schoolConfig.appBaseUrl;
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${course.title} - Professional Driving Course`,
    description: `${course.description} Join ${settings.schoolName} for comprehensive ${course.title} training in Arwal, Bihar. Expert instructors, modern vehicles, and proven teaching methods.`,
    keywords: [
      typeof course?.title === "string" ? course.title.toLowerCase() : "",
      `${course?.title || "driving"} course`,
      `${course?.title || "driving"} training`,
      `${course?.title || "driving"} lessons`,
      "driving course Arwal",
      "professional driving training",
      "certified driving instructors",
      settings.schoolName,
    ],

    openGraph: {
      title: `${course.title} | ${settings.schoolName}`,
      description: `Professional ${course.title} training with expert instructors. Comprehensive course designed for safe and confident driving.`,
      type: "article",
      url: `${appBaseUrl}/courses/${course.id}`,
      images: [...previousImages],
      siteName: settings.schoolName,
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title} Course`,
      description: `Professional ${course.title} training at ${settings.schoolName}`,
    },
    alternates: {
      canonical: `/courses/${course.id}`,
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let courseResult: Awaited<ReturnType<typeof getCourse>>;
  let settings: Awaited<ReturnType<typeof getSiteSettings>>;

  try {
    [courseResult, settings] = await Promise.all([
      getCourse(params.id),
      getSiteSettings(),
    ]);
  } catch (error) {
    console.error("Failed to fetch course data:", error);
    // Render an error state or redirect
    return <div>Error loading course. Please try again later.</div>;
  }

  if (!courseResult.success) {
    notFound();
  }

  const course = courseResult.data;

  const totalLessons =
    course.modules?.reduce((acc, module) => acc + module.lessons.length, 0) ||
    0;
  const appBaseUrl = schoolConfig.appBaseUrl;

  // Enhanced Course Schema
  const courseSchema = generateCourseSchema(course, settings.schoolName);

  // Breadcrumb for course detail
  const breadcrumbItems = BREADCRUMB_CONFIGS.course(course.title, course.id);

  return (
    <div className="bg-muted/40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />

      <header className="bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {course.title}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                  <span>{course.modules?.length || 0} Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" aria-hidden="true" />
                  <span>{totalLessons} Lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" aria-hidden="true" />
                  <span>Self-Paced Learning</span>
                </div>
              </div>
            </div>
            <Card className="w-full max-w-sm justify-self-center md:justify-self-end">
              <CardHeader>
                <CardTitle>Enrollment</CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">
                  {course.price}
                </p>
                <p className="text-muted-foreground">Lifetime access</p>
                <div className="mt-6">
                  <CourseEnrollButton
                    courseId={course.id}
                    courseTitle={course.title}
                    coursePrice={course.price}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <CourseContentWrapper course={course} />
      </main>
    </div>
  );
}
