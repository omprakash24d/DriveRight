'use client';

import { ErrorService } from '@/lib/error-service';
import React, { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  component: string;
  renderTime?: number;
  mountTime?: number;
  metadata?: Record<string, any>;
}

/**
 * Hook to monitor component performance
 */
export function usePerformanceMonitoring(componentName: string, metadata?: Record<string, any>) {
  const mountTimeRef = useRef<number>();
  const renderStartRef = useRef<number>();

  useEffect(() => {
    // Record mount time
    mountTimeRef.current = performance.now();
    
    return () => {
      // Record unmount and calculate total mount time
      if (mountTimeRef.current) {
        const totalMountTime = performance.now() - mountTimeRef.current;
        
        if (totalMountTime > 1000) { // Only log if mount time > 1 second
          ErrorService.trackPerformance({
            operation: `${componentName}_mount`,
            duration: totalMountTime,
            metadata: {
              ...metadata,
              threshold: 'slow_mount'
            }
          });
        }
      }
    };
  }, [componentName, metadata]);

  const startRenderMeasurement = () => {
    renderStartRef.current = performance.now();
  };

  const endRenderMeasurement = () => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current;
      
      if (renderTime > 100) { // Only log if render time > 100ms
        ErrorService.trackPerformance({
          operation: `${componentName}_render`,
          duration: renderTime,
          metadata: {
            ...metadata,
            threshold: 'slow_render'
          }
        });
      }
      
      renderStartRef.current = undefined;
    }
  };

  return {
    startRenderMeasurement,
    endRenderMeasurement
  };
}

/**
 * HOC to wrap components with performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  const PerformanceMonitoredComponent: React.FC<P> = (props: P) => {
    const name = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    const { startRenderMeasurement, endRenderMeasurement } = usePerformanceMonitoring(name);

    useEffect(() => {
      startRenderMeasurement();
      endRenderMeasurement();
    });

    return React.createElement(WrappedComponent, props);
  };
  
  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;
  
  return PerformanceMonitoredComponent;
}

/**
 * Utility function to measure async operations
 */
export async function measureAsyncOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    ErrorService.trackPerformance({
      operation: operationName,
      duration,
      metadata: {
        ...metadata,
        status: 'success'
      }
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    ErrorService.trackPerformance({
      operation: operationName,
      duration,
      metadata: {
        ...metadata,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    throw error;
  }
}

/**
 * Hook to monitor API call performance
 */
export function useApiPerformanceMonitoring() {
  const measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    return measureAsyncOperation(
      apiCall,
      `api_${method.toLowerCase()}_${endpoint.replace(/\//g, '_')}`,
      {
        endpoint,
        method,
        type: 'api_call'
      }
    );
  };

  return { measureApiCall };
}

/**
 * Hook to monitor database operation performance
 */
export function useDatabasePerformanceMonitoring() {
  const measureDatabaseOperation = async <T>(
    operation: () => Promise<T>,
    operationType: string,
    collection?: string
  ): Promise<T> => {
    return measureAsyncOperation(
      operation,
      `db_${operationType}`,
      {
        collection,
        type: 'database_operation'
      }
    );
  };

  return { measureDatabaseOperation };
}
