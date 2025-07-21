"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeData } from "@/hooks/use-realtime-data";
import { db } from "@/lib/firebase";
import type { EnrolledCourse } from "@/services/studentsService";
import { collection, orderBy, query } from "firebase/firestore";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

interface EnrolledCoursesProps {
  userId: string;
}

export function EnrolledCourses({ userId }: EnrolledCoursesProps) {
  const {
    data: enrolledCourses,
    loading: isLoading,
    error,
  } = useRealtimeData<EnrolledCourse>(
    query(
      collection(db, "users", userId, "enrolledCourses"),
      orderBy("enrolledAt", "desc")
    )
  );

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
      ) : error ? (
        <p className="text-destructive">Could not load courses: {error}</p>
      ) : enrolledCourses && enrolledCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledCourses.map((course) => (
            <Card key={course.courseId} className="flex flex-col">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>
                  Enrolled on{" "}
                  {course.enrolledAt instanceof Date
                    ? course.enrolledAt.toLocaleDateString()
                    : course.enrolledAt.toDate().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {course.description}
                </p>
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
            <CardDescription>
              You haven't enrolled in any courses yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/courses">Explore Courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
