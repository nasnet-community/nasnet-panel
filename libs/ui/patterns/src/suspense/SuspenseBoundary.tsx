/**
 * SuspenseBoundary Component
 *
 * Route-level Suspense wrapper with named skeleton fallbacks.
 * Designed for use with TanStack Router's pendingComponent pattern.
 *
 * Accessibility:
 * - Sets aria-busy on loading container
 * - Uses aria-label for context
 * - Integrates with error boundaries
 *
 * @module @nasnet/ui/patterns/suspense
 */

import React, { Suspense, Component, type ReactNode, type ErrorInfo } from 'react';

import { cn } from '@nasnet/ui/primitives';

// ============================================================================
// Types
// ============================================================================

export interface SuspenseBoundaryProps {
  /** Content to render (lazy components) */
  children: ReactNode;
  /** Fallback UI during suspense */
  fallback: ReactNode;
  /** Name for accessibility and debugging */
  name: string;
  /** Error fallback UI */
  errorFallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Error Boundary (Class Component)
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  name: string;
}

class SuspenseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    console.error(`SuspenseBoundary "${this.props.name}" caught error:`, error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.resetError);
      }

      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div
          className="flex flex-col items-center justify-center p-8 text-center"
          role="alert"
        >
          <p className="text-destructive font-medium mb-2">
            Failed to load {this.props.name}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.resetError}
            className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// SuspenseBoundary Component
// ============================================================================

/**
 * SuspenseBoundary Component
 *
 * Route-level Suspense wrapper with integrated error boundary.
 * Use this for lazy-loaded route components.
 *
 * @example
 * ```tsx
 * // In route definition
 * const DashboardRoute = createLazyFileRoute('/dashboard')({
 *   component: lazy(() => import('./Dashboard')),
 *   pendingComponent: () => <DashboardSkeleton />,
 * });
 *
 * // Or wrap manually
 * <SuspenseBoundary name="Dashboard" fallback={<DashboardSkeleton />}>
 *   <Dashboard />
 * </SuspenseBoundary>
 * ```
 */
export function SuspenseBoundary({
  children,
  fallback,
  name,
  errorFallback,
  onError,
  className,
}: SuspenseBoundaryProps) {
  return (
    <SuspenseErrorBoundary
      name={name}
      fallback={errorFallback}
      onError={onError}
    >
      <Suspense
        fallback={
          <div
            aria-busy="true"
            aria-label={`Loading ${name}`}
            className={cn('animate-in fade-in duration-300', className)}
          >
            {fallback}
          </div>
        }
      >
        {children}
      </Suspense>
    </SuspenseErrorBoundary>
  );
}

SuspenseBoundary.displayName = 'SuspenseBoundary';
