// =============================================================================
// DeviceScan - Public API
// =============================================================================
// ARP device scanning with real-time progress and vendor identification

// Main Component
export { DeviceScanTool } from './DeviceScanTool';
export type { DeviceScanToolProps } from './DeviceScanTool';

// Headless Hook
export { useDeviceScan } from './useDeviceScan';

// Sub-components (for custom compositions)
export { DeviceDiscoveryTable } from './DeviceDiscoveryTable';
export type { DeviceDiscoveryTableProps } from './DeviceDiscoveryTable';

export { DeviceDetailPanel } from './DeviceDetailPanel';
export type { DeviceDetailPanelProps } from './DeviceDetailPanel';

export { ScanSummary } from './ScanSummary';
export type { ScanSummaryProps } from './ScanSummary';

// Platform Presenters (for advanced use cases)
export { DeviceScanDesktop } from './DeviceScanDesktop';
export type { DeviceScanDesktopProps } from './DeviceScanDesktop';

export { DeviceScanMobile } from './DeviceScanMobile';
export type { DeviceScanMobileProps } from './DeviceScanMobile';

// Types
export type {
  ScanStatus,
  ScanConfig,
  DiscoveredDevice,
  ScanStats,
} from './types';
