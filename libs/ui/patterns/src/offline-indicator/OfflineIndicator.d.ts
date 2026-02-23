/**
 * Offline Indicator Component
 *
 * Banner/toast showing network offline status.
 * Monitors browser online/offline events.
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 */
export interface OfflineIndicatorProps {
    /**
     * Position of the indicator
     * @default 'top'
     */
    position?: 'top' | 'bottom';
    /**
     * Whether the indicator can be dismissed
     * @default false
     */
    dismissible?: boolean;
    /**
     * Custom offline message
     */
    offlineMessage?: string;
    /**
     * Custom online message (shown briefly after reconnecting)
     */
    onlineMessage?: string;
    /**
     * How long to show the online message (ms)
     * @default 3000
     */
    onlineDuration?: number;
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Hook for monitoring network online/offline status
 */
export declare function useNetworkStatus(): {
    isOnline: boolean;
    wasOffline: boolean;
    setWasOffline: import("react").Dispatch<import("react").SetStateAction<boolean>>;
};
/**
 * Offline Indicator
 *
 * Shows a banner when the browser loses network connectivity.
 * Optionally shows a brief "back online" message when reconnected.
 *
 * @example
 * ```tsx
 * // Basic usage - shows at top of viewport
 * <OfflineIndicator />
 *
 * // Bottom position, dismissible
 * <OfflineIndicator position="bottom" dismissible />
 *
 * // Custom messages
 * <OfflineIndicator
 *   offlineMessage="No internet connection"
 *   onlineMessage="Connection restored!"
 * />
 * ```
 */
export declare const OfflineIndicator: import("react").NamedExoticComponent<OfflineIndicatorProps>;
export interface OfflineIndicatorCompactProps {
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Compact offline indicator (icon only)
 *
 * Shows a small icon when offline, suitable for headers/nav bars.
 */
export declare const OfflineIndicatorCompact: import("react").NamedExoticComponent<OfflineIndicatorCompactProps>;
//# sourceMappingURL=OfflineIndicator.d.ts.map