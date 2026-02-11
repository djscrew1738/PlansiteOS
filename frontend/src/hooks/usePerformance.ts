import { useEffect } from 'react';

/**
 * Web Vitals metric types
 */
interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Collect and report Web Vitals performance metrics.
 * In production, these can be sent to an analytics endpoint.
 */
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only measure in production or when explicitly enabled
    if (!import.meta.env.PROD && !import.meta.env.VITE_ENABLE_PERF) return;

    const reportMetric = (metric: WebVitalMetric) => {
      // Log to console in development
      if (!import.meta.env.PROD) {
        console.debug(`[WebVital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
        return;
      }

      // In production, send to analytics endpoint
      // Replace with your monitoring service (DataDog, New Relic, etc.)
      if (navigator.sendBeacon) {
        const body = JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          url: window.location.pathname,
          timestamp: Date.now(),
        });
        navigator.sendBeacon('/api/metrics/vitals', body);
      }
    };

    // Dynamically import web-vitals (tree-shakeable, optional dependency)
    // Install with: npm install web-vitals
    // @ts-ignore - web-vitals is an optional dependency
    import('web-vitals').then((module: Record<string, unknown>) => {
      const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = module as {
        onCLS: (cb: (m: WebVitalMetric) => void) => void;
        onFID: (cb: (m: WebVitalMetric) => void) => void;
        onFCP: (cb: (m: WebVitalMetric) => void) => void;
        onLCP: (cb: (m: WebVitalMetric) => void) => void;
        onTTFB: (cb: (m: WebVitalMetric) => void) => void;
        onINP: (cb: (m: WebVitalMetric) => void) => void;
      };
      onCLS?.(reportMetric);
      onFID?.(reportMetric);
      onFCP?.(reportMetric);
      onLCP?.(reportMetric);
      onTTFB?.(reportMetric);
      onINP?.(reportMetric);
    }).catch(() => {
      // web-vitals not installed - that's OK, it's optional
    });
  }, []);
}

/**
 * Measure and log component render performance in development.
 */
export function useRenderTime(componentName: string) {
  useEffect(() => {
    if (import.meta.env.PROD) return;

    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) {
        // Warn if render takes longer than one frame (16ms)
        console.warn(`[Perf] ${componentName} render took ${renderTime.toFixed(1)}ms`);
      }
    };
  });
}
