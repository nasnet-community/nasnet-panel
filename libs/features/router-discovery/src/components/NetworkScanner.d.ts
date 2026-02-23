/**
 * Network Scanner Component
 * Auto-discovers MikroTik routers on the network (Story 0-1-1)
 */
import type { ScanResult } from '@nasnet/core/types';
export interface NetworkScannerProps {
    /**
     * Callback when scan completes successfully
     */
    onScanComplete?: (results: ScanResult[]) => void;
    /**
     * Callback when user selects a discovered router
     */
    onRouterSelect?: (result: ScanResult) => void;
    /**
     * Default subnet to scan
     */
    defaultSubnet?: string;
    /**
     * Optional CSS class name
     */
    className?: string;
}
/**
 * NetworkScanner Component
 *
 * @description Provides interface for discovering MikroTik routers on the network
 * through automated subnet scanning.
 *
 * Features:
 * - Subnet input with validation
 * - Real-time scan progress
 * - Results display with router information
 * - Error handling and retry capability
 *
 * @example
 * ```tsx
 * <NetworkScanner
 *   onScanComplete={(results) => console.log("Found:", results.length)}
 *   onRouterSelect={(router) => console.log("Selected:", router.ipAddress)}
 * />
 * ```
 */
export declare const NetworkScanner: import("react").NamedExoticComponent<NetworkScannerProps>;
//# sourceMappingURL=NetworkScanner.d.ts.map