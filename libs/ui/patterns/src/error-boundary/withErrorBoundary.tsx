/**
 * withErrorBoundary HOC
 * Higher-order component for declaratively wrapping components with error boundaries
 *
 * Provides a convenient way to add error boundary protection to components
 * without modifying the component's JSX structure.
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */

import * as React from 'react';
import { ComponentErrorBoundary, type ComponentErrorBoundaryProps } from './ComponentErrorBoundary';
import type { ErrorBoundaryFallbackProps } from './ErrorBoundary';

/**
 * Options for withErrorBoundary HOC
 */
export interface WithErrorBoundaryOptions {
  /** Custom fallback component */
  fallback?: React.ReactNode | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Name of the component (for error messages) */
  componentName?: string;
  /** Whether to use minimal error display */
  minimal?: boolean;
  /** Additional class name for error container */
  className?: string;
}

/**
 * Higher-order component that wraps a component with ComponentErrorBoundary
 *
 * @example Basic usage
 * ```tsx
 * const SafeWidget = withErrorBoundary(Widget);
 *
 * // Use in JSX
 * <SafeWidget data={data} />
 * ```
 *
 * @example With options
 * ```tsx
 * const SafeChart = withErrorBoundary(DataChart, {
 *   componentName: 'Traffic Chart',
 *   onError: (error) => analytics.trackError(error),
 *   minimal: true,
 * });
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * const SafeUserCard = withErrorBoundary(UserCard, {
 *   fallback: ({ error, resetErrorBoundary }) => (
 *     <div className="p-4 bg-amber-50 rounded">
 *       <p>User information unavailable</p>
 *       <button onClick={resetErrorBoundary}>Refresh</button>
 *     </div>
 *   ),
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.ComponentType<P> {
  const {
    fallback,
    onError,
    componentName = Component.displayName || Component.name || 'Component',
    minimal = false,
    className,
  } = options;

  const WrappedComponent = React.forwardRef<unknown, P>((props, ref) => (
    <ComponentErrorBoundary
      fallback={fallback}
      onError={onError}
      componentName={componentName}
      minimal={minimal}
      className={className}
    >
      <Component {...props} ref={ref} />
    </ComponentErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

  return WrappedComponent as React.ComponentType<P>;
}

/**
 * Hook to create error boundary wrapper with consistent options
 *
 * Useful when you want to wrap multiple components with the same error boundary config.
 *
 * @example
 * ```tsx
 * function DashboardWidgets() {
 *   const wrapWithErrorBoundary = useErrorBoundaryWrapper({
 *     onError: (error) => logError(error),
 *     minimal: true,
 *   });
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {wrapWithErrorBoundary(<CPUWidget />, 'CPU Stats')}
 *       {wrapWithErrorBoundary(<MemoryWidget />, 'Memory Stats')}
 *       {wrapWithErrorBoundary(<NetworkWidget />, 'Network Stats')}
 *     </div>
 *   );
 * }
 * ```
 */
export function useErrorBoundaryWrapper(
  options: Omit<ComponentErrorBoundaryProps, 'children' | 'componentName'> = {}
) {
  return React.useCallback(
    (children: React.ReactNode, componentName?: string) => (
      <ComponentErrorBoundary {...options} componentName={componentName}>
        {children}
      </ComponentErrorBoundary>
    ),
    [options]
  );
}
