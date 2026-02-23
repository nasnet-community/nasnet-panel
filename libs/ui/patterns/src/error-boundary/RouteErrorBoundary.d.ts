/**
 * Route Error Boundary
 * Route-level error handling for per-route isolation
 *
 * Works with TanStack Router's errorComponent while also catching
 * runtime errors within successfully loaded routes.
 *
 * Features:
 * - Route-level error isolation (errors don't affect other routes)
 * - Auto-reset on route change (via resetKey)
 * - Integration with TanStack Router's error format
 * - User-friendly error display with navigation options
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */
import * as React from 'react';
import { type ErrorBoundaryFallbackProps } from './ErrorBoundary';
/**
 * Props for RouteErrorBoundary
 */
export interface RouteErrorBoundaryProps {
    /** Children to render */
    children: React.ReactNode;
    /** Called when an error is caught */
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    /** Custom fallback component */
    fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
    /** Additional class name for the error container */
    className?: string;
}
/**
 * Props for standalone route error display (TanStack Router errorComponent)
 */
export interface RouteErrorDisplayProps {
    /** The error that occurred */
    error: Error;
    /** Reset function (from TanStack Router or manual) */
    reset?: () => void;
    /** Additional class name */
    className?: string;
}
/**
 * Route Error Display Component
 *
 * Can be used both as a fallback in RouteErrorBoundary and as
 * a TanStack Router errorComponent.
 *
 * @example TanStack Router usage:
 * ```tsx
 * export const Route = createFileRoute('/router/$id')({
 *   errorComponent: ({ error, reset }) => (
 *     <RouteErrorDisplay error={error} reset={reset} />
 *   ),
 * });
 * ```
 */
export declare function RouteErrorDisplay({ error, reset, className, }: RouteErrorDisplayProps): import("react/jsx-runtime").JSX.Element;
/**
 * Route-level Error Boundary
 *
 * Wraps route content to isolate errors to specific routes.
 * Automatically resets when the route changes.
 *
 * @example
 * ```tsx
 * // In a route component
 * function RouterDetailsPage() {
 *   return (
 *     <RouteErrorBoundary>
 *       <RouterDetails />
 *     </RouteErrorBoundary>
 *   );
 * }
 * ```
 *
 * @example Using with TanStack Router layouts
 * ```tsx
 * // In a layout route
 * export const Route = createFileRoute('/_layout')({
 *   component: () => (
 *     <RouteErrorBoundary>
 *       <Outlet />
 *     </RouteErrorBoundary>
 *   ),
 * });
 * ```
 */
export declare function RouteErrorBoundary({ children, onError, fallback, className, }: RouteErrorBoundaryProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RouteErrorBoundary.d.ts.map