/**
 * AddressListManager Pattern Component
 *
 * Layer 2 pattern for displaying address lists with expandable entries.
 * Implements Headless + Platform Presenters architecture (ADR-018).
 *
 * @see NAS-7.3: Implement Address Lists
 * @see Docs/sprint-artifacts/Epic7-Security-Firewall/NAS-7-3-implement-address-lists.md
 */

// Main component
export { AddressListManager } from './AddressListManager';

// Presenters (for direct use if needed)
export { AddressListManagerDesktop } from './AddressListManager.desktop';
export { AddressListManagerMobile } from './AddressListManager.mobile';

// Headless hook
export { useAddressListManagerState } from './useAddressListManagerState';
export type { UseAddressListManagerStateReturn } from './useAddressListManagerState';

// Types
export type {
  AddressListManagerProps,
  AddressList,
  AddressListEntry,
  FirewallRule,
  SortConfig,
  SortField,
  SortDirection,
} from './types';
