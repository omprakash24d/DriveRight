
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourses } from "@/services/coursesService";
import { getSiteSettings } from '@/services/settingsService';
import { Car, Bike, Truck, Route, PartyPopper, type LucideProps } from "lucide-react";
import type { ElementType, ForwardRefExoticComponent, RefAttributes } from 'react';
import { CourseEnrollButton } from './_components/CourseEnrollButton';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    return {
        title: 'Our Driving Courses',
        description: `Explore our comprehensive driving courses offered by ${settings.schoolName}, including LMV, MCWG, and HMV. Find the perfect program to start your driving journey in Arwal.`,
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
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  
  const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Driving Courses',
      'description': `A list of available driving courses at ${settings.schoolName}.`,
      'itemListElement': courses.map((course, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'Course',
          'url': `${appBaseUrl}/courses/${course.id}`,
          'name': course.title,
          'description': course.description,
          'provider': {
            '@type': 'Organization',
            'name': settings.schoolName,
          }
        }
      })),
  };
  
  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Our Driving Courses
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          Choose the perfect program to start your journey or enhance your skills. All courses are taught by certified professionals.
        </p>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {courses.map((course) => {
                const IconComponent = iconMap[course.icon] || Car;
                const isFree = course.price.toLowerCase() === 'free';
                const cardTitleId = `course-title-${course.id}`;

                return (
                    <Card key={course.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300" aria-labelledby={cardTitleId}>
                        <CardHeader className="items-center text-center">
                            <IconComponent className="h-12 w-12 text-primary" aria-hidden="true" />
                            <CardTitle id={cardTitleId} className="mt-4">{course.title}</CardTitle>
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
                          <p className="text-muted-foreground text-center">{course.description}</p>
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-2 mt-auto">
                           <CourseEnrollButton course={course} />
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
      ) : (
        <div className="text-center py-16">
            <p className="text-muted-foreground">No courses have been added yet. Please check back later.</p>
        </div>
      )}
    </div>
  );
}
