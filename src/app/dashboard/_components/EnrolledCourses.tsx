
"use client";

import { useEffect, useState } from 'react';
import { getUserEnrolledCourses, type EnrolledCourse } from '@/services/studentsService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface EnrolledCoursesProps {
    userId: string;
}

export function EnrolledCourses({ userId }: EnrolledCoursesProps) {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      getUserEnrolledCourses(userId)
        .then(courses => {
          setEnrolledCourses(courses);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [userId]);

  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4">My Courses</h2>
         {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrolledCourses.map(course => (
              <Card key={course.courseId} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                   <CardDescription>Enrolled on {course.enrolledAt.toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground text-sm line-clamp-3">{course.description}</p>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/courses/${course.courseId}`}>
                      Go to Course <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardHeader className="items-center">
              <div className="mx-auto bg-secondary rounded-full h-16 w-16 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4">No Courses Yet</CardTitle>
              <CardDescription>You haven't enrolled in any courses yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/courses">Explore Courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
