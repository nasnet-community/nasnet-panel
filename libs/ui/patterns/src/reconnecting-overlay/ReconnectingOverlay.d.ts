/**
 * Reconnecting Overlay Component
 *
 * Full-screen overlay shown during connection loss and reconnection attempts.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */
export interface ReconnectingOverlayProps {
    /**
     * Whether to show as a full-screen overlay
     * @default true
     */
    fullScreen?: boolean;
    /**
     * Custom message to display
     */
    message?: string;
    /**
     * Whether to show the retry button even during auto-reconnection
     * @default false
     */
    alwaysShowRetry?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Callback when overlay is dismissed (if dismissible)
     */
    onDismiss?: () => void;
}
/**
 * Reconnecting Overlay
 *
 * Shows during connection loss with:
 * - Progress indicator for reconnection attempts
 * - Manual retry button when max attempts reached
 * - Helpful status messages
 *
 * @example
 * ```tsx
 * // Full screen overlay (default)
 * <ReconnectingOverlay />
 *
 * // Inline card (not full screen)
 * <ReconnectingOverlay fullScreen={false} />
 *
 * // Custom message
 * <ReconnectingOverlay message="Lost connection to router" />
 * ```
 */
export declare const ReconnectingOverlay: import("react").NamedExoticComponent<ReconnectingOverlayProps>;
/**
 * Hook for custom reconnecting overlay implementations
 */
export declare function useReconnectingState(): {
    shouldShow: boolean;
    isReconnecting: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    progress: number;
    showManualRetry: boolean;
    onRetry: () => void;
};
//# sourceMappingURL=ReconnectingOverlay.d.ts.map