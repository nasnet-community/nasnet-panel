/**
 * InterfaceComparison Component
 * Side-by-side comparison of multiple interface statistics
 *
 * @description
 * Displays a comparison table of interfaces with real-time statistics and enables
 * side-by-side bandwidth chart comparison for up to 3 selected interfaces.
 * Identifies "hotspot" interfaces (top 3 by total bandwidth) for easy identification.
 *
 * NAS-6.9: Implement Interface Traffic Statistics (Task 6 - AC4)
 */
import type { TimeRangePreset } from './time-range-selector';
export interface InterfaceInfo {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'degraded';
}
export interface InterfaceComparisonProps {
    /** Router ID */
    routerId: string;
    /** List of available interfaces */
    interfaces: InterfaceInfo[];
    /** Time range for bandwidth charts */
    timeRange?: TimeRangePreset;
    /** Polling interval */
    interval?: string;
    /** Optional className for styling */
    className?: string;
}
/**
 * InterfaceComparison Component
 *
 * Displays a comparison table of multiple interfaces with real-time statistics.
 * Allows selecting up to 3 interfaces for side-by-side bandwidth chart comparison.
 * Highlights top 3 interfaces by total bandwidth as "hotspots".
 *
 * @example
 * ```tsx
 * <InterfaceComparison
 *   routerId="router-1"
 *   interfaces={[
 *     { id: 'ether1', name: 'ether1 - WAN', status: 'online' },
 *     { id: 'ether2', name: 'ether2 - LAN', status: 'online' },
 *   ]}
 *   timeRange="24h"
 *   interval="5s"
 * />
 * ```
 */
export declare const InterfaceComparison: import("react").NamedExoticComponent<InterfaceComparisonProps>;
//# sourceMappingURL=interface-comparison.d.ts.map