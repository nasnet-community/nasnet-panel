/**
 * Network Scanning Service
 * Handles router discovery via backend network scanning (Epic 0.1, Story 0-1-1)
 */
import type { ScanResult, ScanProgress, Router } from '@nasnet/core/types';
/**
 * Starts a network scan for MikroTik routers
 *
 * @description Initiates a subnet scan via backend API and polls for results. Calls optional
 * progress callback on each poll cycle to report scanned hosts and discovered routers.
 *
 * @param subnet - Subnet to scan (e.g., "192.168.88.0/24")
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to array of discovered routers
 *
 * @throws {ScanError} If scan fails to start or encounters error during scanning
 *
 * @example
 * ```typescript
 * const results = await startNetworkScan(
 *   "192.168.88.0/24",
 *   (progress) => console.log(`Scanned ${progress.scannedHosts}/${progress.totalHosts}`)
 * );
 * ```
 */
export declare function startNetworkScan(subnet: string, onProgress?: (progress: ScanProgress) => void): Promise<ScanResult[]>;
/**
 * Converts ScanResult to Router object for storage
 *
 * @description Transforms a single scan result into a Router object ready for persistence.
 * Uses model name as router name if available, otherwise generates name from IP address.
 *
 * @param scanResult - Scan result from network scan
 * @returns Router object ready for storage
 */
export declare function scanResultToRouter(scanResult: ScanResult): Omit<Router, 'id' | 'createdAt'>;
/**
 * Validates subnet format (simple IPv4 CIDR validation)
 *
 * @description Validates IPv4 CIDR notation format. Checks that the input matches CIDR regex,
 * all octets are in range 0-255, and CIDR mask is in range 0-32.
 *
 * @param subnet - Subnet string to validate (e.g., "192.168.88.0/24")
 * @returns True if valid subnet format, false otherwise
 *
 * @example
 * ```typescript
 * validateSubnet("192.168.88.0/24") // true
 * validateSubnet("192.168.88.0") // false
 * validateSubnet("invalid") // false
 * ```
 */
export declare function validateSubnet(subnet: string): boolean;
/**
 * Gets default subnet based on common MikroTik configurations
 *
 * @description Returns the standard MikroTik default LAN subnet (192.168.88.0/24).
 * Most MikroTik routers ship with this default network configuration.
 *
 * @returns Default MikroTik subnet: 192.168.88.0/24
 */
export declare function getDefaultSubnet(): string;
/**
 * Custom error class for scan operations
 *
 * @description Error class for network scanning operations. Includes structured error code
 * for error handling and differentiation between failure types (start, network, polling, timeout).
 */
export declare class ScanError extends Error {
    code: 'SCAN_START_FAILED' | 'INVALID_RESPONSE' | 'NETWORK_ERROR' | 'POLL_FAILED' | 'SCAN_FAILED' | 'POLL_ERROR' | 'TIMEOUT';
    constructor(message: string, code: 'SCAN_START_FAILED' | 'INVALID_RESPONSE' | 'NETWORK_ERROR' | 'POLL_FAILED' | 'SCAN_FAILED' | 'POLL_ERROR' | 'TIMEOUT');
}
//# sourceMappingURL=scanService.d.ts.map