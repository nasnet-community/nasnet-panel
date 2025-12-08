/**
 * Network Scanning Service
 * Handles router discovery via backend network scanning (Epic 0.1, Story 0-1-1)
 */

import type { ScanResult, ScanProgress, Router } from '@nasnet/core/types';

/**
 * Backend scan response interface
 */
interface ScanResponse {
  task_id: string;
  message?: string;
}

/**
 * Backend scan status response
 */
interface ScanStatusResponse {
  status: 'running' | 'completed' | 'failed';
  progress: {
    total_hosts: number;
    scanned_hosts: number;
    found_routers: number;
    current_ip: string;
  };
  results?: Array<{
    ip_address: string;
    is_reachable: boolean;
    response_time?: number;
    http_port?: number;
    model?: string;
    router_os_version?: string;
    mac_address?: string;
  }>;
  error?: string;
}

/**
 * Configuration for scan service
 */
const SCAN_CONFIG = {
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',
  pollInterval: 500, // Poll every 500ms
  maxPollAttempts: 600, // Max 5 minutes (600 * 500ms)
} as const;

/**
 * Starts a network scan for MikroTik routers
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
export async function startNetworkScan(
  subnet: string,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResult[]> {
  try {
    // Initiate scan on backend
    const response = await fetch(`${SCAN_CONFIG.backendUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ip_range: subnet }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ScanError(
        `Failed to start scan: ${errorData.message || response.statusText}`,
        'SCAN_START_FAILED'
      );
    }

    const { task_id } = (await response.json()) as ScanResponse;

    if (!task_id) {
      throw new ScanError('No task ID returned from scan endpoint', 'INVALID_RESPONSE');
    }

    // Poll for results
    return pollScanStatus(task_id, onProgress);
  } catch (error) {
    if (error instanceof ScanError) {
      throw error;
    }

    // Network error or other fetch failure
    throw new ScanError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'NETWORK_ERROR'
    );
  }
}

/**
 * Polls backend for scan status and results
 *
 * @param taskId - Task ID returned from scan initiation
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to scan results
 */
async function pollScanStatus(
  taskId: string,
  onProgress?: (progress: ScanProgress) => void
): Promise<ScanResult[]> {
  let attempts = 0;

  while (attempts < SCAN_CONFIG.maxPollAttempts) {
    try {
      const response = await fetch(
        `${SCAN_CONFIG.backendUrl}/api/scan/${taskId}`
      );

      if (!response.ok) {
        throw new ScanError(
          `Failed to fetch scan status: ${response.statusText}`,
          'POLL_FAILED'
        );
      }

      const statusData = (await response.json()) as ScanStatusResponse;

      // Update progress if callback provided
      if (onProgress && statusData.progress) {
        onProgress({
          totalHosts: statusData.progress.total_hosts,
          scannedHosts: statusData.progress.scanned_hosts,
          foundRouters: statusData.progress.found_routers,
          currentIp: statusData.progress.current_ip,
          isScanning: statusData.status === 'running',
        });
      }

      // Check scan completion
      if (statusData.status === 'completed') {
        return transformScanResults(statusData.results || []);
      }

      if (statusData.status === 'failed') {
        throw new ScanError(
          statusData.error || 'Scan failed on backend',
          'SCAN_FAILED'
        );
      }

      // Still running, wait before next poll
      await sleep(SCAN_CONFIG.pollInterval);
      attempts++;
    } catch (error) {
      if (error instanceof ScanError) {
        throw error;
      }

      throw new ScanError(
        `Polling error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'POLL_ERROR'
      );
    }
  }

  throw new ScanError(
    'Scan timeout: Maximum polling attempts reached',
    'TIMEOUT'
  );
}

/**
 * Transforms backend scan results to frontend ScanResult format
 */
function transformScanResults(
  backendResults: ScanStatusResponse['results']
): ScanResult[] {
  if (!backendResults) return [];

  return backendResults.map((result) => ({
    ipAddress: result.ip_address,
    isReachable: result.is_reachable,
    responseTime: result.response_time,
    httpPort: result.http_port,
    model: result.model,
    routerOsVersion: result.router_os_version,
    macAddress: result.mac_address,
  }));
}

/**
 * Converts ScanResult to Router object for storage
 *
 * @param scanResult - Scan result from network scan
 * @returns Router object ready for storage
 */
export function scanResultToRouter(scanResult: ScanResult): Omit<Router, 'id' | 'createdAt'> {
  return {
    ipAddress: scanResult.ipAddress,
    name: scanResult.model || `Router ${scanResult.ipAddress}`,
    model: scanResult.model,
    routerOsVersion: scanResult.routerOsVersion,
    macAddress: scanResult.macAddress,
    connectionStatus: 'unknown',
    discoveryMethod: 'scan',
  };
}

/**
 * Validates subnet format (simple IPv4 CIDR validation)
 *
 * @param subnet - Subnet string to validate
 * @returns True if valid subnet format
 *
 * @example
 * ```typescript
 * validateSubnet("192.168.88.0/24") // true
 * validateSubnet("192.168.88.0") // false
 * validateSubnet("invalid") // false
 * ```
 */
export function validateSubnet(subnet: string): boolean {
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

  if (!cidrRegex.test(subnet)) {
    return false;
  }

  const [ip, mask] = subnet.split('/');
  const octets = ip.split('.').map(Number);

  // Validate octets (0-255)
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return false;
  }

  // Validate CIDR mask (0-32)
  const maskNum = parseInt(mask, 10);
  if (maskNum < 0 || maskNum > 32) {
    return false;
  }

  return true;
}

/**
 * Gets default subnet based on common MikroTik configurations
 * Returns MikroTik default: 192.168.88.0/24
 */
export function getDefaultSubnet(): string {
  return '192.168.88.0/24';
}

/**
 * Custom error class for scan operations
 */
export class ScanError extends Error {
  constructor(
    message: string,
    public code:
      | 'SCAN_START_FAILED'
      | 'INVALID_RESPONSE'
      | 'NETWORK_ERROR'
      | 'POLL_FAILED'
      | 'SCAN_FAILED'
      | 'POLL_ERROR'
      | 'TIMEOUT'
  ) {
    super(message);
    this.name = 'ScanError';
  }
}

/**
 * Helper to sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
