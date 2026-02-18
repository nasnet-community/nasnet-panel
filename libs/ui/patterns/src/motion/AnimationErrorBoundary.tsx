/**
 * AnimationErrorBoundary
 * Error boundary that catches animation failures and falls back gracefully.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */

import { Component, useState, useEffect, useRef, type ReactNode, type ErrorInfo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface AnimationErrorBoundaryProps {
  /** Content to render */
  children: ReactNode;
  /** Fallback to render when an error occurs */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to log errors to console */
  logErrors?: boolean;
}

interface AnimationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// AnimationErrorBoundary Component
// ============================================================================

/**
 * AnimationErrorBoundary
 *
 * Catches errors from animation components and renders a fallback.
 * Prevents animation crashes from breaking the entire UI.
 *
 * @example
 * ```tsx
 * <AnimationErrorBoundary
 *   fallback={<div>Content without animation</div>}
 *   onError={(error) => logError(error)}
 * >
 *   <AnimatedContent />
 * </AnimationErrorBoundary>
 * ```
 */
export class AnimationErrorBoundary extends Component<
  AnimationErrorBoundaryProps,
  AnimationErrorBoundaryState
> {
  static defaultProps = {
    logErrors: true,
  };

  constructor(props: AnimationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AnimationErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, logErrors } = this.props;

    if (logErrors) {
      console.error('Animation error caught:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    onError?.(error, errorInfo);
  }

  override render(): ReactNode {
    const { hasError } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Render fallback or children without animations
      return fallback ?? children;
    }

    return children;
  }
}

// ============================================================================
// AnimationTimeout Component
// ============================================================================

export interface AnimationTimeoutProps {
  /** Content to render */
  children: ReactNode;
  /** Timeout in milliseconds before forcing completion */
  timeout?: number;
  /** Callback when timeout is reached */
  onTimeout?: () => void;
  /** Whether timeout is enabled */
  enabled?: boolean;
}

/**
 * AnimationTimeout
 *
 * Wraps animated content and forces completion after a timeout.
 * Prevents stuck animations from blocking the UI.
 *
 * @example
 * ```tsx
 * <AnimationTimeout timeout={1000} onTimeout={() => console.warn('Animation timeout')}>
 *   <motion.div
 *     initial={{ opacity: 0 }}
 *     animate={{ opacity: 1 }}
 *   >
 *     Content
 *   </motion.div>
 * </AnimationTimeout>
 * ```
 */
export function AnimationTimeout({
  children,
  timeout = 3000,
  onTimeout,
  enabled = true,
}: AnimationTimeoutProps) {
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      onTimeout?.();
    }, timeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [timeout, onTimeout, enabled]);

  // If timed out, render children without animation wrapper
  if (timedOut) {
    return <>{children}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// withAnimationFallback HOC
// ============================================================================

export interface WithAnimationFallbackOptions {
  /** Fallback component to render on error */
  FallbackComponent?: React.ComponentType;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * withAnimationFallback
 *
 * Higher-order component that wraps a component with AnimationErrorBoundary.
 *
 * @example
 * ```tsx
 * const SafeAnimatedCard = withAnimationFallback(AnimatedCard, {
 *   FallbackComponent: StaticCard,
 * });
 * ```
 */
export function withAnimationFallback<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAnimationFallbackOptions = {}
) {
  const { FallbackComponent, onError } = options;

  function WithAnimationFallback(props: P) {
    const fallback = FallbackComponent ? <FallbackComponent /> : null;

    return (
      <AnimationErrorBoundary fallback={fallback} onError={onError}>
        <WrappedComponent {...props} />
      </AnimationErrorBoundary>
    );
  }

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAnimationFallback.displayName = `withAnimationFallback(${displayName})`;

  return WithAnimationFallback;
}

// ============================================================================
// useAnimationSafety Hook
// ============================================================================

/**
 * useAnimationSafety
 *
 * Hook for safely executing animations with error handling.
 *
 * @example
 * ```tsx
 * function AnimatedCard() {
 *   const { safeAnimate, hasError } = useAnimationSafety();
 *
 *   if (hasError) {
 *     return <StaticCard />;
 *   }
 *
 *   return safeAnimate(
 *     <motion.div animate={{ scale: 1.1 }}>
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useAnimationSafety() {
  const [hasError, setHasError] = useState(false);

  const safeAnimate = (content: ReactNode, fallback?: ReactNode): ReactNode => {
    if (hasError) {
      return fallback ?? content;
    }

    return (
      <AnimationErrorBoundary
        fallback={fallback ?? content}
        onError={() => setHasError(true)}
      >
        {content}
      </AnimationErrorBoundary>
    );
  };

  const reset = () => setHasError(false);

  return { safeAnimate, hasError, reset };
}
