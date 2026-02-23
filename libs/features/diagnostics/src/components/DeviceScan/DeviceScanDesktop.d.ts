import type { DiscoveredDevice, ScanStats, ScanStatus } from './types';
/**
 * Props for DeviceScanDesktop component
 *
 * Combines scan state, actions, and presentation options for desktop layout.
 * All state properties are derived from {@link useDeviceScan} hook.
 */
export interface DeviceScanDesktopProps {
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
 * Desktop presenter for device scan tool
 *
 * Displays ARP scan UI with:
 * - Subnet input and interface selector
 * - Full-width device discovery table
 * - Inline detail panel (right sidebar)
 * - Scan summary with export options
 *
 * Uses 3-column layout: controls (full) + table (2/3) + detail panel (1/3)
 *
 * @see {@link DeviceScanTool} for auto-detecting wrapper
 * @see {@link DeviceScanMobile} for mobile layout
 */
export declare const DeviceScanDesktop: import("react").NamedExoticComponent<DeviceScanDesktopProps>;
//# sourceMappingURL=DeviceScanDesktop.d.ts.map