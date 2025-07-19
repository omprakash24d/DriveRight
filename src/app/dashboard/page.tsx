
"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ProfileEditor } from './_components/ProfileEditor';
import { UserActivity } from './_components/UserActivity';
import { EnrolledCourses } from './_components/EnrolledCourses';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading || !user) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <Skeleton className="h-10 w-1/2 mb-12" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Welcome, {userProfile?.name || user.displayName || 'Student'}!</h1>
        <p className="text-muted-foreground mt-2">Here's an overview of your learning journey with Driving School Arwal.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <EnrolledCourses userId={user.uid} />
          <UserActivity userId={user.uid} />
        </div>
        <div className="lg:col-span-1">
          <ProfileEditor user={user} />
        </div>
      </div>
    </div>
  );
}
