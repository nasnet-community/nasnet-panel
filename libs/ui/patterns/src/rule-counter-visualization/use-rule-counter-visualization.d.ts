/**
 * Headless hook for Rule Counter Visualization
 * Manages counter formatting, rate calculations, and relative bar percentages
 *
 * Follows Headless + Platform Presenters pattern (ADR-018)
 *
 * @see CounterCell.tsx for the component implementation
 */
/**
 * Counter data interface
 */
export interface CounterData {
    /** Number of packets */
    packets: number;
    /** Number of bytes */
    bytes: number;
}
/**
 * Calculated rates
 */
export interface CounterRates {
    /** Packets per second */
    packetsPerSec: number;
    /** Bytes per second */
    bytesPerSec: number;
}
/**
 * Options for useRuleCounterVisualization hook
 */
export interface UseRuleCounterVisualizationOptions {
    /** Current counter values */
    counter: CounterData;
    /** Maximum bytes value for relative bar calculation */
    maxBytes: number;
    /** Whether to calculate rates (requires polling) */
    calculateRates?: boolean;
    /** Polling interval in milliseconds (default: 5000ms) */
    pollingInterval?: number;
}
/**
 * Return type for useRuleCounterVisualization hook
 */
export interface RuleCounterVisualizationState {
    /** Formatted packet count (e.g., "1,234,567") */
    formattedPackets: string;
    /** Formatted byte count (e.g., "1.2 MB") */
    formattedBytes: string;
    /** Calculated rates (if enabled) */
    rates: CounterRates | null;
    /** Percentage of max bytes (0-100) */
    percentOfMax: number;
    /** Whether this rule has no traffic */
    isUnused: boolean;
}
/**
 * Format packet count with comma separators
 *
 * @param packets - Number of packets
 * @returns Formatted string (e.g., "1,234,567")
 *
 * @example
 * ```ts
 * formatPackets(1234567); // "1,234,567"
 * formatPackets(0); // "0"
 * ```
 */
export declare function formatPackets(packets: number): string;
/**
 * Format bytes with SI units (KB, MB, GB, TB)
 *
 * Uses 1000-based units (not 1024) for consistency with networking standards.
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.2 MB")
 *
 * @example
 * ```ts
 * formatBytes(1234); // "1.23 KB"
 * formatBytes(1234567); // "1.23 MB"
 * formatBytes(1234567890); // "1.23 GB"
 * formatBytes(0); // "0 B"
 * ```
 */
export declare function formatBytes(bytes: number): string;
/**
 * Headless hook for rule counter visualization
 *
 * Provides:
 * - Formatted packet and byte counts
 * - Rate calculations (packets/sec, bytes/sec) using delta tracking
 * - Relative bar percentage (for visual comparison)
 * - Unused rule detection (packets === 0)
 *
 * @example
 * ```tsx
 * const state = useRuleCounterVisualization({
 *   counter: { packets: 1234567, bytes: 9876543210 },
 *   maxBytes: 10000000000,
 *   calculateRates: true,
 *   pollingInterval: 5000,
 * });
 *
 * console.log(state.formattedPackets); // "1,234,567"
 * console.log(state.formattedBytes); // "9.88 GB"
 * console.log(state.percentOfMax); // 98.77
 * console.log(state.rates?.bytesPerSec); // 1234567 (bytes/sec)
 * ```
 */
export declare function useRuleCounterVisualization({ counter, maxBytes, calculateRates, pollingInterval, }: UseRuleCounterVisualizationOptions): RuleCounterVisualizationState;
//# sourceMappingURL=use-rule-counter-visualization.d.ts.map