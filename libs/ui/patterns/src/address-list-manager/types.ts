/**
 * AddressListManager Types
 *
 * TypeScript interfaces for the AddressListManager pattern component.
 *
 * CRITICAL: Layer 2 pattern - receives data via props, does NOT fetch data.
 * @see NAS-7.3: Implement Address Lists
 */

import type { ReactNode } from 'react';

/**
 * Address list entry interface
 */
export interface AddressListEntry {
  /** MikroTik internal ID */
  id: string;
  /** Name of the address list this entry belongs to */
  list: string;
  /** IP address, CIDR subnet, or IP range */
  address: string;
  /** Optional description */
  comment?: string;
  /** Optional timeout after which entry is removed */
  timeout?: string;
  /** When this entry was created */
  creationTime?: string | Date;
  /** Whether this entry was added dynamically by a firewall action */
  dynamic: boolean;
  /** Whether this entry is disabled */
  disabled: boolean;
}

/**
 * Aggregated address list with entry statistics
 */
export interface AddressList {
  /** List name (unique identifier) */
  name: string;
  /** Total number of entries in this list */
  entryCount: number;
  /** Number of dynamic entries (added by firewall actions) */
  dynamicCount: number;
  /** Number of firewall rules referencing this list */
  referencingRulesCount: number;
  /** Entries in this list (for expanded view) */
  entries?: AddressListEntry[];
}

/**
 * Firewall rule reference (simplified for display)
 */
export interface FirewallRule {
  /** Rule ID */
  id: string;
  /** Rule chain (input, forward, output, prerouting, postrouting) */
  chain: string;
  /** Rule action (accept, drop, reject, etc.) */
  action: string;
  /** Rule comment/description */
  comment?: string;
  /** Whether rule is disabled */
  disabled: boolean;
}

/**
 * AddressListManager component props
 *
 * CRITICAL: Data is passed via props - NO data fetching in Layer 2
 */
export interface AddressListManagerProps {
  /** Address lists data - fetched by parent component (Layer 3) */
  lists: AddressList[];

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;

  /** Callback when an entry is added to a list */
  onAddEntry?: (listName: string, address: string) => void | Promise<void>;

  /** Callback when an entry is deleted */
  onDeleteEntry?: (entryId: string) => void | Promise<void>;

  /** Callback when a list is deleted */
  onDeleteList?: (listName: string) => void | Promise<void>;

  /** Function to fetch entries for a specific list (for lazy loading) */
  onFetchEntries?: (listName: string) => Promise<AddressListEntry[]>;

  /** Function to fetch rules referencing a list */
  onFetchReferencingRules?: (listName: string) => Promise<FirewallRule[]>;

  /** Whether to show bulk actions (select multiple lists) */
  showBulkActions?: boolean;

  /** Whether to enable virtualization for large lists */
  enableVirtualization?: boolean;

  /** Optional className for styling */
  className?: string;

  /** Custom empty state message */
  emptyMessage?: string;

  /** Custom empty state action */
  emptyAction?: ReactNode;

  /** Additional children to render */
  children?: ReactNode;
}

/**
 * Sort field options
 */
export type SortField = 'name' | 'entryCount' | 'dynamicCount' | 'referencingRulesCount';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
