/**
 * LazyRoute Utilities
 *
 * Helper functions for creating lazy-loaded routes with TanStack Router.
 * Provides consistent lazy loading with preloading support.
 *
 * @module @nasnet/ui/patterns/suspense
 */
import React, { type ComponentType } from 'react';
export interface LazyRouteConfig<T extends ComponentType<object>> {
    /** Import function for the route component */
    importFn: () => Promise<{
        default: T;
    }>;
    /** Skeleton component to show during loading */
    skeleton?: React.ReactNode;
    /** Error component to show on load failure */
    errorComponent?: React.ReactNode | ((error: Error) => React.ReactNode);
    /** Preload the component (e.g., on hover) */
    preload?: boolean;
}
export interface LazyRouteResult<T extends ComponentType<object>> {
    /** Lazy component */
    Component: React.LazyExoticComponent<T>;
    /** Pending component for TanStack Router */
    pendingComponent: () => React.JSX.Element | null;
    /** Error component for TanStack Router */
    errorComponent?: (error: Error) => React.JSX.Element;
    /** Preload function to call before navigation */
    preload: () => void;
}
/**
 * Creates a lazy route configuration for TanStack Router.
 *
 * Returns a Component, pendingComponent, and preload function that can be
 * used with TanStack Router's createLazyFileRoute or createRoute.
 *
 * @example
 * ```tsx
 * // Create lazy route
 * const dashboardRoute = createLazyRoute({
 *   importFn: () => import('./pages/Dashboard'),
 *   skeleton: <DashboardSkeleton />,
 * });
 *
 * // Use with TanStack Router
 * export const Route = createFileRoute('/dashboard')({
 *   component: dashboardRoute.Component,
 *   pendingComponent: dashboardRoute.pendingComponent,
 * });
 *
 * // Preload on hover
 * <Link
 *   to="/dashboard"
 *   onMouseEnter={dashboardRoute.preload}
 * >
 *   Dashboard
 * </Link>
 * ```
 */
export declare function createLazyRoute<T extends ComponentType<object>>({ importFn, skeleton, errorComponent, }: LazyRouteConfig<T>): LazyRouteResult<T>;
/**
 * Preloads multiple routes in the background.
 * Useful for preloading likely navigation targets.
 *
 * @example
 * ```tsx
 * // Preload common routes after initial render
 * useEffect(() => {
 *   preloadRoutes([
 *     () => import('./pages/Dashboard'),
 *     () => import('./pages/Settings'),
 *   ]);
 * }, []);
 * ```
 */
export declare function preloadRoutes(importFns: Array<() => Promise<{
    default: ComponentType<object>;
}>>): void;
/**
 * Creates handlers for preloading a route on hover/focus.
 *
 * @example
 * ```tsx
 * const preloadHandlers = useRoutePreload(() => import('./pages/Settings'));
 *
 * <Link to="/settings" {...preloadHandlers}>
 *   Settings
 * </Link>
 * ```
 */
export declare function createPreloadHandlers(importFn: () => Promise<{
    default: ComponentType<object>;
}>): {
    onMouseEnter: () => void;
    onFocus: () => void;
};
//# sourceMappingURL=LazyRoute.d.ts.map