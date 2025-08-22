"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import type { Course } from "@/services/coursesService";
import { doc, getDoc } from "firebase/firestore";
import { AlertTriangle, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { CourseEnrollButton } from "../../_components/CourseEnrollButton";
import { CourseContentDisplay } from "./CourseContentDisplay";

interface CourseContentWrapperProps {
  course: Course;
}

export function CourseContentWrapper({ course }: CourseContentWrapperProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkEnrollment = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const enrollmentRef = doc(
        db,
        "users",
        user.uid,
        "enrolledCourses",
        course.id
      );
      const docSnap = await getDoc(enrollmentRef);
      setIsEnrolled(docSnap.exists());
    } catch (e) {
      console.error("Failed to check enrollment status", e);
      setError("Could not verify your enrollment status. Please try again.");
      setIsEnrolled(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthLoading) {
      checkEnrollment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, course.id, isAuthLoading]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="grid lg:grid-cols-3 gap-8" aria-busy="true">
        <div className="lg:col-span-2">
          <Skeleton className="w-full aspect-video" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center w-full max-w-2xl mx-auto py-12 border-destructive">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 rounded-full h-16 w-16 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4">Verification Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={checkEnrollment}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (isEnrolled) {
    return <CourseContentDisplay modules={course.modules || []} />;
  }

  return (
    <Card className="text-center w-full max-w-2xl mx-auto py-12">
      <CardHeader>
        <div className="mx-auto bg-secondary rounded-full h-16 w-16 flex items-center justify-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="mt-4">Course Content Locked</CardTitle>
        <CardDescription>
          Enroll in this course to get full access to all modules and lessons.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CourseEnrollButton
          courseId={course.id}
          courseTitle={course.title}
          coursePrice={course.price}
        />
      </CardContent>
    </Card>
  );
}
