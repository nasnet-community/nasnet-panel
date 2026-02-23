/**
 * AddressListManager Tablet Presenter
 *
 * Tablet-optimized view with collapsible sidebar and master-detail pattern.
 * Balanced density with touch-friendly interactions.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */
import type { AddressListManagerProps } from './types';
import type { UseAddressListManagerStateReturn } from './useAddressListManagerState';
export interface AddressListManagerTabletProps extends AddressListManagerProps, UseAddressListManagerStateReturn {
}
/**
 * Tablet presenter for AddressListManager
 *
 * Features:
 * - Master-detail layout with collapsible list panel
 * - Touch-friendly interaction targets
 * - Sheet panels for detailed entry viewing
 * - Balanced information density
 */
export declare const AddressListManagerTablet: import("react").NamedExoticComponent<AddressListManagerTabletProps>;
//# sourceMappingURL=AddressListManager.tablet.d.ts.map