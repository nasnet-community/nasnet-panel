/**
 * AddressListManager Pattern Component
 *
 * Layer 2 pattern for displaying address lists with expandable entries.
 * Implements Headless + Platform Presenters architecture (ADR-018).
 *
 * @see NAS-7.3: Implement Address Lists
 * @see Docs/design/ux-design/6-component-library.md
 * @see Docs/architecture/adrs/018-headless-platform-presenters.md
 */
export { AddressListManager } from './AddressListManager';
export { AddressListManagerMobile } from './AddressListManager.mobile';
export { AddressListManagerTablet } from './AddressListManager.tablet';
export { AddressListManagerDesktop } from './AddressListManager.desktop';
export { useAddressListManagerState } from './useAddressListManagerState';
export type { UseAddressListManagerStateReturn } from './useAddressListManagerState';
export type { AddressListManagerProps, AddressList, AddressListEntry, FirewallRule, SortConfig, SortField, SortDirection, } from './types';
//# sourceMappingURL=index.d.ts.map