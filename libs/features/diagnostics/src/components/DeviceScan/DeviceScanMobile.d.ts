import type { DiscoveredDevice, ScanStats, ScanStatus } from './types';
/**
 * Props for DeviceScanMobile component
 *
 * Combines scan state, actions, and presentation options for mobile layout.
 * All state properties are derived from {@link useDeviceScan} hook.
 */
export interface DeviceScanMobileProps {
    /** Current scan state (idle|scanning|complete|error|cancelled) */
    status: ScanStatus;
    /** Progress percentage (0-100) for current scan */
    progress: number;
    /** Array of discovered devices */
    devices: DiscoveredDevice[];
    /** Error message if scan failed (null if no error) */
    error: string | null;
    /** Scan statistics (duration, counts, etc) */
    stats: ScanStats;
    /** True when scan is actively running */
    isScanning: boolean;
    /** True when scan completed normally */
    isComplete: boolean;
    /** True when user cancelled the scan */
    isCancelled: boolean;
    /** True when no scan has started yet */
    isIdle: boolean;
    /** True when scan failed with error */
    hasError: boolean;
    /** Start a new scan on given subnet (optional interface filter) */
    startScan: (subnet: string, interfaceName?: string) => Promise<void>;
    /** Stop the currently running scan */
    stopScan: () => Promise<void>;
    /** Reset to idle state for new scan */
    reset: () => void;
    /** Router ID for API context (required for interface selector) */
    routerId?: string | null;
    /** Optional CSS class name for root container */
    className?: string;
}
/**
 * Mobile presenter for device scan tool
 *
 * Displays ARP scan UI optimized for touch:
 * - Single-column card layout
 * - Bottom sheet detail view (not inline)
 * - Large touch targets (44px minimum)
 * - Simplified controls (stacked vertically)
 *
 * Detail panel opens in a bottom sheet when device is selected.
 *
 * @see {@link DeviceScanTool} for auto-detecting wrapper
 * @see {@link DeviceScanDesktop} for desktop layout
 */
export declare const DeviceScanMobile: import("react").NamedExoticComponent<DeviceScanMobileProps>;
//# sourceMappingURL=DeviceScanMobile.d.ts.map