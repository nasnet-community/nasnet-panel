/**
 * StatsCounter Component
 * Displays animated counter for interface statistics with BigInt support
 *
 * @description
 * Renders a labeled statistic counter with support for BigInt values (TX/RX bytes/packets).
 * Includes subtle opacity animation when values update. Technical data (bandwidth,
 * byte counts) displayed in monospace font for clarity.
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 */
import type { StatsCounterProps } from './interface-stats-panel.types';
/**
 * StatsCounter Component
 *
 * Displays a single statistic with label and formatted value.
 * Supports BigInt values for large counters (TX/RX bytes/packets).
 * Provides subtle CSS animation on value updates.
 *
 * @example
 * ```tsx
 * <StatsCounter
 *   value="1234567890"
 *   label="TX Bytes"
 *   unit="bytes"
 * />
 * // Displays: "1.15 GB" with label "TX Bytes"
 *
 * <StatsCounter
 *   value="42000"
 *   label="Total Packets"
 *   unit="packets"
 * />
 * // Displays: "42,000" with label "Total Packets"
 * ```
 */
export declare const StatsCounter: import("react").NamedExoticComponent<StatsCounterProps>;
//# sourceMappingURL=stats-counter.d.ts.map