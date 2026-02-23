import React from 'react';
import type { DiscoveredDevice } from './types';
/**
 * Props for DeviceDetailPanel component
 */
export interface DeviceDetailPanelProps {
    /** Device to display details for */
    device: DiscoveredDevice;
    /** Callback when panel should close */
    onClose: () => void;
    /** Router ID for adding to known devices */
    routerId?: string | null;
    /** Optional CSS class name */
    className?: string;
}
/**
 * DeviceDetailPanel
 * Displays detailed information for a discovered device including IP, MAC,
 * vendor, interface, response time, and DHCP lease details. Provides option
 * to add device to known devices list.
 *
 * @example
 * ```tsx
 * <DeviceDetailPanel
 *   device={selectedDevice}
 *   onClose={() => setSelected(null)}
 *   routerId={routerId}
 * />
 * ```
 *
 * @see {@link DiscoveredDevice} for device structure
 * @see {@link DeviceDiscoveryTable} for table of devices
 */
export declare const DeviceDetailPanel: React.NamedExoticComponent<DeviceDetailPanelProps>;
//# sourceMappingURL=DeviceDetailPanel.d.ts.map