import type { DiscoveredDevice, ScanStatus, ScanStats } from './types';
export declare const RUN_DEVICE_SCAN: import("graphql").DocumentNode;
export declare const CANCEL_DEVICE_SCAN: import("graphql").DocumentNode;
export declare const DEVICE_SCAN_PROGRESS: import("graphql").DocumentNode;
/**
 * Options for useDeviceScan hook
 */
interface UseDeviceScanOptions {
    /** Router ID to scan */
    deviceId: string;
    /** Callback when scan completes successfully */
    onComplete?: (devices: DiscoveredDevice[]) => void;
    /** Callback when scan encounters an error */
    onError?: (error: string) => void;
}
/**
 * Return value from useDeviceScan hook
 */
interface UseDeviceScanReturn {
    status: ScanStatus;
    progress: number;
    devices: DiscoveredDevice[];
    error: string | null;
    stats: ScanStats;
    isScanning: boolean;
    isComplete: boolean;
    isCancelled: boolean;
    isIdle: boolean;
    hasError: boolean;
    startScan: (subnet: string, interfaceName?: string) => Promise<void>;
    stopScan: () => Promise<void>;
    reset: () => void;
}
/**
 * useDeviceScan Hook
 *
 * Headless hook for scanning network devices with real-time progress via
 * GraphQL subscriptions. Manages complete scan lifecycle from initiation
 * through completion, cancellation, or error handling.
 *
 * Features:
 * - Real-time subscription to scan progress
 * - Vendor OUI lookup (frontend-side enrichment)
 * - Stable callbacks with proper dependencies
 * - Mounted state tracking to prevent memory leaks
 * - Computed booleans for convenient state checking
 *
 * @example
 * ```tsx
 * const { startScan, progress, devices, isScanning } = useDeviceScan({
 *   deviceId: routerId,
 *   onComplete: (devices) => console.log('Scan finished:', devices),
 *   onError: (err) => console.error('Scan error:', err),
 * });
 *
 * return (
 *   <>
 *     <button onClick={() => startScan('192.168.1.0/24')}>
 *       {isScanning ? `${progress}%` : 'Start Scan'}
 *     </button>
 *     {devices.length > 0 && <DeviceTable devices={devices} />}
 *   </>
 * );
 * ```
 *
 * @param options - Hook configuration
 * @returns Hook interface with state, computed flags, and actions
 *
 * @see {@link DiscoveredDevice} for device structure
 * @see {@link ScanStatus} for status values
 */
export declare function useDeviceScan({ deviceId, onComplete, onError, }: UseDeviceScanOptions): UseDeviceScanReturn;
export {};
//# sourceMappingURL=useDeviceScan.d.ts.map