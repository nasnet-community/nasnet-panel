/**
 * Error Boundary Components
 * Hierarchical error boundaries for graceful error handling
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

// Base Error Boundary
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps, ErrorBoundaryFallbackProps } from './ErrorBoundary';

// App-level Error Boundary (outermost)
export { AppErrorBoundary } from './AppErrorBoundary';
export type { AppErrorBoundaryProps } from './AppErrorBoundary';

// Route-level Error Boundary (middle)
export { RouteErrorBoundary, RouteErrorDisplay } from './RouteErrorBoundary';
export type { RouteErrorBoundaryProps, RouteErrorDisplayProps } from './RouteErrorBoundary';

// Component-level Error Boundary (innermost)
export { ComponentErrorBoundary, InlineErrorCard } from './ComponentErrorBoundary';
export type { ComponentErrorBoundaryProps, InlineErrorCardProps } from './ComponentErrorBoundary';

// HOC and utilities
export { withErrorBoundary, useErrorBoundaryWrapper } from './withErrorBoundary';
export type { WithErrorBoundaryOptions } from './withErrorBoundary';
