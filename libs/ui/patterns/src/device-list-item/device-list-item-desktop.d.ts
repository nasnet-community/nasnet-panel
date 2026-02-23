/**
 * DeviceListItem Desktop Presenter
 *
 * Desktop-specific rendering for DeviceListItem.
 * Optimized for dense information display with inline details.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */
import type { DeviceListItemPresenterProps } from './device-list-item.types';
/**
 * Desktop presenter for DeviceListItem
 *
 * Features:
 * - Compact table row layout
 * - Inline details (no expansion needed)
 * - Hover row actions
 * - High information density
 *
 * @param props - Presenter props with computed state
 */
export declare function DeviceListItemDesktop({ state, device, onClick, className, id, }: DeviceListItemPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=device-list-item-desktop.d.ts.map