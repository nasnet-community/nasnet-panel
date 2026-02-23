/**
 * AddressListManager Desktop Presenter
 *
 * Desktop-optimized view with expandable table rows and virtualization.
 * Pro-grade density with hover states and dropdown menus.
 *
 * @see ADR-018: Headless Platform Presenters
 * @see NAS-7.3: Implement Address Lists
 */
import type { AddressListManagerProps } from './types';
import type { UseAddressListManagerStateReturn } from './useAddressListManagerState';
export interface AddressListManagerDesktopProps extends AddressListManagerProps, UseAddressListManagerStateReturn {
}
/**
 * Desktop presenter for AddressListManager
 *
 * Features:
 * - Expandable table rows with virtualization
 * - Sortable columns
 * - Dropdown menus for actions
 * - Dense layout optimized for desktop
 */
export declare const AddressListManagerDesktop: import("react").NamedExoticComponent<AddressListManagerDesktopProps>;
//# sourceMappingURL=AddressListManager.desktop.d.ts.map