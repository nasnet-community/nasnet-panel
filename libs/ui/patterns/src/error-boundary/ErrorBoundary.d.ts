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
export declare class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps);
    /**
     * Update state so the next render will show the fallback UI
     */
    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState>;
    /**
     * Log the error and call the onError callback
     */
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    /**
     * Reset when resetKey changes
     */
    componentDidUpdate(prevProps: ErrorBoundaryProps): void;
    /**
     * Reset the error boundary state
     */
    resetErrorBoundary: () => void;
    render(): React.ReactNode;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map