import React from 'react';
import type { DiscoveredDevice } from './types';
/**
 * Props for DeviceDiscoveryTable component
 */
export interface DeviceDiscoveryTableProps {
    /** List of discovered devices */
    devices: DiscoveredDevice[];
    /** Callback when device is selected */
    onSelectDevice: (device: DiscoveredDevice | null) => void;
    /** Currently selected device */
    selectedDevice: DiscoveredDevice | null;
    /** Optional CSS class name */
    className?: string;
}
/**
 * DeviceDiscoveryTable
 * Displays discovered devices in a table with automatic virtualization for
 * large datasets (>50 devices). Supports row selection with visual highlighting.
 * Uses font-mono for IPs and MACs for technical accuracy.
 *
 * Features:
 * - Responsive virtualization (DataTable for <50, VirtualizedTable for ≥50)
 * - Row selection with click handlers
 * - Status badges (DHCP vs Static)
 * - Device count footer
 * - Semantic tokens for colors and spacing
 *
 * @example
 * ```tsx
 * <DeviceDiscoveryTable
 *   devices={discoveredDevices}
 *   selectedDevice={selected}
 *   onSelectDevice={setSelected}
 * />
 * ```
 *
 * @see {@link DiscoveredDevice} for device structure
 * @see {@link DeviceDetailPanel} for detail view
 */
export declare const DeviceDiscoveryTable: React.NamedExoticComponent<DeviceDiscoveryTableProps>;
//# sourceMappingURL=DeviceDiscoveryTable.d.ts.map