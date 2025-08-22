// hooks/use-seo-optimization.ts - SEO and performance optimization hook

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: any;
  }
}

interface SEOOptimizationOptions {
  enableWebVitalsTracking?: boolean;
  enableSchemaValidation?: boolean;
  enableLinkPrefetching?: boolean;
  trackUserBehavior?: boolean;
}

export function useSEOOptimization(options: SEOOptimizationOptions = {}) {
  const router = useRouter();
  const {
    enableWebVitalsTracking = true,
    enableSchemaValidation = false,
    enableLinkPrefetching = true,
    trackUserBehavior = true,
  } = options;

  // Core Web Vitals tracking
  const trackCoreWebVitals = () => {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        // Send to analytics
        if (window.gtag) {
          window.gtag('event', 'core_web_vitals', {
            event_category: 'performance',
            metric_name: 'LCP',
            metric_value: Math.round(lastEntry.startTime),
            metric_rating: lastEntry.startTime <= 2500 ? 'good' : 
                          lastEntry.startTime <= 4000 ? 'needs_improvement' : 'poor'
          });
        }
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          
          if (window.gtag) {
            window.gtag('event', 'core_web_vitals', {
              event_category: 'performance',
              metric_name: 'FID',
              metric_value: Math.round(fid),
              metric_rating: fid <= 100 ? 'good' : 
                            fid <= 300 ? 'needs_improvement' : 'poor'
            });
          }
        });
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        if (window.gtag) {
          window.gtag('event', 'core_web_vitals', {
            event_category: 'performance',
            metric_name: 'CLS',
            metric_value: Math.round(clsValue * 1000) / 1000,
            metric_rating: clsValue <= 0.1 ? 'good' : 
                          clsValue <= 0.25 ? 'needs_improvement' : 'poor'
          });
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  };

  // Setup intelligent link prefetching
  const setupLinkPrefetching = useCallback(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          const href = link.getAttribute('href');
          
          if (href && href.startsWith('/')) {
            // Prefetch internal links when they come into view
            router.prefetch(href);
          }
        }
      });
    }, { rootMargin: '50px' });

    // Observe all internal links
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach((link) => observer.observe(link));

    return () => observer.disconnect();
  }, [router]);

  // Track page interactions for SEO insights
  const trackPageInteractions = () => {
    // Track scroll depth
    let maxScroll = 0;
    const trackScrollDepth = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        // Track scroll milestones
        if ([25, 50, 75, 90].includes(scrollPercent)) {
          if (window.gtag) {
            window.gtag('event', 'scroll_depth', {
              event_category: 'engagement',
              scroll_depth: scrollPercent,
            });
          }
        }
      }
    };

    // Track time on page
    const startTime = Date.now();
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      if (window.gtag) {
        window.gtag('event', 'time_on_page', {
          event_category: 'engagement',
          time_spent: timeSpent,
        });
      }
    };

    // Track click events on important elements
    const trackImportantClicks = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Track enrollment button clicks
      if (target.closest('[data-track="enrollment"]')) {
        if (window.gtag) {
          window.gtag('event', 'enrollment_click', {
            event_category: 'conversion',
            element_id: target.id || 'unknown',
          });
        }
      }
      
      // Track phone number clicks
      if (target.closest('[href^="tel:"]')) {
        if (window.gtag) {
          window.gtag('event', 'phone_click', {
            event_category: 'contact',
          });
        }
      }
      
      // Track social media clicks
      if (target.closest('[data-track="social"]')) {
        const platform = target.closest('[data-platform]')?.getAttribute('data-platform');
        if (window.gtag) {
          window.gtag('event', 'social_click', {
            event_category: 'social',
            platform: platform || 'unknown',
          });
        }
      }
    };

    // Add event listeners
    window.addEventListener('scroll', trackScrollDepth, { passive: true });
    window.addEventListener('beforeunload', trackTimeOnPage);
    document.addEventListener('click', trackImportantClicks);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', trackScrollDepth);
      window.removeEventListener('beforeunload', trackTimeOnPage);
      document.removeEventListener('click', trackImportantClicks);
    };
  };

  // Validate structured data in development
  const validateStructuredData = () => {
    if (typeof window !== 'undefined') {
      // Find all JSON-LD scripts
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      
      scripts.forEach((script, index) => {
        try {
          const data = JSON.parse(script.textContent || '');

          
          // Basic validation
          if (!data['@context'] || !data['@type']) {
            console.warn(`⚠️ JSON-LD schema #${index + 1} missing required properties`);
          }
        } catch (error) {
          console.error(`❌ Invalid JSON-LD schema #${index + 1}:`, error);
        }
      });
    }
  };

  useEffect(() => {
    // Track Core Web Vitals
    if (enableWebVitalsTracking && typeof window !== 'undefined') {
      trackCoreWebVitals();
    }

    // Prefetch important pages on hover
    if (enableLinkPrefetching) {
      setupLinkPrefetching();
    }

    // Track user behavior for SEO insights
    if (trackUserBehavior) {
      trackPageInteractions();
    }

    // Validate structured data in development
    if (enableSchemaValidation && process.env.NODE_ENV === 'development') {
      validateStructuredData();
    }
  }, [enableWebVitalsTracking, enableLinkPrefetching, trackUserBehavior, enableSchemaValidation, setupLinkPrefetching]);

  return {
    trackCoreWebVitals,
    setupLinkPrefetching,
    trackPageInteractions,
    validateStructuredData,
  };
}

// Hook for page-specific SEO optimization
export function usePageSEO(pageData: {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    // Track page view
    if (window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, {
        page_title: pageData.title,
        page_location: window.location.href,
        custom_map: {
          dimension1: pageData.keywords?.join(','),
        },
      });
    }

    // Update document title if needed (for client-side navigation)
    if (document.title !== pageData.title) {
      document.title = pageData.title;
    }

    // Add canonical URL if not present
    if (pageData.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', pageData.canonicalUrl);
    }
  }, [pageData, router]);

  return {
    updateTitle: (newTitle: string) => {
      document.title = newTitle;
    },
    updateMetaDescription: (description: string) => {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    },
  };
}
