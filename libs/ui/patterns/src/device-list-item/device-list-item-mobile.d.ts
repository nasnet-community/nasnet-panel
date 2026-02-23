/**
 * DeviceListItem Mobile Presenter
 *
 * Mobile-specific rendering for DeviceListItem.
 * Optimized for touch interaction with 44px minimum touch targets.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */
import type { DeviceListItemPresenterProps } from './device-list-item.types';
/**
 * Mobile presenter for DeviceListItem
 *
 * Features:
 * - 44px minimum row height for touch targets
 * - Tap-to-expand for device details
 * - Vertical card stack layout
 * - Bottom sheet compatible
 *
 * @param props - Presenter props with computed state
 */
export declare function DeviceListItemMobile({ state, device, onClick, className, id, }: DeviceListItemPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=device-list-item-mobile.d.ts.map