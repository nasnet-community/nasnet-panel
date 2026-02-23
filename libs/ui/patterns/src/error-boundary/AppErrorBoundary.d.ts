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
export declare function AppErrorBoundary({ children, onError, }: AppErrorBoundaryProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AppErrorBoundary.d.ts.map