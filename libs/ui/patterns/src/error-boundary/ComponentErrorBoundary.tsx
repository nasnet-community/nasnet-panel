/**
 * Component Error Boundary
 * Feature-level error handling with inline recovery
 *
 * The innermost error boundary for individual components/widgets.
 * Shows an inline error card that doesn't disrupt the rest of the page.
 *
 * Features:
 * - Inline error display (card-style)
 * - Retry functionality
 * - Minimal visual footprint
 * - Doesn't disrupt surrounding UI
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';

import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

import { cn, Button, Card, CardContent } from '@nasnet/ui/primitives';

import { ErrorBoundary, type ErrorBoundaryFallbackProps } from './ErrorBoundary';

/**
 * Props for ComponentErrorBoundary
 */
export interface ComponentErrorBoundaryProps {
  /** Children to render */
  children: React.ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Custom fallback component */
  fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  /** Name of the component (for error messages) */
  componentName?: string;
  /** Additional class name for the container */
  className?: string;
  /** Whether to show a minimal error state */
  minimal?: boolean;
}

/**
 * Props for the inline error card
 */
export interface InlineErrorCardProps {
  /** The error that occurred */
  error: Error;
  /** Reset function for retry */
  reset?: () => void;
  /** Component name for context */
  componentName?: string;
  /** Additional class name */
  className?: string;
  /** Whether to show minimal variant */
  minimal?: boolean;
}

/**
 * Inline Error Card Component
 *
 * A compact error display that fits within the normal page flow.
 * Used for component-level errors that shouldn't disrupt the entire page.
 *
 * @example
 * ```tsx
 * <InlineErrorCard
 *   error={error}
 *   reset={retry}
 *   componentName="User Profile"
 * />
 * ```
 */
export function InlineErrorCard({
  error,
  reset,
  componentName,
  className,
  minimal = false,
}: InlineErrorCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  if (minimal) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-sm',
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" aria-hidden="true" />
        <span className="text-error flex-1 truncate">
          {componentName ? `${componentName} failed to load` : 'Failed to load'}
        </span>
        {reset && (
          <button
            onClick={reset}
            className="text-error hover:text-error/80 p-1 rounded"
            aria-label="Retry loading"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn('border-error/30 bg-error/5', className)}
      role="alert"
      aria-live="polite"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Error Icon */}
          <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-error" aria-hidden="true" />
          </div>

          {/* Error Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">
              {componentName
                ? `${componentName} couldn't load`
                : "This section couldn't load"}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              An error occurred while loading this content.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-3">
              {reset && (
                <Button size="sm" variant="outline" onClick={reset}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Retry
                </Button>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-expanded={showDetails}
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                    Show details
                  </>
                )}
              </button>
            </div>

            {/* Expandable Details */}
            {showDetails && (
              <div className="mt-3 p-2 bg-muted rounded text-xs font-mono text-foreground break-all">
                {error.message}
                {import.meta.env.DEV && error.stack && (
                  <pre className="mt-2 text-muted-foreground overflow-auto max-h-24 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Default fallback for ComponentErrorBoundary
 */
function ComponentErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  return <InlineErrorCard error={error} reset={resetErrorBoundary} />;
}

/**
 * Component-level Error Boundary
 *
 * Wraps individual components/widgets to provide isolated error handling.
 * When an error occurs, only the wrapped component shows an error state,
 * allowing the rest of the page to function normally.
 *
 * @example Basic usage
 * ```tsx
 * <ComponentErrorBoundary componentName="User Statistics">
 *   <UserStatsWidget />
 * </ComponentErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ComponentErrorBoundary
 *   fallback={<MyCustomErrorState />}
 *   onError={(error) => logError(error)}
 * >
 *   <DataChart />
 * </ComponentErrorBoundary>
 * ```
 *
 * @example Minimal variant (inline)
 * ```tsx
 * <ComponentErrorBoundary minimal componentName="Quick Stats">
 *   <QuickStatsRow />
 * </ComponentErrorBoundary>
 * ```
 */
export function ComponentErrorBoundary({
  children,
  onError,
  fallback,
  componentName,
  className,
  minimal = false,
}: ComponentErrorBoundaryProps) {
  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      // Log error with component context
      console.error('[ComponentErrorBoundary] Component error caught:', {
        error: error.message,
        component: componentName || 'Unknown',
        timestamp: new Date().toISOString(),
      });

      onError?.(error, errorInfo);
    },
    [componentName, onError]
  );

  const defaultFallback = React.useCallback(
    (props: ErrorBoundaryFallbackProps) => (
      <InlineErrorCard
        error={props.error}
        reset={props.resetErrorBoundary}
        componentName={componentName}
        className={className}
        minimal={minimal}
      />
    ),
    [componentName, className, minimal]
  );

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}
