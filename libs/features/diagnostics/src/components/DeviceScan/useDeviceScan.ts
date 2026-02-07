// =============================================================================
// useDeviceScan Hook
// =============================================================================
// Headless hook for device scanning with real-time progress updates via GraphQL
// subscriptions. Handles scan lifecycle: start, progress, cancel, complete.

import { useMutation, useSubscription, gql } from '@apollo/client';
import { useState, useCallback, useEffect, useRef } from 'react';
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

interface UseDeviceScanOptions {
  /** Router ID to scan */
  deviceId: string;

  /** Callback when scan completes successfully */
  onComplete?: (devices: DiscoveredDevice[]) => void;

  /** Callback when scan encounters an error */
  onError?: (error: string) => void;
}

// -----------------------------------------------------------------------------
// Hook Implementation
// -----------------------------------------------------------------------------

export function useDeviceScan({
  deviceId,
  onComplete,
  onError,
}: UseDeviceScanOptions) {
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
    const enrichedDevices = discoveredDevices.map(
      (d: Omit<DiscoveredDevice, 'vendor'>) => ({
        ...d,
        vendor: lookupVendor(d.mac),
      })
    );
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
   * Start a device scan
   *
   * @param subnet - Subnet to scan in CIDR notation (e.g., "192.168.88.0/24")
   * @param interfaceName - Optional interface to scan on
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
   */
  const reset = useCallback(() => {
    setScanId(null);
    setStatus('idle');
    setProgress(0);
    setDevices([]);
    setError(null);
    setStats({ scannedCount: 0, totalCount: 0, elapsedTime: 0 });
  }, []);

  // -----------------------------------------------------------------------------
  // Return Value
  // -----------------------------------------------------------------------------

  return {
    // State
    status,
    progress,
    devices,
    error,
    stats,

    // Computed State
    isScanning: status === 'scanning',
    isComplete: status === 'completed',
    isCancelled: status === 'cancelled',
    isIdle: status === 'idle',
    hasError: status === 'error',

    // Actions
    startScan,
    stopScan,
    reset,
  };
}
