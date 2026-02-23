/**
 * Error Page Component
 * Full-page error display for critical failures
 *
 * Used for:
 * - Unrecoverable application errors
 * - Critical server errors
 * - Resource not found (404)
 * - Authorization errors (403)
 * - Server errors (500)
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */
import * as React from 'react';
/**
 * Error page variant types
 */
export type ErrorPageVariant = 'error' | 'network' | 'unauthorized' | 'not-found' | 'server-error';
/**
 * Error Page Props
 */
export interface ErrorPageProps {
    /** Error variant for styling and default messaging */
    variant?: ErrorPageVariant;
    /** HTTP status code */
    statusCode?: number;
    /** Custom error title */
    title?: string;
    /** Custom error description */
    description?: string;
    /** Technical error message */
    technicalMessage?: string;
    /** Error code */
    errorCode?: string;
    /** Stack trace (dev only) */
    stackTrace?: string;
    /** Retry handler */
    onRetry?: () => void;
    /** Custom retry button label */
    retryLabel?: string;
    /** Show home button */
    showHomeButton?: boolean;
    /** Show back button */
    showBackButton?: boolean;
    /** Report issue handler */
    onReport?: () => void;
    /** Additional class name */
    className?: string;
    /** Children to render below the error message */
    children?: React.ReactNode;
}
/**
 * Error Page Component
 *
 * A full-page error display for critical failures that require user attention.
 *
 * @example Basic usage
 * ```tsx
 * <ErrorPage
 *   variant="error"
 *   title="Application crashed"
 *   onRetry={() => window.location.reload()}
 * />
 * ```
 *
 * @example 404 page
 * ```tsx
 * <ErrorPage
 *   variant="not-found"
 *   statusCode={404}
 *   showHomeButton
 *   showBackButton
 * />
 * ```
 *
 * @example Server error with details
 * ```tsx
 * <ErrorPage
 *   variant="server-error"
 *   statusCode={500}
 *   errorCode="S600"
 *   technicalMessage="Database connection failed"
 *   onRetry={refetch}
 *   onReport={reportError}
 * />
 * ```
 */
declare function ErrorPageComponent({ variant, statusCode, title, description, technicalMessage, errorCode, stackTrace, onRetry, retryLabel, showHomeButton, showBackButton, onReport, className, children, }: ErrorPageProps): import("react/jsx-runtime").JSX.Element;
declare namespace ErrorPageComponent {
    var displayName: string;
}
/**
 * Memoized ErrorPage component
 */
export declare const ErrorPage: React.MemoExoticComponent<typeof ErrorPageComponent>;
export {};
//# sourceMappingURL=ErrorPage.d.ts.map