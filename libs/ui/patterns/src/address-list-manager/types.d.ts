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
 *
 * Represents a single entry (IP, CIDR, or range) in a MikroTik address list.
 * Can be either statically configured or dynamically added by firewall rules.
 */
export interface AddressListEntry {
    /** Unique MikroTik internal ID for this entry */
    id: string;
    /** Name of the address list this entry belongs to */
    list: string;
    /** IP address (e.g., "192.168.1.1"), CIDR subnet (e.g., "10.0.0.0/24"), or IP range (e.g., "192.168.1.1-192.168.1.10") */
    address: string;
    /** Optional description or comment for this entry */
    comment?: string;
    /** Optional timeout duration (e.g., "1d", "12h"). When set, entry is automatically removed after timeout */
    timeout?: string;
    /** ISO 8601 timestamp when this entry was created */
    creationTime?: string | Date;
    /** True if this entry was added dynamically by a firewall action (read-only, auto-managed) */
    dynamic: boolean;
    /** True if this entry is disabled (not processed by firewall rules) */
    disabled: boolean;
}
/**
 * Aggregated address list with entry statistics
 *
 * Represents a complete address list with entry counts and statistics.
 * Entries are only populated when the list is expanded/detailed view.
 */
export interface AddressList {
    /** Unique list name (identifier). Technical data, always shown in monospace font */
    name: string;
    /** Total number of entries in this list (includes both static and dynamic) */
    entryCount: number;
    /** Number of dynamically added entries (added by firewall actions, not user-created) */
    dynamicCount: number;
    /** Number of firewall filter rules that reference this list */
    referencingRulesCount: number;
    /** Entries in this list. Only populated when list is expanded or lazy-loaded. */
    entries?: AddressListEntry[];
}
/**
 * Firewall rule reference (simplified for display)
 *
 * Represents a firewall filter rule that references an address list.
 * Used in the "Show Rules" dialog to display which rules use this list.
 */
export interface FirewallRule {
    /** Unique rule identifier */
    id: string;
    /** Firewall chain: "input" (incoming), "forward" (routing), "output" (outgoing), "prerouting", or "postrouting" */
    chain: string;
    /** Rule action: "accept" (allow), "drop" (silently block), "reject" (block with response), etc. */
    action: string;
    /** Rule comment/description for reference */
    comment?: string;
    /** True if rule is disabled (not applied to traffic) */
    disabled: boolean;
}
/**
 * AddressListManager component props
 *
 * CRITICAL: Data is passed via props - NO data fetching in Layer 2 pattern.
 * Parent component (Layer 3) is responsible for GraphQL queries and data management.
 *
 * @example
 * ```tsx
 * // Layer 3 component (fetches data)
 * function AddressListPage() {
 *   const { data: lists, loading } = useQuery(GET_ADDRESS_LISTS, {
 *     variables: { routerId }
 *   });
 *
 *   return (
 *     <AddressListManager
 *       lists={lists ?? []}
 *       isLoading={loading}
 *       onDeleteList={handleDelete}
 *     />
 *   );
 * }
 * ```
 */
export interface AddressListManagerProps {
    /** Array of address lists to display. Fetched by parent component via GraphQL query. */
    lists: AddressList[];
    /** Loading state indicator. Shows skeleton while data is being fetched. */
    isLoading?: boolean;
    /** Error state. Shows error message if data fetch fails. */
    error?: Error | null;
    /** Callback when user adds an entry to a list. */
    onAddEntry?: (listName: string, address: string) => void | Promise<void>;
    /** Callback when user deletes an entry. */
    onDeleteEntry?: (entryId: string) => void | Promise<void>;
    /** Callback when user deletes an address list. */
    onDeleteList?: (listName: string) => void | Promise<void>;
    /** Function to fetch entries for a specific list (lazy loading). Called when user expands list. */
    onFetchEntries?: (listName: string) => Promise<AddressListEntry[]>;
    /** Function to fetch firewall rules that reference a list. Called when user clicks "Show Rules". */
    onFetchReferencingRules?: (listName: string) => Promise<FirewallRule[]>;
    /** Whether to show bulk action controls (select multiple, delete multiple). */
    showBulkActions?: boolean;
    /** Whether to use virtualization for rendering large lists (>50 entries). Improves performance. */
    enableVirtualization?: boolean;
    /** Optional CSS class name for custom styling */
    className?: string;
    /** Custom message to show when no lists are found */
    emptyMessage?: string;
    /** Custom action button/content to show in empty state */
    emptyAction?: ReactNode;
    /** Additional children elements to render (e.g., floating action button) */
    children?: ReactNode;
}
/**
 * Sort field options for address list table
 *
 * @type {'name'} - Sort by list name alphabetically
 * @type {'entryCount'} - Sort by total number of entries
 * @type {'dynamicCount'} - Sort by number of dynamic entries
 * @type {'referencingRulesCount'} - Sort by number of referencing firewall rules
 */
export type SortField = 'name' | 'entryCount' | 'dynamicCount' | 'referencingRulesCount';
/**
 * Sort direction for address list table
 *
 * @type {'asc'} - Ascending order
 * @type {'desc'} - Descending order
 */
export type SortDirection = 'asc' | 'desc';
/**
 * Sort configuration for address list table
 *
 * Tracks which column is currently sorted and in which direction.
 * Used in desktop presenter only; mobile uses default order.
 */
export interface SortConfig {
    /** Which field to sort by */
    field: SortField;
    /** Sort direction (ascending or descending) */
    direction: SortDirection;
}
//# sourceMappingURL=types.d.ts.map