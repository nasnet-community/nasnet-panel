/**
 * DeviceListItem Tablet Presenter
 *
 * Tablet-specific rendering for DeviceListItem.
 * Hybrid approach between mobile and desktop.
 * Part of the Headless + Platform Presenter pattern (ADR-018).
 *
 * @module @nasnet/ui/patterns/device-list-item
 * @see NAS-5.4: DHCP Leases and Active Connections Display
 */
import type { DeviceListItemPresenterProps } from './device-list-item.types';
/**
 * Tablet presenter for DeviceListItem
 *
 * Features:
 * - Card layout with expandable section
 * - 2-column grid for details
 * - Balanced information density
 * - Touch-friendly but more compact than mobile
 *
 * @param props - Presenter props with computed state
 */
export declare function DeviceListItemTablet({ state, device, onClick, className, id, }: DeviceListItemPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=device-list-item-tablet.d.ts.map