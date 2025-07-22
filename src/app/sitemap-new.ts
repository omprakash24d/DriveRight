import { schoolConfig } from '@/lib/config';
import { getCourses } from '@/services/coursesService';
import { getInstructors } from '@/services/instructorsService';
import { type MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appBaseUrl = schoolConfig.appBaseUrl;
  const currentDate = new Date();

  // Fetch dynamic content
  const [courses, instructors] = await Promise.all([
    getCourses().catch(() => []),
    getInstructors().catch(() => [])
  ]);

  // Dynamic course pages
  const courseUrls = courses.map((course) => ({
    url: `${appBaseUrl}/courses/${course.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Dynamic instructor pages (if they exist)
  const instructorUrls = instructors.map((instructor) => ({
    url: `${appBaseUrl}/instructors/${instructor.id}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // High priority static pages
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: appBaseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${appBaseUrl}/courses`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${appBaseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${appBaseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${appBaseUrl}/enroll`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Secondary pages
  const secondaryPages: MetadataRoute.Sitemap = [
    {
      url: `${appBaseUrl}/instructors`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${appBaseUrl}/results`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${appBaseUrl}/refresher`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${appBaseUrl}/ll-exam-pass`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Legal and policy pages
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${appBaseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${appBaseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${appBaseUrl}/disclaimer`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${appBaseUrl}/returns-and-refunds`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Combine all URLs
  return [
    ...mainPages,
    ...courseUrls,
    ...secondaryPages,
    ...instructorUrls,
    ...legalPages,
  ];
}
