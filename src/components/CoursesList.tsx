"use client";

import { CourseEnrollButton } from "@/app/courses/_components/CourseEnrollButton";
import { ServiceCard } from "@/components/ui/service-card";
import { getPriceInfo } from "@/lib/priceUtils";
import {
  Award,
  Bike,
  Car,
  Clock,
  MapPin,
  Route,
  Truck,
  Users,
} from "lucide-react";
import { ElementType } from "react";

// A robust icon map to safely handle dynamic icons
const iconMap: { [key: string]: ElementType } = {
  Car,
  Bike,
  Truck,
  Route,
  MapPin,
  Users,
  Clock,
  Award,
};

interface Course {
  id: string;
  title: string;
  description: string;
  price?: string | number;
  icon?: string;
}

interface CoursesListProps {
  courses: Course[];
  coursesResult: {
    success: boolean;
    error?: string;
  };
}

export default function CoursesList({
  courses,
  coursesResult,
}: CoursesListProps) {
  if (!coursesResult.success) {
    return (
      <div className="text-center py-12">
        <div className="status-error rounded-lg p-6 max-w-md mx-auto">
          <p className="mb-2 font-medium">
            Error loading courses: {coursesResult.error}
          </p>
          <p className="text-sm opacity-80">
            Please try refreshing the page or contact support if the problem
            persists.
          </p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="card-minimal p-8 max-w-md mx-auto">
          <p className="text-muted-foreground">
            No courses have been added yet. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Course Introduction */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Choose Your Perfect Course
        </h2>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          All courses are taught by certified professionals with modern vehicles
          and proven teaching methods.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="pt-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center items-stretch max-w-7xl mx-auto">
          {courses.map((course) => {
            const priceInfo = getPriceInfo(course.price);
            const IconComponent =
              course.icon && iconMap[course.icon] ? iconMap[course.icon] : Car;

            return (
              <ServiceCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                icon={IconComponent}
                price={priceInfo.formattedPrice}
                ctaText=""
                ctaHref=""
                variant="elevated"
                badges={priceInfo.isFree ? ["Free Course"] : []}
                hideDefaultCta={true}
                className="w-full"
              >
                <div className="mt-auto">
                  <CourseEnrollButton
                    courseId={course.id}
                    courseTitle={course.title}
                    coursePrice={
                      priceInfo.isFree ? "Free" : String(priceInfo.numericPrice)
                    }
                  />
                </div>
              </ServiceCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
