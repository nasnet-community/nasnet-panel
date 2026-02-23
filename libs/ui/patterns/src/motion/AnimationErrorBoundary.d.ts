/**
 * AnimationErrorBoundary
 * Error boundary that catches animation failures and falls back gracefully.
 *
 * @see NAS-4.18: Implement Animation System (Framer Motion)
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';
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
export declare class AnimationErrorBoundary extends Component<AnimationErrorBoundaryProps, AnimationErrorBoundaryState> {
    static defaultProps: {
        logErrors: boolean;
    };
    constructor(props: AnimationErrorBoundaryProps);
    static getDerivedStateFromError(error: Error): AnimationErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
    render(): ReactNode;
}
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
export declare function AnimationTimeout({ children, timeout, onTimeout, enabled, }: AnimationTimeoutProps): import("react/jsx-runtime").JSX.Element;
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
export declare function withAnimationFallback<P extends object>(WrappedComponent: React.ComponentType<P>, options?: WithAnimationFallbackOptions): {
    (props: P): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
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
export declare function useAnimationSafety(): {
    safeAnimate: (content: ReactNode, fallback?: ReactNode) => ReactNode;
    hasError: boolean;
    reset: () => void;
};
export {};
//# sourceMappingURL=AnimationErrorBoundary.d.ts.map