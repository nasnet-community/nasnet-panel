/**
 * Address List Management Query Hooks
 * NAS-7.3: Implement Address Lists
 *
 * Provides hooks for fetching and managing MikroTik firewall address lists
 * Uses TanStack Query for data fetching and caching
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { makeRouterOSRequest } from '@nasnet/api-client/core';

// =============================================================================
// Types
// =============================================================================

/**
 * Raw address list entry from MikroTik RouterOS REST API
 * RouterOS returns hyphenated field names
 */
interface RawAddressListEntry {
  '.id': string;
  list: string;
  address: string;
  comment?: string;
  timeout?: string;
  'creation-time'?: string;
  dynamic?: string; // "true" or "false" as string
  disabled?: string; // "true" or "false" as string
}

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

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for address list operations
 * Follows TanStack Query best practices for hierarchical keys
 */
export const addressListKeys = {
  all: ['addressLists'] as const,
  lists: (routerId: string) => [...addressListKeys.all, 'lists', routerId] as const,
  entries: (routerId: string, listName: string) =>
    [...addressListKeys.all, 'entries', routerId, listName] as const,
  entriesPaginated: (routerId: string, listName: string, cursor?: string) =>
    [...addressListKeys.all, 'entries', routerId, listName, { cursor }] as const,
};

// =============================================================================
// Transformation Functions
// =============================================================================

/**
 * Transform raw API response to AddressListEntry type
 * Maps hyphenated keys to camelCase and converts string booleans
 */
function transformAddressListEntry(raw: RawAddressListEntry): AddressListEntry {
  return {
    id: raw['.id'],
    list: raw.list,
    address: raw.address,
    comment: raw.comment,
    timeout: raw.timeout,
    creationTime: raw['creation-time'],
    dynamic: raw.dynamic === 'true',
    disabled: raw.disabled === 'true',
  };
}

/**
 * Aggregate raw entries into address lists with statistics
 * Groups entries by list name and computes counts
 */
function aggregateAddressLists(entries: RawAddressListEntry[]): AddressList[] {
  const listsMap = new Map<string, AddressList>();

  entries.forEach((raw) => {
    const entry = transformAddressListEntry(raw);
    const listName = entry.list;

    if (!listsMap.has(listName)) {
      listsMap.set(listName, {
        name: listName,
        entryCount: 0,
        dynamicCount: 0,
        entries: [],
      });
    }

    const list = listsMap.get(listName)!;
    list.entryCount++;
    if (entry.dynamic) {
      list.dynamicCount++;
    }
    list.entries.push(entry);
  });

  return Array.from(listsMap.values());
}

/**
 * Create paginated connection from entries
 * Implements cursor-based pagination
 */
