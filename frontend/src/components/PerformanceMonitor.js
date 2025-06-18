import { useEffect, useRef } from 'react';

/**
 * Performance monitoring component for production
 * Tracks component render times and performance metrics
 */
const PerformanceMonitor = ({ 
  componentName, 
  children, 
  threshold = 100, // ms
  onSlowRender = null 
}) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        totalRenderTime.current += renderTime;

        // Log slow renders in development
        if (process.env.NODE_ENV === 'development' && renderTime > threshold) {
          console.warn(
            `🐌 Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
          );
        }

        // Call custom slow render handler
        if (renderTime > threshold && onSlowRender) {
          onSlowRender({
            componentName,
            renderTime,
            renderCount: renderCount.current,
            averageRenderTime: totalRenderTime.current / renderCount.current
          });
        }

        // Report to performance monitoring service in production
        if (process.env.NODE_ENV === 'production' && renderTime > threshold * 2) {
          // Example: Send to performance monitoring service
          // performanceService.trackSlowRender({
          //   component: componentName,
          //   renderTime,
          //   threshold,
          //   timestamp: Date.now()
          // });
        }
      }
    };
  });

  return children;
};

/**
 * Hook for monitoring component performance
 */
export const usePerformanceMonitor = (componentName, threshold = 100) => {
  const renderStartTime = useRef(null);
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        totalRenderTime.current += renderTime;

        if (process.env.NODE_ENV === 'development' && renderTime > threshold) {
          console.warn(
            `🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`
          );
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderCount.current > 0 
      ? totalRenderTime.current / renderCount.current 
      : 0
  };
};

/**
 * HOC for wrapping components with performance monitoring
 */
export const withPerformanceMonitor = (Component, componentName, threshold = 100) => {
  return function PerformanceMonitoredComponent(props) {
    return (
      <PerformanceMonitor 
        componentName={componentName || Component.displayName || Component.name}
        threshold={threshold}
      >
        <Component {...props} />
      </PerformanceMonitor>
    );
  };
};

/**
 * Performance metrics collector
 */
export class PerformanceMetrics {
  static metrics = new Map();

  static recordMetric(name, value, type = 'timing') {
    const timestamp = Date.now();
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({
      value,
      type,
      timestamp
    });

    // Keep only last 100 entries per metric
    const entries = this.metrics.get(name);
    if (entries.length > 100) {
      entries.splice(0, entries.length - 100);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance metric: ${name} = ${value}${type === 'timing' ? 'ms' : ''}`);
    }
  }

  static getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  static getAverageMetric(name) {
    const entries = this.getMetrics(name);
    if (entries.length === 0) return 0;
    
    const sum = entries.reduce((acc, entry) => acc + entry.value, 0);
    return sum / entries.length;
  }

  static getAllMetrics() {
    const result = {};
    for (const [name, entries] of this.metrics.entries()) {
      result[name] = {
        count: entries.length,
        average: this.getAverageMetric(name),
        latest: entries[entries.length - 1]?.value || 0,
        entries: entries.slice(-10) // Last 10 entries
      };
    }
    return result;
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}

/**
 * Hook for measuring operation performance
 */
export const usePerformanceMeasure = () => {
  const measureOperation = (name, operation) => {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      Promise.resolve(operation())
        .then(result => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          PerformanceMetrics.recordMetric(name, duration);
          resolve(result);
        })
        .catch(error => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          PerformanceMetrics.recordMetric(`${name}_error`, duration);
          reject(error);
        });
    });
  };

  const measureSync = (name, operation) => {
    const startTime = performance.now();
    try {
      const result = operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      PerformanceMetrics.recordMetric(name, duration);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      PerformanceMetrics.recordMetric(`${name}_error`, duration);
      throw error;
    }
  };

  return { measureOperation, measureSync };
};

/**
 * Component for displaying performance metrics in development
 */
export const PerformanceDebugger = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const metrics = PerformanceMetrics.getAllMetrics();

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h4>Performance Metrics</h4>
      {Object.entries(metrics).map(([name, data]) => (
        <div key={name} style={{ marginBottom: '5px' }}>
          <strong>{name}:</strong> {data.average.toFixed(2)}ms avg
          <br />
          <small>Count: {data.count}, Latest: {data.latest.toFixed(2)}ms</small>
        </div>
      ))}
      <button 
        onClick={() => PerformanceMetrics.clearMetrics()}
        style={{
          background: '#ff4444',
          color: 'white',
          border: 'none',
          padding: '5px',
          borderRadius: '3px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Clear Metrics
      </button>
    </div>
  );
};

export default PerformanceMonitor;
