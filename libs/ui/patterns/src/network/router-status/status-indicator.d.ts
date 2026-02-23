/**
 * Status Indicator Component
 *
 * Animated dot/circle for router connection status visualization.
 * Supports multiple sizes and automatic pulse animation for connecting state.
 *
 * @module @nasnet/ui/patterns/network/router-status
 * @see NAS-4A.22: Build Router Status Component
 */
import type { ConnectionStatus, StatusIndicatorProps } from './types';
/**
 * Text color classes for status (for icons/text)
 */
export declare const STATUS_TEXT_COLORS: Record<ConnectionStatus, string>;
/**
 * Background color classes with opacity for badges
 */
export declare const STATUS_BG_COLORS: Record<ConnectionStatus, string>;
/**
 * Status Indicator Component
 *
 * Visual status indicator dot with size variants and animation.
 * Respects prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * // Default connected status
 * <StatusIndicator status="CONNECTED" />
 *
 * // Large connecting status with animation
 * <StatusIndicator status="CONNECTING" size="lg" />
 *
 * // Small disconnected without animation
 * <StatusIndicator status="DISCONNECTED" size="sm" animated={false} />
 * ```
 */
export declare function StatusIndicator({ status, size, animated, className, 'aria-label': ariaLabel, }: StatusIndicatorProps): import("react/jsx-runtime").JSX.Element;
export declare namespace StatusIndicator {
    var textColors: Record<ConnectionStatus, string>;
    var bgColors: Record<ConnectionStatus, string>;
}
//# sourceMappingURL=status-indicator.d.ts.map