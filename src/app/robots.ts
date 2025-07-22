import { schoolConfig } from '@/lib/config';
import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const appBaseUrl = schoolConfig.appBaseUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/_next/',
          '/private/',
          '/temp/',
          '/backup/',
          '/*.json$',
          '/api/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/private/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/private/',
        ],
      }
    ],
    sitemap: `${appBaseUrl}/sitemap.xml`,
    host: appBaseUrl,
  };
}
