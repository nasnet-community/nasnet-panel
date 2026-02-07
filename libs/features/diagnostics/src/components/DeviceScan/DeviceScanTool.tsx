// =============================================================================
// DeviceScanTool Component
// =============================================================================
// Main component that detects platform and delegates to appropriate presenter

import { usePlatform } from '@nasnet/ui/layouts';
import { useConnectionStore } from '@nasnet/state/stores';
import { DeviceScanDesktop } from './DeviceScanDesktop';
import { DeviceScanMobile } from './DeviceScanMobile';
import { useDeviceScan } from './useDeviceScan';

export interface DeviceScanToolProps {
  /** Optional CSS class name */
  className?: string;
}

/**
 * ARP Device Scan Tool
 *
 * Scans network for all connected devices using ARP ping sweep.
 * Displays results with MAC vendor lookup and DHCP lease correlation.
 *
 * Features:
 * - Real-time device discovery with progress indicator
 * - MAC vendor identification (OUI lookup)
 * - DHCP lease correlation
 * - Subnet size validation
 * - Platform-specific UI (mobile/desktop)
 * - Virtualized table for large result sets
 *
 * @example
 * ```tsx
 * <DeviceScanTool />
 * ```
 */
export function DeviceScanTool({ className }: DeviceScanToolProps) {
  const platform = usePlatform();

  // Get active router ID from connection store
  const activeRouterId = useConnectionStore((state) => state.activeRouterId);

  // Device scan hook
  const scanHook = useDeviceScan({
    deviceId: activeRouterId ?? '',
    onComplete: (devices) => {
      // Could show toast notification here
      console.log(`Scan complete: ${devices.length} devices found`);
    },
    onError: (error) => {
      console.error('Scan error:', error);
    },
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
}
