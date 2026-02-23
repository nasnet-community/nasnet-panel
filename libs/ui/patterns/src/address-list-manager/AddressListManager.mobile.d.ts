/**
 * AddressListManager Mobile Presenter
 *
 * Mobile-optimized view with Sheet slide-out panels for entries.
 * Touch-first with 44px touch targets and bottom navigation.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */
import type { AddressListManagerProps } from './types';
import type { UseAddressListManagerStateReturn } from './useAddressListManagerState';
export interface AddressListManagerMobileProps extends AddressListManagerProps, UseAddressListManagerStateReturn {
}
/**
 * Mobile presenter for AddressListManager
 *
 * Features:
 * - Touch-optimized card list
 * - Sheet slide-out panels for entries
 * - 44px minimum touch targets
 * - Simplified layout for small screens
 */
export declare const AddressListManagerMobile: import("react").NamedExoticComponent<AddressListManagerMobileProps>;
//# sourceMappingURL=AddressListManager.mobile.d.ts.map