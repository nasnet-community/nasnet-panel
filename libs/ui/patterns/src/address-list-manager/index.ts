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

// Main auto-detecting component
export { AddressListManager } from './AddressListManager';

// Platform-specific presenters (for direct use if needed, rare cases ~5%)
export { AddressListManagerMobile } from './AddressListManager.mobile';
export { AddressListManagerTablet } from './AddressListManager.tablet';
export { AddressListManagerDesktop } from './AddressListManager.desktop';

// Headless hook (UI state only, no data fetching)
export { useAddressListManagerState } from './useAddressListManagerState';
export type { UseAddressListManagerStateReturn } from './useAddressListManagerState';

// Types (shared across all presenters)
export type {
  AddressListManagerProps,
  AddressList,
  AddressListEntry,
  FirewallRule,
  SortConfig,
  SortField,
  SortDirection,
} from './types';
