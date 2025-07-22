// src/lib/analytics.ts - Performance analytics and user behavior tracking
import React from 'react';

interface PerformanceMetric {
  id: string;
  type: 'page_load' | 'api_call' | 'user_action' | 'error' | 'conversion';
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface UserEvent {
  id: string;
  event: string;
  category: 'navigation' | 'enrollment' | 'payment' | 'engagement' | 'conversion';
  properties: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private metricsQueue: PerformanceMetric[] = [];
  private eventsQueue: UserEvent[] = [];
  private sessionStartTime: number = Date.now();

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      // Track Core Web Vitals
      this.trackWebVitals();
      
      // Track page navigation
      this.trackPageNavigation();
      
      // Flush queues periodically
      setInterval(() => this.flushQueues(), 30000); // Every 30 seconds
    }
  }

  // Track performance metrics
  trackMetric(
    type: PerformanceMetric['type'],
    name: string,
    value: number,
    unit: PerformanceMetric['unit'] = 'ms',
    metadata: Record<string, any> = {}
  ): void {
    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      type,
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      metadata
    };

    this.metricsQueue.push(metric);
    
    // Auto-flush if queue gets large
    if (this.metricsQueue.length > 50) {
      this.flushQueues();
    }
  }

  // Track user events
  trackEvent(
    event: string,
    category: UserEvent['category'],
    properties: Record<string, any> = {}
  ): void {
    const userEvent: UserEvent = {
      id: crypto.randomUUID(),
      event,
      category,
      properties,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    };

    this.eventsQueue.push(userEvent);
    
    // Track conversions in real-time
    if (category === 'conversion') {
      this.flushQueues();
    }
  }

  // Track API performance
  async trackApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.trackMetric('api_call', endpoint, duration, 'ms', {
        ...metadata,
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.trackMetric('api_call', endpoint, duration, 'ms', {
        ...metadata,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  // Track Core Web Vitals
  private trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackMetric('page_load', 'LCP', lastEntry.startTime, 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        this.trackMetric('page_load', 'FID', entry.processingStart - entry.startTime, 'ms');
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.trackMetric('page_load', 'CLS', clsValue, 'count');
    }).observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        this.trackMetric('page_load', 'TTFB', navigationEntry.responseStart - navigationEntry.requestStart, 'ms');
      }
    });
  }

  // Track page navigation
  private trackPageNavigation(): void {
    let currentPath = window.location.pathname;
    
    // Track initial page load
    this.trackEvent('page_view', 'navigation', {
      path: currentPath,
      referrer: document.referrer,
      loadTime: Date.now() - this.sessionStartTime
    });

    // Track SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const trackNavigation = () => {
      const newPath = window.location.pathname;
      if (newPath !== currentPath) {
        this.trackEvent('page_view', 'navigation', {
          path: newPath,
          previousPath: currentPath
        });
        currentPath = newPath;
      }
    };

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      trackNavigation();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      trackNavigation();
    };

    window.addEventListener('popstate', trackNavigation);
  }

  // Flush queues to backend
  private async flushQueues(): Promise<void> {
    if (this.metricsQueue.length === 0 && this.eventsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    const events = [...this.eventsQueue];
    
    this.metricsQueue = [];
    this.eventsQueue = [];

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, events })
      });
    } catch (error) {
      console.error('Failed to send analytics data:', error);
      // Re-queue data if send fails
      this.metricsQueue.unshift(...metrics);
      this.eventsQueue.unshift(...events);
    }
  }

  private getCurrentUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    // Try to get user ID from localStorage or auth context
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem('analytics-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics-session-id', sessionId);
    }
    return sessionId;
  }

  // Get analytics dashboard data
  async getDashboardData(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<any> {
    try {
      const response = await fetch(`/api/analytics/dashboard?timeframe=${timeframe}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return null;
    }
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();

// Convenience functions
export const trackMetric = (
  type: PerformanceMetric['type'],
  name: string,
  value: number,
  unit: PerformanceMetric['unit'] = 'ms',
  metadata?: Record<string, any>
) => analytics.trackMetric(type, name, value, unit, metadata);

export const trackEvent = (
  event: string,
  category: UserEvent['category'],
  properties?: Record<string, any>
) => analytics.trackEvent(event, category, properties);

export const trackApiCall = <T>(
  endpoint: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>
) => analytics.trackApiCall(endpoint, apiCall, metadata);

// React hook for component-level analytics
export const useAnalytics = () => {
  React.useEffect(() => {
    // Track component mount
    trackEvent('component_mount', 'engagement', {
      component: 'unknown' // This would be overridden by the specific component
    });

    return () => {
      // Track component unmount
      trackEvent('component_unmount', 'engagement', {
        component: 'unknown'
      });
    };
  }, []);

  return {
    trackEvent,
    trackMetric,
    trackApiCall
  };
};