function createEntriesConnection(
  entries: AddressListEntry[],
  first: number,
  after?: string
): AddressListEntriesConnection {
  const startIndex = after ? parseInt(after, 10) + 1 : 0;
  const endIndex = Math.min(startIndex + first, entries.length);
  const paginatedEntries = entries.slice(startIndex, endIndex);

  const edges = paginatedEntries.map((entry, idx) => ({
    cursor: String(startIndex + idx),
    node: entry,
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage: endIndex < entries.length,
      hasPreviousPage: startIndex > 0,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    },
    totalCount: entries.length,
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch all address list entries from RouterOS
 * Endpoint: GET /rest/ip/firewall/address-list
 */
async function fetchAllAddressListEntries(routerId: string): Promise<RawAddressListEntry[]> {
  const result = await makeRouterOSRequest<RawAddressListEntry[]>(
    routerId,
    'ip/firewall/address-list'
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch address lists');
  }

  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Fetch entries for a specific address list
 * Endpoint: GET /rest/ip/firewall/address-list?list={name}
 */
async function fetchAddressListEntries(
  routerId: string,
  listName: string
): Promise<AddressListEntry[]> {
  const result = await makeRouterOSRequest<RawAddressListEntry[]>(
    routerId,
    `ip/firewall/address-list?list=${encodeURIComponent(listName)}`
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch address list entries');
  }

  const data = Array.isArray(result.data) ? result.data : [];
  return data.map(transformAddressListEntry);
}

/**
 * Create a new address list entry
 * Endpoint: PUT /rest/ip/firewall/address-list
 */
async function createAddressListEntry(
  routerId: string,
  input: CreateAddressListEntryInput
): Promise<AddressListEntry> {
  const payload: Record<string, string> = {
    list: input.list,
    address: input.address,
  };

  if (input.comment) {
    payload.comment = input.comment;
  }

  if (input.timeout) {
    payload.timeout = input.timeout;
  }

  const result = await makeRouterOSRequest<RawAddressListEntry>(
    routerId,
    'ip/firewall/address-list',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create address list entry');
  }

  return transformAddressListEntry(result.data);
}

/**
 * Delete an address list entry by ID
 * Endpoint: DELETE /rest/ip/firewall/address-list/{id}
 */
async function deleteAddressListEntry(routerId: string, id: string): Promise<boolean> {
  const result = await makeRouterOSRequest(routerId, `ip/firewall/address-list/${id}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete address list entry');
  }

  return true;
}

/**
 * Bulk create address list entries
 * Creates multiple entries in batches with error tracking
 */
async function bulkCreateAddressListEntries(
  routerId: string,
  listName: string,
  entries: BulkAddressInput[],
  onProgress?: (completed: number, total: number) => void
): Promise<BulkCreateResult> {
  let successCount = 0;
  let failedCount = 0;
  const errors: BulkCreateResult['errors'] = [];

  const batchSize = 100; // Process 100 entries at a time
  const batches = Math.ceil(entries.length / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, entries.length);
    const batchEntries = entries.slice(start, end);

    const results = await Promise.allSettled(
      batchEntries.map((entry, idx) =>
        createAddressListEntry(routerId, {
          list: listName,
          address: entry.address,
          comment: entry.comment,
          timeout: entry.timeout,
        }).then(() => ({ success: true, index: start + idx }))
          .catch((error) => ({
            success: false,
            index: start + idx,
            address: entry.address,
            message: error.message,
          }))
      )
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successCount++;
        } else {
          failedCount++;
          const val = result.value as { success: boolean; index: number; address: string; message: any };
          errors.push({
            index: val.index,
            address: val.address,
            message: val.message,
          });
        }
      } else {
        failedCount++;
      }
    });

    // Report progress
    if (onProgress) {
      onProgress(successCount + failedCount, entries.length);
    }
  }

  return {
    successCount,
    failedCount,
    errors,
  };
}

// =============================================================================
// Query Hooks
// =============================================================================

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

export function useAddressLists(
  routerId: string,
  options?: UseAddressListsOptions
): UseQueryResult<AddressList[], Error> {
  return useQuery({
    queryKey: addressListKeys.lists(routerId),
    queryFn: async () => {
      const rawEntries = await fetchAllAddressListEntries(routerId);
      return aggregateAddressLists(rawEntries);
    },
    enabled: !!routerId && (options?.enabled ?? true),
    staleTime: 30_000, // 30 seconds
    refetchInterval: options?.refetchInterval ?? 30_000, // Poll every 30 seconds
  });
}

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

export function useAddressListEntries(
  routerId: string,
  listName: string,
  options?: UseAddressListEntriesOptions
): UseQueryResult<AddressListEntriesConnection, Error> {
  const first = options?.first ?? 50;
  const after = options?.after;

  return useQuery({
    queryKey: addressListKeys.entriesPaginated(routerId, listName, after),
    queryFn: async () => {
      const entries = await fetchAddressListEntries(routerId, listName);
      return createEntriesConnection(entries, first, after);
    },
    enabled: !!routerId && !!listName && (options?.enabled ?? true),
    staleTime: 30_000, // 30 seconds
    placeholderData: (prev: any) => prev, // Keeps previous data while fetching new page
  }) as UseQueryResult<AddressListEntriesConnection, Error>;
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new address list entry
 *
 * Automatically invalidates address lists and entries queries to refresh UI
 *
 * @returns Mutation function and state
 */
export function useCreateAddressListEntry(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAddressListEntryInput) =>
      createAddressListEntry(routerId, input),
    onSuccess: (data, variables) => {
      // Invalidate all address lists to refresh counts
      queryClient.invalidateQueries({ queryKey: addressListKeys.lists(routerId) });

      // Invalidate specific list entries
      queryClient.invalidateQueries({
        queryKey: addressListKeys.entries(routerId, variables.list),
      });
    },
    retry: 2, // Retry failed mutations up to 2 times
  });
}

/**
 * Hook to delete an address list entry
 *
 * Automatically invalidates queries to refresh UI after deletion
 *
 * @returns Mutation function and state
 */
interface DeleteAddressListEntryVariables {
  id: string;
  listName: string; // Needed to invalidate specific list queries
}

export function useDeleteAddressListEntry(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: DeleteAddressListEntryVariables) =>
      deleteAddressListEntry(routerId, variables.id),
    onSuccess: (_data, variables) => {
      // Invalidate all address lists to refresh counts
      queryClient.invalidateQueries({ queryKey: addressListKeys.lists(routerId) });

      // Invalidate specific list entries
      queryClient.invalidateQueries({
        queryKey: addressListKeys.entries(routerId, variables.listName),
      });
    },
    retry: 2,
  });
}

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

export function useBulkCreateAddressListEntries(routerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: BulkCreateAddressListEntriesVariables) =>
      bulkCreateAddressListEntries(
        routerId,
        variables.listName,
        variables.entries,
        variables.onProgress
      ),
    onSuccess: (_data, variables) => {
      // Invalidate all address lists to refresh counts
      queryClient.invalidateQueries({ queryKey: addressListKeys.lists(routerId) });

      // Invalidate specific list entries
      queryClient.invalidateQueries({
        queryKey: addressListKeys.entries(routerId, variables.listName),
      });
    },
    retry: false, // Don't retry bulk operations automatically
  });
}
