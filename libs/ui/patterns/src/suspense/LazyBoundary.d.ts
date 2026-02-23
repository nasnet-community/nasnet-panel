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
import React, { type ReactNode, type ErrorInfo, type ComponentType } from 'react';
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
export declare function SkeletonLoader({ rows, rowHeight, showTitle, className, variant, }: SkeletonLoaderProps): import("react/jsx-runtime").JSX.Element;
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
export declare function LazyBoundary({ children, fallback, errorFallback, onError, className, skeletonVariant, skeletonRows, }: LazyBoundaryProps): import("react/jsx-runtime").JSX.Element;
export declare namespace LazyBoundary {
    var displayName: string;
}
export interface WithLazyBoundaryOptions extends Omit<LazyBoundaryProps, 'children'> {
}
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
export declare function withLazyBoundary<P extends object>(Component: ComponentType<P>, options?: WithLazyBoundaryOptions): ComponentType<P>;
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
export declare function preloadComponent(importFn: () => Promise<unknown>): void;
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
export declare function createLazyWithPreload<T extends ComponentType<any>>(importFn: () => Promise<{
    default: T;
}>): [React.LazyExoticComponent<T>, () => void];
//# sourceMappingURL=LazyBoundary.d.ts.map