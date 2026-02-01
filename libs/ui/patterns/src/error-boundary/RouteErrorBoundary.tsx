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
import { useLocation } from '@tanstack/react-router';
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { ErrorBoundary, type ErrorBoundaryFallbackProps } from './ErrorBoundary';
import { cn, Button } from '@nasnet/ui/primitives';

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
export function RouteErrorDisplay({
  error,
  reset,
  className,
}: RouteErrorDisplayProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  // Determine error type for contextual messaging
  const isNetworkError =
    error.message.includes('network') ||
    error.message.includes('Network') ||
    error.message.includes('fetch') ||
    error.name === 'NetworkError';

  const errorTitle = isNetworkError
    ? 'Connection Error'
    : 'Something went wrong';

  const errorDescription = isNetworkError
    ? 'Unable to load this page. Please check your connection and try again.'
    : 'We encountered an error loading this page. Please try again.';

  return (
    <div
      className={cn(
        'flex items-center justify-center min-h-[400px] p-6',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-error" aria-hidden="true" />
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {errorTitle}
        </h2>

        {/* Error Description */}
        <p className="text-muted-foreground mb-6">{errorDescription}</p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          {reset && (
            <Button onClick={reset} variant="default">
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>
          )}

          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Go Back
          </Button>
        </div>

        {/* Home Link */}
        <button
          onClick={handleGoHome}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Go to Dashboard
        </button>

        {/* Expandable Details */}
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-muted rounded-lg text-left">
              <p className="text-xs font-mono text-foreground break-all">
                {error.message}
              </p>
              {import.meta.env.DEV && error.stack && (
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-24">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Default fallback for RouteErrorBoundary
 */
function RouteErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  return <RouteErrorDisplay error={error} reset={resetErrorBoundary} />;
}

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
export function RouteErrorBoundary({
  children,
  onError,
  fallback,
  className,
}: RouteErrorBoundaryProps) {
  const location = useLocation();

  // Reset key based on pathname - boundary resets when route changes
  const resetKey = location.pathname;

  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      // Log error with route context
      console.error('[RouteErrorBoundary] Route error caught:', {
        error: error.message,
        route: location.pathname,
        search: location.search,
        timestamp: new Date().toISOString(),
      });

      onError?.(error, errorInfo);
    },
    [location.pathname, location.search, onError]
  );

  const defaultFallback = React.useCallback(
    (props: ErrorBoundaryFallbackProps) => (
      <RouteErrorFallback {...props} />
    ),
    []
  );

  return (
    <div className={className}>
      <ErrorBoundary
        resetKey={resetKey}
        fallback={fallback || defaultFallback}
        onError={handleError}
      >
        {children}
      </ErrorBoundary>
    </div>
  );
}
