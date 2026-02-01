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
function AppErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
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
      className="min-h-screen flex items-center justify-center bg-background p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-lg w-full bg-card text-card-foreground rounded-xl shadow-lg border border-border p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-error" aria-hidden="true" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          Application Error
        </h1>

        {/* Error Message */}
        <p className="text-center text-muted-foreground mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={handleReload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Reload Application
          </button>

          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-center gap-4 text-sm">
          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go to Dashboard
          </button>

          <button
            onClick={handleReport}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bug className="w-4 h-4" aria-hidden="true" />
            Report Issue
          </button>
        </div>

        {/* Expandable Technical Details (dev mode always shows, prod requires click) */}
        {(import.meta.env.DEV || showDetails) && (
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1"
            >
              {showDetails ? 'Hide' : 'Show'} technical details
            </button>
            <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-48 text-foreground">
              <code>{error.stack}</code>
            </pre>
            {errorInfo?.componentStack && (
              <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-32 text-foreground">
                <code>Component Stack:{errorInfo.componentStack}</code>
              </pre>
            )}
          </div>
        )}

        {!import.meta.env.DEV && !showDetails && (
          <div className="mt-6 pt-6 border-t border-border text-center">
            <button
              onClick={() => setShowDetails(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
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
export function AppErrorBoundary({
  children,
  onError,
}: AppErrorBoundaryProps) {
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
    <ErrorBoundary fallback={AppErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}
