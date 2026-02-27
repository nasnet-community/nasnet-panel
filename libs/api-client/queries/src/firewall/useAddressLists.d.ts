/**
 * Address List Management Query Hooks
 * NAS-7.3: Implement Address Lists
 *
 * Provides hooks for fetching and managing MikroTik firewall address lists
 * Uses TanStack Query for data fetching and caching
 */
import { UseQueryResult } from '@tanstack/react-query';
/**
 * Transformed address list entry with camelCase fields
 */
export interface AddressListEntry {
  id: string;
  list: string;
  address: string;
  comment?: string;
  timeout?: string;
  creationTime?: string;
  dynamic: boolean;
  disabled: boolean;
}
/**
 * Aggregated address list with statistics
 * Computed from raw entries grouped by list name
 */
export interface AddressList {
  name: string;
  entryCount: number;
  dynamicCount: number;
  entries: AddressListEntry[];
}
/**
 * Paginated entries connection for cursor-based pagination
 */
export interface AddressListEntriesConnection {
  edges: Array<{
    cursor: string;
    node: AddressListEntry;
  }>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}
/**
 * Input for creating a new address list entry
 */
export interface CreateAddressListEntryInput {
  list: string;
  address: string;
  comment?: string;
  timeout?: string;
}
/**
 * Input for bulk creating address list entries
 */
export interface BulkAddressInput {
  address: string;
  comment?: string;
  timeout?: string;
}
/**
 * Result from bulk create operation
 */
export interface BulkCreateResult {
  successCount: number;
  failedCount: number;
  errors: Array<{
    index: number;
    address: string;
    message: string;
  }>;
}
/**
 * Query keys for address list operations
 * Follows TanStack Query best practices for hierarchical keys
 */
export declare const addressListKeys: {
  all: readonly ['addressLists'];
  lists: (routerId: string) => readonly ['addressLists', 'lists', string];
  entries: (
    routerId: string,
    listName: string
  ) => readonly ['addressLists', 'entries', string, string];
  entriesPaginated: (
    routerId: string,
    listName: string,
    cursor?: string
  ) => readonly [
    'addressLists',
    'entries',
    string,
    string,
    {
      readonly cursor: string | undefined;
    },
  ];
};
/**
 * Hook to fetch all address lists with aggregated statistics
 *
 * Polls every 30 seconds to keep data fresh
 * Aggregates raw entries into lists with entry counts
 *
 * @param routerId - Target router IP address
 * @param options - Query options
 * @returns Query result with AddressList[] data
 */
interface UseAddressListsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}
export declare function useAddressLists(
  routerId: string,
  options?: UseAddressListsOptions
): UseQueryResult<AddressList[], Error>;
/**
 * Hook to fetch entries for a specific address list with cursor-based pagination
 *
 * Supports infinite scrolling with fetchMore-style pagination
 *
 * @param routerId - Target router IP address
 * @param listName - Address list name to fetch entries for
 * @param options - Pagination and query options
 * @returns Query result with paginated entries
 */
interface UseAddressListEntriesOptions {
  first?: number;
  after?: string;
  enabled?: boolean;
}
export declare function useAddressListEntries(
  routerId: string,
  listName: string,
  options?: UseAddressListEntriesOptions
): UseQueryResult<AddressListEntriesConnection, Error>;
/**
 * Hook to create a new address list entry
 *
 * Automatically invalidates address lists and entries queries to refresh UI
 *
 * @returns Mutation function and state
 */
export declare function useCreateAddressListEntry(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<
  AddressListEntry,
  Error,
  CreateAddressListEntryInput,
  unknown
>;
/**
 * Hook to delete an address list entry
 *
 * Automatically invalidates queries to refresh UI after deletion
 *
 * @returns Mutation function and state
 */
interface DeleteAddressListEntryVariables {
  id: string;
  listName: string;
}
export declare function useDeleteAddressListEntry(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<
  boolean,
  Error,
  DeleteAddressListEntryVariables,
  unknown
>;
/**
 * Hook to bulk create address list entries
 *
 * Supports progress tracking via onProgress callback
 * Invalidates queries after completion
 *
 * @returns Mutation function with progress tracking
 */
interface BulkCreateAddressListEntriesVariables {
  listName: string;
  entries: BulkAddressInput[];
  onProgress?: (completed: number, total: number) => void;
}
export declare function useBulkCreateAddressListEntries(
  routerId: string
): import('@tanstack/react-query').UseMutationResult<
  BulkCreateResult,
  Error,
  BulkCreateAddressListEntriesVariables,
  unknown
>;
export {};
//# sourceMappingURL=useAddressLists.d.ts.map
