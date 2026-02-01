/**
 * @fileoverview Suspense boundary wrapper for lazy-loaded components
 *
 * Provides a reusable Suspense wrapper with customizable fallback UI.
 * Includes built-in skeleton loaders and error boundaries.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LazyBoundary>
 *   <LazyChart data={data} />
 * </LazyBoundary>
 *
 * // Custom fallback
 * <LazyBoundary fallback={<ChartSkeleton />}>
 *   <LazyChart data={data} />
 * </LazyBoundary>
 *
 * // With error boundary
 * <LazyBoundary
 *   errorFallback={(error) => <ChartError error={error} />}
 * >
 *   <LazyChart data={data} />
 * </LazyBoundary>
 * ```
 */

import React, {
  Suspense,
  Component,
  type ReactNode,
  type ErrorInfo,
  type ComponentType,
} from 'react';

import { cn } from '@nasnet/ui/primitives';

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Error boundary component for catching render errors
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error('LazyBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.resetError);
      }

      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="text-destructive font-medium mb-2">Something went wrong</div>
          <button
            onClick={this.resetError}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Loading Skeletons
// ============================================================================

export interface SkeletonLoaderProps {
  /** Number of skeleton rows to show */
  rows?: number;
  /** Height of each row */
  rowHeight?: number;
  /** Show a title skeleton */
  showTitle?: boolean;
  /** Custom className */
  className?: string;
  /** Variant of skeleton */
  variant?: 'lines' | 'card' | 'table' | 'chart';
}

/**
 * Generic skeleton loader for suspense fallbacks
 */
export function SkeletonLoader({
  rows = 3,
  rowHeight = 16,
  showTitle = false,
  className,
  variant = 'lines',
}: SkeletonLoaderProps) {
  const baseClass = 'animate-pulse bg-muted rounded';

  switch (variant) {
    case 'card':
      return (
        <div className={cn('p-4 space-y-4', className)}>
          <div className={cn(baseClass, 'h-6 w-1/2')} />
          <div className={cn(baseClass, 'h-32 w-full')} />
          <div className="flex gap-2">
            <div className={cn(baseClass, 'h-8 w-20')} />
            <div className={cn(baseClass, 'h-8 w-20')} />
          </div>
        </div>
      );

    case 'table':
      return (
        <div className={cn('space-y-2', className)}>
          {/* Header */}
          <div className="flex gap-4 pb-2 border-b">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(baseClass, 'h-4 flex-1')} />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className={cn(baseClass, 'h-4 flex-1')} />
              ))}
            </div>
          ))}
        </div>
      );

    case 'chart':
      return (
        <div className={cn('p-4', className)}>
          {showTitle && <div className={cn(baseClass, 'h-6 w-1/3 mb-4')} />}
          <div className={cn(baseClass, 'h-48 w-full')} />
        </div>
      );

    case 'lines':
    default:
      return (
        <div className={cn('space-y-2', className)}>
          {showTitle && <div className={cn(baseClass, 'h-6 w-1/3 mb-4')} />}
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className={baseClass}
              style={{
                height: rowHeight,
                width: `${100 - Math.random() * 30}%`,
              }}
            />
          ))}
        </div>
      );
  }
}

// ============================================================================
// Lazy Boundary Component
// ============================================================================

export interface LazyBoundaryProps {
  /** Content to render (usually lazy-loaded components) */
  children: ReactNode;
  /** Suspense fallback UI */
  fallback?: ReactNode;
  /** Error boundary fallback UI */
  errorFallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Delay before showing fallback (prevents flash for fast loads) */
  delay?: number;
  /** Minimum time to show fallback (prevents flash) */
  minDuration?: number;
  /** Custom className for wrapper */
  className?: string;
  /** Skeleton variant for default fallback */
  skeletonVariant?: SkeletonLoaderProps['variant'];
  /** Number of skeleton rows */
  skeletonRows?: number;
}

/**
 * A reusable Suspense wrapper with error boundary and customizable fallbacks
 *
 * @example
 * ```tsx
 * const LazyChart = lazy(() => import('./Chart'));
 *
 * function Dashboard() {
 *   return (
 *     <LazyBoundary
 *       fallback={<SkeletonLoader variant="chart" />}
 *       errorFallback={(error, reset) => (
 *         <div>
 *           <p>Failed to load chart: {error?.message}</p>
 *           <button onClick={reset}>Retry</button>
 *         </div>
 *       )}
 *     >
 *       <LazyChart data={data} />
 *     </LazyBoundary>
 *   );
 * }
 * ```
 */
export function LazyBoundary({
  children,
  fallback,
  errorFallback,
  onError,
  className,
  skeletonVariant = 'lines',
  skeletonRows = 3,
}: LazyBoundaryProps) {
  const suspenseFallback = fallback ?? (
    <SkeletonLoader variant={skeletonVariant} rows={skeletonRows} />
  );

  return (
    <div className={className}>
      <ErrorBoundary fallback={errorFallback} onError={onError}>
        <Suspense fallback={suspenseFallback}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  );
}

LazyBoundary.displayName = 'LazyBoundary';

// ============================================================================
// Higher-Order Component for Lazy Loading
// ============================================================================

export interface WithLazyBoundaryOptions extends Omit<LazyBoundaryProps, 'children'> {}

/**
 * HOC to wrap a component with LazyBoundary
 *
 * @example
 * ```tsx
 * const Chart = lazy(() => import('./Chart'));
 * const ChartWithBoundary = withLazyBoundary(Chart, {
 *   fallback: <ChartSkeleton />,
 * });
 *
 * // Use directly
 * <ChartWithBoundary data={data} />
 * ```
 */
export function withLazyBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithLazyBoundaryOptions = {}
): ComponentType<P> {
  const Wrapped = (props: P) => (
    <LazyBoundary {...options}>
      <Component {...props} />
    </LazyBoundary>
  );

  Wrapped.displayName = `WithLazyBoundary(${Component.displayName || Component.name || 'Component'})`;

  return Wrapped;
}

// ============================================================================
// Preload Utilities
// ============================================================================

/**
 * Preload a lazy component by calling its import function
 *
 * @example
 * ```tsx
 * const LazyChart = lazy(() => import('./Chart'));
 *
 * // Preload on hover
 * <button
 *   onMouseEnter={() => preloadComponent(() => import('./Chart'))}
 *   onClick={() => setShowChart(true)}
 * >
 *   Show Chart
 * </button>
 * ```
 */
export function preloadComponent(importFn: () => Promise<unknown>): void {
  void importFn();
}

/**
 * Create a lazy component with preload capability
 *
 * @example
 * ```tsx
 * const [LazyChart, preloadChart] = createLazyWithPreload(
 *   () => import('./Chart')
 * );
 *
 * // Preload on hover
 * <button onMouseEnter={preloadChart}>Show Chart</button>
 *
 * // Render
 * <LazyBoundary>
 *   <LazyChart data={data} />
 * </LazyBoundary>
 * ```
 */
export function createLazyWithPreload<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): [React.LazyExoticComponent<T>, () => void] {
  const LazyComponent = React.lazy(importFn);
  const preload = () => {
    void importFn();
  };

  return [LazyComponent, preload];
}
