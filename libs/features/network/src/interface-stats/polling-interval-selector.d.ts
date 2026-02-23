/**
 * PollingIntervalSelector Component
 * UI for configuring interface statistics polling interval
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 8)
 */
import React from 'react';
/**
 * Props for PollingIntervalSelector component
 */
export interface PollingIntervalSelectorProps {
    /** Additional CSS classes */
    className?: string;
    /** Show as inline (no label) */
    inline?: boolean;
}
/**
 * PollingIntervalSelector Component
 *
 * Allows users to configure the polling interval for interface statistics updates.
 * Changes apply immediately to active subscriptions and persist across sessions.
 *
 * Available intervals:
 * - 1s: Real-time monitoring (high CPU usage)
 * - 5s: Recommended default (balanced)
 * - 10s: Low bandwidth mode
 * - 30s: Minimal updates
 *
 * @description Provides a dropdown selector for real-time control of statistics polling frequency with persistent user preference
 *
 * @example
 * ```tsx
 * <PollingIntervalSelector />
 * // Full layout with label
 *
 * <PollingIntervalSelector inline />
 * // Compact inline layout
 * ```
 */
declare const PollingIntervalSelector: React.NamedExoticComponent<PollingIntervalSelectorProps>;
export { PollingIntervalSelector };
//# sourceMappingURL=polling-interval-selector.d.ts.map