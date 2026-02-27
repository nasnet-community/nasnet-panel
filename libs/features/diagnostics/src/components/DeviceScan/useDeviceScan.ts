// =============================================================================
// useDeviceScan Hook
// =============================================================================
// Headless hook for device scanning with real-time progress updates via GraphQL
// subscriptions. Handles scan lifecycle: start, progress, cancel, complete.

import { useMutation, useSubscription, gql } from '@apollo/client';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { lookupVendor } from '@nasnet/core/utils';
import type { DiscoveredDevice, ScanStatus, ScanStats } from './types';

// -----------------------------------------------------------------------------
// GraphQL Operations
// -----------------------------------------------------------------------------

export const RUN_DEVICE_SCAN = gql`
  mutation RunDeviceScan($input: DeviceScanInput!) {
    runDeviceScan(input: $input) {
      scanId
      status
    }
  }
`;

export const CANCEL_DEVICE_SCAN = gql`
  mutation CancelDeviceScan($scanId: ID!) {
    cancelDeviceScan(scanId: $scanId) {
      success
    }
  }
`;

export const DEVICE_SCAN_PROGRESS = gql`
  subscription DeviceScanProgress($scanId: ID!) {
    deviceScanProgress(scanId: $scanId) {
      scanId
      status
      progress
      scannedCount
      totalCount
      discoveredDevices {
        ip
        mac
        hostname
        interface
        responseTime
        firstSeen
        dhcpLease {
          expires
          server
          status
        }
      }
      elapsedTime
      error
    }
  }
`;

// -----------------------------------------------------------------------------
// Hook Options
// -----------------------------------------------------------------------------

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
  // State
  status: ScanStatus;
  progress: number;
  devices: DiscoveredDevice[];
  error: string | null;
  stats: ScanStats;

  // Computed State
  isScanning: boolean;
  isComplete: boolean;
  isCancelled: boolean;
  isIdle: boolean;
  hasError: boolean;

  // Actions
  startScan: (subnet: string, interfaceName?: string) => Promise<void>;
  stopScan: () => Promise<void>;
  reset: () => void;
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

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
export function useDeviceScan({
  deviceId,
  onComplete,
  onError,
}: UseDeviceScanOptions): UseDeviceScanReturn {
  // State
  const [scanId, setScanId] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ScanStats>({
    scannedCount: 0,
    totalCount: 0,
    elapsedTime: 0,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Mutations
  const [runScanMutation] = useMutation(RUN_DEVICE_SCAN);
  const [cancelScanMutation] = useMutation(CANCEL_DEVICE_SCAN);

  // Subscribe to scan progress when scanId is set
  const { data: progressData } = useSubscription(DEVICE_SCAN_PROGRESS, {
    variables: { scanId },
    skip: !scanId,
  });

  // Process subscription updates
  useEffect(() => {
    if (!progressData?.deviceScanProgress || !isMounted.current) return;

    const {
      status: newStatus,
      progress: newProgress,
      discoveredDevices,
      scannedCount,
      totalCount,
      elapsedTime,
      error: scanError,
    } = progressData.deviceScanProgress;

    // Update status (convert from GraphQL enum to lowercase)
    const normalizedStatus = newStatus.toLowerCase() as ScanStatus;
    setStatus(normalizedStatus);
    setProgress(newProgress);
    setStats({ scannedCount, totalCount, elapsedTime });

    // Enrich devices with vendor lookup (frontend-side)
    const enrichedDevices = discoveredDevices.map((d: Omit<DiscoveredDevice, 'vendor'>) => ({
      ...d,
      vendor: lookupVendor(d.mac),
    }));
    setDevices(enrichedDevices);

    // Handle completion
    if (newStatus === 'COMPLETED') {
      onComplete?.(enrichedDevices);
    }

    // Handle errors
    if (newStatus === 'ERROR' && scanError) {
      setError(scanError);
      onError?.(scanError);
    }
  }, [progressData, onComplete, onError]);

  // -----------------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------------

  /**
   * Start a device scan on specified subnet
   *
   * Initiates a network scan that runs asynchronously on the backend. Returns
   * immediately after mutation, with progress updates received via subscription.
   *
   * @param subnet - Subnet to scan in CIDR notation (e.g., "192.168.88.0/24")
   * @param interfaceName - Optional interface to restrict scan to specific network interface
   * @throws Error from Apollo mutation (network failures, invalid input)
   */
  const startScan = useCallback(
    async (subnet: string, interfaceName?: string) => {
      setStatus('scanning');
      setProgress(0);
      setDevices([]);
      setError(null);

      try {
        const { data } = await runScanMutation({
          variables: {
            input: {
              deviceId,
              subnet,
              interface: interfaceName,
              timeout: 500,
              concurrency: 10,
            },
          },
        });

        if (data?.runDeviceScan?.scanId) {
          setScanId(data.runDeviceScan.scanId);
        }
      } catch (err) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Scan failed';
        setError(errorMessage);
        onError?.(errorMessage);
      }
    },
    [deviceId, runScanMutation, onError]
  );

  /**
   * Stop a running scan
   *
   * Cancels the running scan and sets status to 'cancelled'. Safe to call
   * even if scan has already completed (no error thrown).
   *
   * @throws Error from Apollo mutation (network failures)
   */
  const stopScan = useCallback(async () => {
    if (!scanId) return;

    try {
      await cancelScanMutation({ variables: { scanId } });
      setStatus('cancelled');
    } catch (err) {
      // Scan may have already completed - not an error
      console.warn('Failed to cancel scan:', err);
    }
  }, [scanId, cancelScanMutation]);

  /**
   * Reset scan state to idle
   *
   * Clears all scan data and returns hook to initial idle state. Use after
   * completing a scan to prepare for the next scan.
   */
  const reset = useCallback(() => {
    setScanId(null);
    setStatus('idle');
    setProgress(0);
    setDevices([]);
    setError(null);
    setStats({ scannedCount: 0, totalCount: 0, elapsedTime: 0 });
  }, []);

  // Memoize computed boolean flags
  const computedFlags = useMemo(
    () => ({
      isScanning: status === 'scanning',
      isComplete: status === 'completed',
      isCancelled: status === 'cancelled',
      isIdle: status === 'idle',
      hasError: status === 'error',
    }),
    [status]
  );

  // Memoize return value to prevent unnecessary re-renders in consumers
  const returnValue = useMemo<UseDeviceScanReturn>(
    () => ({
      // State
      status,
      progress,
      devices,
      error,
      stats,

      // Computed State
      ...computedFlags,

      // Actions
      startScan,
      stopScan,
      reset,
    }),
    [status, progress, devices, error, stats, computedFlags, startScan, stopScan, reset]
  );

  return returnValue;
}
