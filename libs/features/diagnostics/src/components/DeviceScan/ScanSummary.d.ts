import type { DiscoveredDevice, ScanStats } from './types';
/**
 * Props for ScanSummary component
 *
 * Displays aggregated statistics and provides export options.
 */
export interface ScanSummaryProps {
    /** List of discovered devices from scan results */
    devices: DiscoveredDevice[];
    /** Scan statistics (duration, counts, timing) */
    stats: ScanStats;
    /** Subnet that was scanned (e.g., "192.168.1.0/24") */
    subnet: string;
    /** Optional CSS class name for root container */
    className?: string;
}
/**
 * Scan Summary Component
 *
 * Displays statistics from completed device scan:
 * - Total devices found
 * - Scan duration
 * - DHCP vs static device split
 * - Unique vendor count
 * - CSV/JSON export actions
 *
 * Shows subnet in monospace font (technical data).
 *
 * @example
 * ```tsx
 * <ScanSummary
 *   devices={discoveredDevices}
 *   stats={scanStats}
 *   subnet="192.168.1.0/24"
 * />
 * ```
 */
export declare const ScanSummary: import("react").NamedExoticComponent<ScanSummaryProps>;
//# sourceMappingURL=ScanSummary.d.ts.map