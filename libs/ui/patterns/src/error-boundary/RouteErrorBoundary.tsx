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

import { cn, Button } from '@nasnet/ui/primitives';

import { ErrorBoundary, type ErrorBoundaryFallbackProps } from './ErrorBoundary';

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
export function RouteErrorDisplay({ error, reset, className }: RouteErrorDisplayProps) {
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

  const errorTitle = isNetworkError ? 'Connection Error' : 'Something went wrong';

  const errorDescription =
    isNetworkError ?
      'Unable to load this page. Please check your connection and try again.'
    : 'We encountered an error loading this page. Please try again.';

  return (
    <div
      className={cn('flex min-h-[400px] items-center justify-center p-6', className)}
      role="alert"
      aria-live="polite"
    >
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-4 flex justify-center">
          <div className="bg-error/10 flex h-14 w-14 items-center justify-center rounded-2xl">
            <AlertCircle
              className="text-error h-7 w-7"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Error Title */}
        <h2 className="text-foreground mb-2 text-xl font-semibold">{errorTitle}</h2>

        {/* Error Description */}
        <p className="text-muted-foreground mb-6">{errorDescription}</p>

        {/* Action Buttons */}
        <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
          {reset && (
            <Button
              onClick={reset}
              variant="default"
            >
              <RefreshCw
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Try Again
            </Button>
          )}

          <Button
            onClick={handleGoBack}
            variant="outline"
          >
            <ArrowLeft
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            Go Back
          </Button>
        </div>

        {/* Home Link */}
        <button
          onClick={handleGoHome}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <Home
            className="h-4 w-4"
            aria-hidden="true"
          />
          Go to Dashboard
        </button>

        {/* Expandable Details */}
        <div className="border-border mt-6 border-t pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          {showDetails && (
            <div className="bg-muted mt-3 rounded-lg p-3 text-left">
              <p className="text-foreground break-all font-mono text-xs">{error.message}</p>
              {import.meta.env.DEV && error.stack && (
                <pre className="text-muted-foreground mt-2 max-h-24 overflow-auto text-xs">
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
function RouteErrorFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  return (
    <RouteErrorDisplay
      error={error}
      reset={resetErrorBoundary}
    />
  );
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
    (props: ErrorBoundaryFallbackProps) => <RouteErrorFallback {...props} />,
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
