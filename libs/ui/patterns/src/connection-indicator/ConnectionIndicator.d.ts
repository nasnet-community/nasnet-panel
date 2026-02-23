/**
 * Connection Indicator Component
 *
 * Displays router connection status with platform-adaptive presentation.
 * Follows the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4.9: Implement Connection & Auth Stores
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */
import { type ConnectionIndicatorState } from './useConnectionIndicator';
/**
 * Mobile presenter for connection indicator.
 * Compact design optimized for small screens and touch interaction.
 */
declare const ConnectionIndicatorMobile: import("react").NamedExoticComponent<{
    state: ConnectionIndicatorState;
}>;
/**
 * Desktop presenter for connection indicator.
 * Information-dense design with latency and protocol details.
 */
declare const ConnectionIndicatorDesktop: import("react").NamedExoticComponent<{
    state: ConnectionIndicatorState;
}>;
export interface ConnectionIndicatorProps {
    /**
     * Force a specific variant (overrides auto-detection)
     */
    variant?: 'mobile' | 'desktop';
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Connection Indicator Component
 *
 * Shows current connection status with platform-adaptive UI.
 * Auto-detects mobile vs desktop based on screen width.
 *
 * Features:
 * - Real-time WebSocket status
 * - Latency display (desktop)
 * - Reconnection progress
 * - Manual retry when max attempts reached
 * - ARIA live region for status changes
 *
 * @example
 * ```tsx
 * // Auto-detect platform
 * <ConnectionIndicator />
 *
 * // Force mobile variant
 * <ConnectionIndicator variant="mobile" />
 *
 * // Force desktop variant
 * <ConnectionIndicator variant="desktop" />
 * ```
 */
export declare const ConnectionIndicator: import("react").NamedExoticComponent<ConnectionIndicatorProps>;
export { ConnectionIndicatorMobile, ConnectionIndicatorDesktop };
//# sourceMappingURL=ConnectionIndicator.d.ts.map