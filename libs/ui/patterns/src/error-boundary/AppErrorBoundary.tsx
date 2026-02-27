/**
 * App Error Boundary
 * Outermost error boundary for catastrophic failures
 *
 * This boundary catches errors that escape all other boundaries,
 * typically provider initialization errors or unrecoverable crashes.
 * It displays a full-page error state with reload option.
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';

import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

import { ErrorBoundary, type ErrorBoundaryFallbackProps } from './ErrorBoundary';

/**
 * Props for AppErrorBoundary
 */
export interface AppErrorBoundaryProps {
  /** Children to render */
  children: React.ReactNode;
  /** Called when an error is caught (for logging/telemetry) */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Full-page error display for catastrophic failures
 */
function AppErrorFallback({ error, errorInfo, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReport = () => {
    // TODO: NAS-13.8 - Integrate with observability backend
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    console.log('[Error Report]:', errorReport);
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error details copied to clipboard');
  };

  return (
    <div
      className="bg-background flex min-h-screen items-center justify-center p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-card text-card-foreground border-border w-full max-w-lg rounded-xl border p-8 shadow-lg">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-error/10 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle
              className="text-error h-8 w-8"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-foreground mb-2 text-center text-2xl font-bold">Application Error</h1>

        {/* Error Message */}
        <p className="text-muted-foreground mb-6 text-center">
          {error.message || 'An unexpected error occurred'}
        </p>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={handleReload}
            className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />
            Reload Application
          </button>

          <button
            onClick={resetErrorBoundary}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-center gap-4 text-sm">
          <button
            onClick={handleGoHome}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <Home
              className="h-4 w-4"
              aria-hidden="true"
            />
            Go to Dashboard
          </button>

          <button
            onClick={handleReport}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <Bug
              className="h-4 w-4"
              aria-hidden="true"
            />
            Report Issue
          </button>
        </div>

        {/* Expandable Technical Details (dev mode always shows, prod requires click) */}
        {(import.meta.env.DEV || showDetails) && (
          <div className="border-border mt-6 border-t pt-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1 text-sm"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>
            <pre className="bg-muted text-foreground max-h-48 overflow-auto rounded-lg p-4 text-xs">
              <code>{error.stack}</code>
            </pre>
            {errorInfo?.componentStack && (
              <pre className="bg-muted text-foreground mt-2 max-h-32 overflow-auto rounded-lg p-4 text-xs">
                <code>Component Stack:{errorInfo.componentStack}</code>
              </pre>
            )}
          </div>
        )}

        {!import.meta.env.DEV && !showDetails && (
          <div className="border-border mt-6 border-t pt-6 text-center">
            <button
              onClick={() => setShowDetails(true)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Show technical details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * App-level Error Boundary
 *
 * Place this at the outermost level of your application (typically
 * wrapping all providers). It catches catastrophic errors that escape
 * all other boundaries.
 *
 * @example
 * ```tsx
 * // In main.tsx or App.tsx
 * <AppErrorBoundary onError={logToTelemetry}>
 *   <ApolloProvider>
 *     <ThemeProvider>
 *       <App />
 *     </ThemeProvider>
 *   </ApolloProvider>
 * </AppErrorBoundary>
 * ```
 */
export function AppErrorBoundary({ children, onError }: AppErrorBoundaryProps) {
  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      // Log error with structured format
      console.error('[AppErrorBoundary] Catastrophic error caught:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });

      // Call optional external error handler
      onError?.(error, errorInfo);
    },
    [onError]
  );

  return (
    <ErrorBoundary
      fallback={AppErrorFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}
