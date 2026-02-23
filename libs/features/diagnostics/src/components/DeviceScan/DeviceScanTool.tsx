// =============================================================================
// DeviceScanTool Component
// =============================================================================
// Main component that detects platform and delegates to appropriate presenter

import { memo, useCallback } from 'react';
import { usePlatform } from '@nasnet/ui/layouts';
import { useConnectionStore } from '@nasnet/state/stores';
import { DeviceScanDesktop } from './DeviceScanDesktop';
import { DeviceScanMobile } from './DeviceScanMobile';
import { useDeviceScan } from './useDeviceScan';

export interface DeviceScanToolProps {
  /** Optional CSS class name for styling the root container */
  className?: string;
}

/**
 * ARP Device Scan Tool Component
 *
 * Auto-detecting platform presenter for network device discovery.
 * Scans network for all connected devices using ARP ping sweep.
 * Displays results with MAC vendor lookup and DHCP lease correlation.
 *
 * Delegates to {@link DeviceScanDesktop} on desktop, {@link DeviceScanMobile}
 * on mobile based on viewport width from {@link usePlatform} hook.
 *
 * Features:
 * - Real-time device discovery with progress indicator
 * - MAC vendor identification (OUI lookup)
 * - DHCP lease correlation
 * - Subnet size validation
 * - Platform-specific UI (mobile/desktop)
 * - Virtualized table for large result sets
 * - Export to CSV/JSON
 *
 * @example
 * ```tsx
 * // Auto-detects platform (mobile vs desktop)
 * <DeviceScanTool />
 *
 * // With custom styling
 * <DeviceScanTool className="p-4" />
 * ```
 *
 * @see {@link DeviceScanDesktop} for desktop layout
 * @see {@link DeviceScanMobile} for mobile layout
 * @see {@link useDeviceScan} for scan logic
 */
export const DeviceScanTool = memo(function DeviceScanTool({ className }: DeviceScanToolProps) {
  const platform = usePlatform();

  // Get active router ID from connection store (memoized selector)
  const activeRouterId = useConnectionStore((state) => state.activeRouterId);

  // Stable callbacks for lifecycle events
  const handleScanComplete = useCallback((deviceCount: number) => {
    // Could show toast notification here if needed
    console.log(`Scan complete: ${deviceCount} devices found`);
  }, []);

  const handleScanError = useCallback((error: string) => {
    console.error('Scan error:', error);
  }, []);

  // Device scan hook with stable callbacks
  const scanHook = useDeviceScan({
    deviceId: activeRouterId ?? '',
    onComplete: (devices) => handleScanComplete(devices.length),
    onError: handleScanError,
  });

  // Delegate to platform-specific presenter
  const Presenter = platform === 'mobile' ? DeviceScanMobile : DeviceScanDesktop;

  return (
    <Presenter
      {...scanHook}
      routerId={activeRouterId}
      className={className}
    />
  );
});

DeviceScanTool.displayName = 'DeviceScanTool';
