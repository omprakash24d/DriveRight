"use client";

import {
  ServiceCard,
  ServiceGrid,
  ServiceSection,
} from "@/components/ui/service-card";
import { getPriceInfo } from "@/lib/priceUtils";
import { Bike, Car, PartyPopper, Route, Truck } from "lucide-react";
import type { ElementType } from "react";
import { CourseEnrollButton } from "./CourseEnrollButton";

// A robust icon map to safely handle dynamic icons
const iconMap: { [key: string]: ElementType } = {
  Car,
  Bike,
  Truck,
  Route,
  PartyPopper,
};

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  price: string;
}

interface CoursesListProps {
  courses: Course[];
}

export function CoursesList({ courses }: CoursesListProps) {
  return (
    <ServiceSection
      title="Our Driving Courses"
      description="Choose the perfect program to start your journey or enhance your skills. All courses are taught by certified professionals with modern vehicles and proven teaching methods."
    >
      <ServiceGrid columns={3}>
        {courses.map((course) => {
          const IconComponent = iconMap[course.icon] || Car;

          // Use consistent price handling
          const priceInfo = getPriceInfo(course.price);

          return (
            <ServiceCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              icon={IconComponent}
              price={priceInfo.formattedPrice}
              ctaText="Enroll Now"
              ctaHref={`/enroll?course=${course.id}`}
              variant="elevated"
              badges={priceInfo.isFree ? ["Free Course"] : []}
            >
              <div className="mb-4">
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
      </ServiceGrid>
    </ServiceSection>
  );
}
