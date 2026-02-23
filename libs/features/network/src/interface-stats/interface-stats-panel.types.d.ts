/**
 * TypeScript type definitions for Interface Statistics Panel
 * NAS-6.9: Implement Interface Traffic Statistics
 */
import type { InterfaceStats } from '@nasnet/api-client/generated';
/**
 * Props for the main InterfaceStatsPanel component
 */
export interface InterfaceStatsPanelProps {
    /** Router ID */
    routerId: string;
    /** Interface ID */
    interfaceId: string;
    /** Interface display name */
    interfaceName: string;
    /** Polling interval for real-time updates (e.g., '1s', '5s', '10s', '30s') */
    pollingInterval?: string;
    /** Callback when panel is closed */
    onClose?: () => void;
    /** Additional CSS classes */
    className?: string;
}
/**
 * Props for the StatsCounter component
 */
export interface StatsCounterProps {
    /** Counter value as string (supports BigInt representation) */
    value: string;
    /** Label displayed above the counter */
    label: string;
    /** Unit type for formatting */
    unit?: 'bytes' | 'packets' | 'count';
    /** Additional CSS classes */
    className?: string;
}
/**
 * Props for the ErrorRateIndicator component
 */
export interface ErrorRateIndicatorProps {
    /** Error rate as percentage (e.g., 0.05 for 0.05%) */
    rate: number;
    /** Trend direction: positive = increasing, negative = decreasing, 0 = stable */
    trend: number;
    /** Threshold percentage for warning (default: 0.1%) */
    threshold?: number;
    /** Additional CSS classes */
    className?: string;
}
/**
 * State returned by useInterfaceStatsPanel hook
 */
export interface InterfaceStatsState {
    /** Current interface statistics */
    stats: InterfaceStats | null;
    /** Calculated TX/RX rates in bytes per second */
    rates: {
        txRate: bigint;
        rxRate: bigint;
    } | null;
    /** Error rate as percentage */
    errorRate: number;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error: Error | null;
    /** Whether interface has any errors */
    hasErrors: boolean;
}
//# sourceMappingURL=interface-stats-panel.types.d.ts.map