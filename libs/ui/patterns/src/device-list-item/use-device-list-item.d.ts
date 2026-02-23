/**
 * useDeviceListItem Hook
 *
 * Headless hook for DeviceListItem pattern component.
 * Computes display state and provides action handlers.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */
import type { UseDeviceListItemConfig, UseDeviceListItemReturn } from './device-list-item.types';
/**
 * Headless hook for DeviceListItem component
 *
 * Computes all display state and UI logic without rendering anything.
 * Presenters consume this state to render platform-specific UI.
 *
 * @param config - Hook configuration
 * @returns Computed state and handlers
 */
export declare function useDeviceListItem(config: UseDeviceListItemConfig): UseDeviceListItemReturn;
//# sourceMappingURL=use-device-list-item.d.ts.map