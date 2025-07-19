
import type { Metadata, ResolvingMetadata } from 'next';
import { getCourse } from "@/services/coursesService";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Star, Clock } from "lucide-react";
import { CourseContentWrapper } from "./_components/CourseContentWrapper";
import { getSiteSettings } from '@/services/settingsService';
import { CourseEnrollButton } from '../_components/CourseEnrollButton';

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const course = await getCourse(params.id);
  const settings = await getSiteSettings();

  if (!course) {
    return {
      title: 'Course Not Found',
      description: 'The course you are looking for could not be found.',
    }
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: course.title,
    description: course.description,
    openGraph: {
        title: course.title,
        description: course.description,
        type: 'article',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/courses/${course.id}`,
        images: [...previousImages],
        siteName: settings.schoolName,
    },
  }
}


export default async function CourseDetailPage({ params }: { params: { id: string } }) {
    const course = await getCourse(params.id);

    if (!course) {
        notFound();
    }

    const totalLessons = course.modules?.reduce((acc, module) => acc + module.lessons.length, 0) || 0;
    const settings = await getSiteSettings();
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.title,
        description: course.description,
        provider: {
            '@type': 'Organization',
            name: settings.schoolName,
            url: appBaseUrl,
        },
    };

    return (
        <div className="bg-muted/40">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <header className="bg-background py-12 md:py-20">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{course.title}</h1>
                            <p className="mt-4 text-lg text-muted-foreground">{course.description}</p>
                            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    <span>{course.modules?.length || 0} Modules</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    <span>{totalLessons} Lessons</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5" />
                                    <span>Self-Paced Learning</span>
                                </div>
                            </div>
                        </div>
                        <Card className="w-full max-w-sm justify-self-center md:justify-self-end">
                            <CardHeader>
                                <CardTitle>Enrollment</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 text-center">
                                <p className="text-4xl font-bold text-primary">{course.price}</p>
                                <p className="text-muted-foreground">Lifetime access</p>
                                <div className="mt-6">
                                     <CourseEnrollButton course={course} />
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
