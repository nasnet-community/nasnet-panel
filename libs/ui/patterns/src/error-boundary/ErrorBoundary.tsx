/**
 * Error Boundary Components
 * Hierarchical error boundaries for graceful error handling
 *
 * Architecture:
 * - AppErrorBoundary (outermost) - catastrophic failures, full-page error
 * - RouteErrorBoundary (middle) - route-level errors, per-route isolation
 * - ComponentErrorBoundary (innermost) - feature-level errors, inline recovery
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';

/**
 * Error information passed to fallback components
 */
export interface ErrorBoundaryFallbackProps {
  /** The error that was caught */
  error: Error;
  /** Error info from React (component stack) */
  errorInfo?: React.ErrorInfo;
  /** Reset the error boundary state (allows retry) */
  resetErrorBoundary: () => void;
}

/**
 * Props for the base ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Children to render */
  children: React.ReactNode;
  /** Fallback UI to show when an error occurs */
  fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Called when the error boundary is reset */
  onReset?: () => void;
  /** Key to reset the boundary when changed (e.g., route path) */
  resetKey?: string | number;
}

/**
 * Internal state for the error boundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Base Error Boundary Component
 *
 * A class component that catches JavaScript errors anywhere in its child
 * component tree, logs those errors, and displays a fallback UI.
 *
 * Features:
 * - Catches render errors, lifecycle method errors, constructor errors
 * - Configurable fallback UI (static or function)
 * - Reset capability for retry functionality
 * - Error logging callback
 * - Key-based reset for route changes
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={({ error, resetErrorBoundary }) => (
 *     <div>
 *       <p>Something went wrong: {error.message}</p>
 *       <button onClick={resetErrorBoundary}>Retry</button>
 *     </div>
 *   )}
 *   onError={(error, info) => console.error(error, info)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Log the error and call the onError callback
   */
  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Update state with errorInfo
    this.setState({ errorInfo });

    // Log error in development
    if (import.meta.env.DEV) {
      console.group('[ErrorBoundary] Caught error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Reset when resetKey changes
   */
  override componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.resetErrorBoundary();
    }
  }

  /**
   * Reset the error boundary state
   */
  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): React.ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Render fallback UI
      if (typeof fallback === 'function') {
        return fallback({
          error,
          errorInfo: errorInfo ?? undefined,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      if (fallback) {
        return fallback;
      }

      // Default fallback if none provided
      return (
        <div
          role="alert"
          className="border-error/30 bg-error/10 rounded-lg border p-4"
        >
          <h3 className="text-error font-medium">Something went wrong</h3>
          <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
          <button
            onClick={this.resetErrorBoundary}
            className="bg-error hover:bg-error/90 mt-3 rounded px-3 py-1.5 text-sm text-white"
          >
            Try again
          </button>
        </div>
      );
    }

    return children;
  }
}
