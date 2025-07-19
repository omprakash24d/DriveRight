import { type MetadataRoute } from 'next';
import { schoolConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const appBaseUrl = schoolConfig.appBaseUrl;

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
