/**
 * Error Card Component
 * Inline error display with retry action and expandable details
 *
 * Features:
 * - User-friendly error message display
 * - Retry button for recovery
 * - Expandable technical details
 * - Multiple variants (default, compact, minimal)
 * - Accessible with ARIA attributes
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */
import * as React from 'react';
/**
 * Error type categories for contextual styling
 */
export type ErrorType = 'error' | 'warning' | 'network' | 'auth' | 'not-found';
/**
 * Error Card Props
 */
export interface ErrorCardProps {
    /** Error type for styling and icon selection */
    type?: ErrorType;
    /** Main error title */
    title: string;
    /** Human-readable error description */
    description?: string;
    /** Technical error message (shown in details) */
    technicalMessage?: string;
    /** Error code (e.g., N300, A501) */
    errorCode?: string;
    /** Stack trace (only shown in dev mode) */
    stackTrace?: string;
    /** Retry handler */
    onRetry?: () => void;
    /** Secondary action handler */
    onSecondaryAction?: () => void;
    /** Secondary action label */
    secondaryActionLabel?: string;
    /** Report issue handler */
    onReport?: () => void;
    /** Additional class name */
    className?: string;
    /** Variant: default, compact, or minimal */
    variant?: 'default' | 'compact' | 'minimal';
    /** Auto-focus retry button on mount */
    autoFocus?: boolean;
}
/**
 * Error Card Component
 *
 * Displays errors inline with optional retry action and technical details.
 *
 * @example Basic usage
 * ```tsx
 * <ErrorCard
 *   title="Failed to load data"
 *   description="There was a problem loading the router configuration."
 *   onRetry={() => refetch()}
 * />
 * ```
 *
 * @example With error code and details
 * ```tsx
 * <ErrorCard
 *   type="network"
 *   title="Connection lost"
 *   description="Unable to reach the router. Check your network connection."
 *   errorCode="N300"
 *   technicalMessage="ECONNREFUSED 192.168.88.1:8728"
 *   onRetry={reconnect}
 *   onReport={reportIssue}
 * />
 * ```
 *
 * @example Compact variant
 * ```tsx
 * <ErrorCard
 *   variant="compact"
 *   title="Update failed"
 *   onRetry={retry}
 * />
 * ```
 */
declare function ErrorCardComponent({ type, title, description, technicalMessage, errorCode, stackTrace, onRetry, onSecondaryAction, secondaryActionLabel, onReport, className, variant, autoFocus, }: ErrorCardProps): import("react/jsx-runtime").JSX.Element;
declare namespace ErrorCardComponent {
    var displayName: string;
}
/**
 * Memoized ErrorCard component
 */
export declare const ErrorCard: React.MemoExoticComponent<typeof ErrorCardComponent>;
export {};
//# sourceMappingURL=ErrorCard.d.ts.map