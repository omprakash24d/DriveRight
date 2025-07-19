import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/dashboard/'],
      },
    ],
    sitemap: `${appBaseUrl}/sitemap.xml`,
  };
}
