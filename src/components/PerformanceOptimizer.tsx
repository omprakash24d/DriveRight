// src/components/PerformanceOptimizer.tsx - Performance optimization wrapper
"use client";

import { logUIError } from "@/lib/error-logging";
import Image from "next/image";
import React, {
  Component,
  ReactNode,
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// Error Boundary class component
class ErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback: (error: Error, retry: () => void) => ReactNode;
    onError?: (error: Error) => void;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.props.onError?.(error);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.retry);
    }

    return this.props.children;
  }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, hasIntersected, options]);

  return { isIntersecting, hasIntersected };
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Memoized component wrapper with error boundary
interface MemoizedComponentProps {
  children: React.ReactNode;
  dependencies?: any[];
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  componentName?: string;
}

export const MemoizedComponent = memo<MemoizedComponentProps>(
  ({
    children,
    dependencies = [],
    errorFallback,
    componentName = "Unknown",
  }) => {
    const memoizedChildren = useMemo(
      () => children,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [children, ...dependencies]
    );

    const ErrorFallback = errorFallback || DefaultErrorFallback;

    return (
      <ErrorBoundary
        fallback={(error: Error, retry: () => void) => (
          <ErrorFallback error={error} retry={retry} />
        )}
        onError={(error: Error) => {
          logUIError(error, {
            component: componentName,
            action: "render-error",
          });
        }}
      >
        {memoizedChildren}
      </ErrorBoundary>
    );
  }
);

MemoizedComponent.displayName = "MemoizedComponent";

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({
  error,
  retry,
}) => (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <h3 className="text-red-800 font-semibold">Something went wrong</h3>
    <p className="text-red-600 text-sm mt-1">
      {error.message || "An unexpected error occurred"}
    </p>
    <button
      onClick={retry}
      className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
    >
      Try again
    </button>
  </div>
);

// Lazy loading wrapper with intersection observer
interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback = <div className="w-full h-32 bg-gray-100 animate-pulse rounded" />,
  className = "",
  threshold = 0.1,
  rootMargin = "50px",
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { hasIntersected } = useIntersectionObserver(elementRef, {
    threshold,
    rootMargin,
  });

  return (
    <div ref={elementRef} className={className}>
      {hasIntersected ? children : fallback}
    </div>
  );
};

// Image optimization component
interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(
  ({
    src,
    alt,
    width,
    height,
    priority = false,
    quality = 75,
    placeholder = "empty",
    blurDataURL,
    className = "",
    ...props
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Generate optimized src URL (assuming Next.js Image Optimization API)
    const optimizedSrc = useMemo(() => {
      if (src.startsWith("http") || src.startsWith("/")) {
        const params = new URLSearchParams();
        if (width) params.set("w", width.toString());
        if (height) params.set("h", height.toString());
        if (quality !== 75) params.set("q", quality.toString());

        const separator = src.includes("?") ? "&" : "?";
        return params.toString()
          ? `${src}${separator}${params.toString()}`
          : src;
      }
      return src;
    }, [src, width, height, quality]);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);

    const handleError = useCallback(() => {
      setHasError(true);
      logUIError(`Failed to load image: ${src}`, {
        component: "OptimizedImage",
        action: "image-load-error",
        metadata: { src, alt },
      });
    }, [src, alt]);

    if (hasError) {
      return (
        <div
          className={`bg-gray-200 flex items-center justify-center ${className}`}
          style={{ width, height }}
        >
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`}>
        {placeholder === "blur" && blurDataURL && !isLoaded && (
          <Image
            src={blurDataURL}
            alt=""
            fill
            className="absolute inset-0 object-cover filter blur-sm"
            aria-hidden="true"
          />
        )}

        <Image
          ref={imgRef}
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          priority={priority}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          {...props}
        />
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();

    return () => {
      if (startTime.current) {
        const endTime = performance.now();
        const renderTime = endTime - startTime.current;

        // Log slow renders in development
        if (process.env.NODE_ENV === "development" && renderTime > 16) {
          console.warn(
            `Slow render in ${componentName}: ${renderTime.toFixed(
              2
            )}ms (render #${renderCount.current})`
          );
        }

        // Report to analytics in production
        if (process.env.NODE_ENV === "production" && renderTime > 100) {
          logUIError(`Slow render: ${renderTime.toFixed(2)}ms`, {
            component: componentName,
            action: "performance-warning",
            metadata: {
              renderTime,
              renderCount: renderCount.current,
            },
          });
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
  };
}

// Bundle splitting utility
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);

  const LazyWrapper = (props: React.ComponentProps<T>) => (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );

  LazyWrapper.displayName = `LazyWrapper(Component)`;

  return LazyWrapper;
}

// Virtual scrolling hook for large lists
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  const visibleItems = Math.ceil(containerHeight / itemHeight);

  const handleScroll = useThrottle((scrollTop: number) => {
    const newStartIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const newEndIndex = Math.min(
      items.length - 1,
      newStartIndex + visibleItems + overscan * 2
    );

    setStartIndex(newStartIndex);
    setEndIndex(newEndIndex);
  }, 16);

  const visibleItemsData = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: "absolute" as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
      },
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  return {
    visibleItems: visibleItemsData,
    totalHeight: items.length * itemHeight,
    handleScroll,
  };
}

// Web Workers utility for heavy computations
export function useWebWorker<T, R>(
  workerScript: string,
  dependencies: T[] = []
) {
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const execute = useCallback(
    (data: T) => {
      if (!workerRef.current) {
        try {
          workerRef.current = new Worker(workerScript);
        } catch (err) {
          setError(err as Error);
          return;
        }
      }

      setLoading(true);
      setError(null);

      const handleMessage = (event: MessageEvent<R>) => {
        setResult(event.data);
        setLoading(false);
      };

      const handleError = (err: ErrorEvent) => {
        setError(new Error(err.message));
        setLoading(false);
      };

      workerRef.current.addEventListener("message", handleMessage);
      workerRef.current.addEventListener("error", handleError);
      workerRef.current.postMessage(data);

      return () => {
        workerRef.current?.removeEventListener("message", handleMessage);
        workerRef.current?.removeEventListener("error", handleError);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workerScript, ...dependencies]
  );

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { result, loading, error, execute };
}
