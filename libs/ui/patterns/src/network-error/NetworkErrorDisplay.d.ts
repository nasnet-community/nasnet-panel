/**
 * Network Error Display Component
 * Specialized error display for network/connectivity issues
 *
 * Extends ErrorCard with network-specific features:
 * - Connection troubleshooting tips
 * - Auto-retry indicator
 * - Network status integration
 *
 * @see NAS-4.15: Implement Error Boundaries & Global Error Handling
 */
import * as React from 'react';
/**
 * Network error type
 */
export type NetworkErrorType = 'offline' | 'timeout' | 'connection-refused' | 'dns-failed' | 'server-error' | 'unknown';
/**
 * Network Error Display Props
 */
export interface NetworkErrorDisplayProps {
    /** Network error type for contextual messaging */
    type?: NetworkErrorType;
    /** Custom error title */
    title?: string;
    /** Custom error description */
    description?: string;
    /** Technical error message */
    technicalMessage?: string;
    /** Error code (e.g., N300) */
    errorCode?: string;
    /** Retry handler */
    onRetry?: () => void;
    /** Whether auto-retry is in progress */
    isRetrying?: boolean;
    /** Current retry attempt (e.g., 2 of 5) */
    retryAttempt?: number;
    /** Max retry attempts */
    maxRetries?: number;
    /** Time until next retry (seconds) */
    nextRetryIn?: number;
    /** Whether to show troubleshooting tips */
    showTroubleshooting?: boolean;
    /** Open network settings handler (mobile only) */
    onOpenSettings?: () => void;
    /** Additional class name */
    className?: string;
    /** Variant: default or compact */
    variant?: 'default' | 'compact';
}
/**
 * Network Error Display Component
 *
 * Shows network/connectivity errors with retry functionality
 * and optional troubleshooting tips.
 *
 * @example Basic usage
 * ```tsx
 * <NetworkErrorDisplay
 *   type="offline"
 *   onRetry={() => refetch()}
 * />
 * ```
 *
 * @example With auto-retry
 * ```tsx
 * <NetworkErrorDisplay
 *   type="timeout"
 *   isRetrying
 *   retryAttempt={2}
 *   maxRetries={5}
 *   nextRetryIn={4}
 *   onRetry={manualRetry}
 * />
 * ```
 *
 * @example With troubleshooting
 * ```tsx
 * <NetworkErrorDisplay
 *   type="connection-refused"
 *   showTroubleshooting
 *   errorCode="R200"
 *   technicalMessage="ECONNREFUSED 192.168.88.1:8728"
 * />
 * ```
 */
declare function NetworkErrorDisplayComponent({ type, title, description, technicalMessage, errorCode, onRetry, isRetrying, retryAttempt, maxRetries, nextRetryIn, showTroubleshooting, onOpenSettings, className, variant, }: NetworkErrorDisplayProps): import("react/jsx-runtime").JSX.Element;
declare namespace NetworkErrorDisplayComponent {
    var displayName: string;
}
/**
 * Memoized NetworkErrorDisplay component
 */
export declare const NetworkErrorDisplay: React.MemoExoticComponent<typeof NetworkErrorDisplayComponent>;
export {};
//# sourceMappingURL=NetworkErrorDisplay.d.ts.map