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
import { type ErrorBoundaryFallbackProps } from './ErrorBoundary';
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
declare function InlineErrorCardComponent({ error, reset, componentName, className, minimal, }: InlineErrorCardProps): import("react/jsx-runtime").JSX.Element;
declare namespace InlineErrorCardComponent {
    var displayName: string;
}
/**
 * Memoized InlineErrorCard component
 */
export declare const InlineErrorCard: React.MemoExoticComponent<typeof InlineErrorCardComponent>;
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
export declare function ComponentErrorBoundary({ children, onError, fallback, componentName, className, minimal, }: ComponentErrorBoundaryProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ComponentErrorBoundary.d.ts.map