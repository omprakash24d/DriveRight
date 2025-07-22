// components/Breadcrumb.tsx - SEO-optimized breadcrumb navigation

import { generateBreadcrumbSchema } from "@/lib/seo-utils";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  name: string;
  url: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  // Add home as first item if not present
  const breadcrumbItems =
    items[0]?.url === "/" ? items : [{ name: "Home", url: "/" }, ...items];

  // Generate structured data
  const schema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav
        aria-label="Breadcrumb navigation"
        className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}
      >
        <ol className="flex items-center space-x-1">
          {breadcrumbItems.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && (
                <ChevronRight
                  className="w-4 h-4 mx-1 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              {item.current ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {index === 0 && (
                    <Home className="w-4 h-4 mr-1 inline" aria-hidden="true" />
                  )}
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  aria-label={
                    index === 0 ? "Go to homepage" : `Go to ${item.name}`
                  }
                >
                  {index === 0 && (
                    <Home className="w-4 h-4 mr-1 inline" aria-hidden="true" />
                  )}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Pre-defined breadcrumb configurations for common pages
export const BREADCRUMB_CONFIGS = {
  courses: [{ name: "Courses", url: "/courses", current: true }],
  course: (courseTitle: string, courseId: string) => [
    { name: "Courses", url: "/courses" },
    { name: courseTitle, url: `/courses/${courseId}`, current: true },
  ],
  about: [{ name: "About Us", url: "/about", current: true }],
  contact: [{ name: "Contact Us", url: "/contact", current: true }],
  enroll: [{ name: "Enroll Now", url: "/enroll", current: true }],
  results: [{ name: "Results", url: "/results", current: true }],
  instructors: [
    { name: "Our Instructors", url: "/instructors", current: true },
  ],
  dashboard: [{ name: "Dashboard", url: "/dashboard", current: true }],
  refresher: [{ name: "Refresher Course", url: "/refresher", current: true }],
  llExamPass: [{ name: "LL Exam Pass", url: "/ll-exam-pass", current: true }],
  privacyPolicy: [
    { name: "Privacy Policy", url: "/privacy-policy", current: true },
  ],
  termsOfService: [
    { name: "Terms of Service", url: "/terms-of-service", current: true },
  ],
  disclaimer: [{ name: "Disclaimer", url: "/disclaimer", current: true }],
  returnsRefunds: [
    { name: "Returns & Refunds", url: "/returns-and-refunds", current: true },
  ],
};
