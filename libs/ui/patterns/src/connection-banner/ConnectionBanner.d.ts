export interface ConnectionBannerProps {
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * ConnectionBanner Component
 *
 * Displays a warning banner when connection is lost or reconnecting.
 * Automatically shows/hides based on connection state from store.
 *
 * Features:
 * - Shown when state is 'disconnected' or 'reconnecting'
 * - Hidden when state is 'connected'
 * - Full-width banner at top of content area
 * - Warning color scheme (yellow/orange)
 * - Appropriate message for each state
 * - ARIA live region for screen readers
 *
 * @example
 * ```tsx
 * // Basic usage - place below app header
 * <ConnectionBanner />
 *
 * // With custom styling
 * <ConnectionBanner className="mt-2" />
 * ```
 *
 * Positioning:
 * - Place in app layout below header
 * - Will automatically show/hide based on connection state
 */
export declare const ConnectionBanner: import("react").NamedExoticComponent<ConnectionBannerProps>;
//# sourceMappingURL=ConnectionBanner.d.ts.map