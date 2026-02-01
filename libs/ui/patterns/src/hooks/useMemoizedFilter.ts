/**
 * @fileoverview Memoized filtering and sorting utilities
 *
 * These hooks prevent expensive array operations from running on every render
 * by memoizing results based on input dependencies.
 *
 * Key patterns:
 * - Always spread items array in deps to detect item changes
 * - Pass stable filter/sort functions via useCallback or useStableCallback
 * - Use with useMemo for derived computations
 *
 * @example
 * ```tsx
 * // Memoized filtering
 * const activeItems = useMemoizedFilter(
 *   items,
 *   (item) => item.isActive,
 *   [] // Add deps if filter fn changes
 * );
 *
 * // Memoized sorting
 * const sortedItems = useMemoizedSort(
 *   items,
 *   (a, b) => a.name.localeCompare(b.name),
 *   [] // Add deps if sort fn changes
 * );
 *
 * // Combined filter + sort
 * const processedItems = useMemoizedFilterSort(
 *   items,
 *   (item) => item.isActive,
 *   (a, b) => a.name.localeCompare(b.name),
 *   [] // Add deps as needed
 * );
 * ```
 */

import { useMemo, type DependencyList } from 'react';

/**
 * Memoized array filter that only recomputes when items or deps change
 *
 * @param items - Array to filter
 * @param filterFn - Predicate function
 * @param deps - Additional dependencies that affect filter behavior
 * @returns Filtered array (stable reference when inputs unchanged)
 *
 * @example
 * ```tsx
 * const onlineRouters = useMemoizedFilter(
 *   routers,
 *   (r) => r.status === 'online',
 *   []
 * );
 * ```
 */
export function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T, index: number, array: T[]) => boolean,
  deps: DependencyList
): T[] {
  return useMemo(
    () => items.filter(filterFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, ...deps]
  );
}

/**
 * Memoized array sort that only recomputes when items or deps change
 *
 * Note: Creates a shallow copy to avoid mutating the original array.
 *
 * @param items - Array to sort
 * @param sortFn - Comparator function
 * @param deps - Additional dependencies that affect sort behavior
 * @returns Sorted array (stable reference when inputs unchanged)
 *
 * @example
 * ```tsx
 * const sortedByName = useMemoizedSort(
 *   items,
 *   (a, b) => a.name.localeCompare(b.name),
 *   []
 * );
 * ```
 */
export function useMemoizedSort<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  deps: DependencyList
): T[] {
  return useMemo(
    () => [...items].sort(sortFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, ...deps]
  );
}

/**
 * Combined memoized filter and sort for common data processing pattern
 *
 * @param items - Array to process
 * @param filterFn - Predicate function (pass null to skip filtering)
 * @param sortFn - Comparator function (pass null to skip sorting)
 * @param deps - Additional dependencies
 * @returns Filtered and sorted array
 *
 * @example
 * ```tsx
 * const displayItems = useMemoizedFilterSort(
 *   items,
 *   (item) => item.isVisible,
 *   (a, b) => a.priority - b.priority,
 *   [isAdmin] // Re-filter when isAdmin changes
 * );
 * ```
 */
export function useMemoizedFilterSort<T>(
  items: T[],
  filterFn: ((item: T, index: number, array: T[]) => boolean) | null,
  sortFn: ((a: T, b: T) => number) | null,
  deps: DependencyList
): T[] {
  return useMemo(() => {
    let result = items;

    if (filterFn) {
      result = result.filter(filterFn);
    }

    if (sortFn) {
      result = [...result].sort(sortFn);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ...deps]);
}

/**
 * Memoized array map that only recomputes when items or deps change
 *
 * @param items - Array to transform
 * @param mapFn - Transform function
 * @param deps - Additional dependencies
 * @returns Transformed array
 *
 * @example
 * ```tsx
 * const displayNames = useMemoizedMap(
 *   users,
 *   (user) => user.fullName,
 *   []
 * );
 * ```
 */
export function useMemoizedMap<T, U>(
  items: T[],
  mapFn: (item: T, index: number, array: T[]) => U,
  deps: DependencyList
): U[] {
  return useMemo(
    () => items.map(mapFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, ...deps]
  );
}

/**
 * Memoized find that only recomputes when items or deps change
 *
 * @param items - Array to search
 * @param predicate - Test function
 * @param deps - Additional dependencies
 * @returns Found item or undefined
 *
 * @example
 * ```tsx
 * const selectedItem = useMemoizedFind(
 *   items,
 *   (item) => item.id === selectedId,
 *   [selectedId]
 * );
 * ```
 */
export function useMemoizedFind<T>(
  items: T[],
  predicate: (item: T, index: number, array: T[]) => boolean,
  deps: DependencyList
): T | undefined {
  return useMemo(
    () => items.find(predicate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, ...deps]
  );
}

/**
 * Memoized groupBy that creates a Map of items grouped by key
 *
 * @param items - Array to group
 * @param keyFn - Function to extract group key from each item
 * @param deps - Additional dependencies
 * @returns Map of grouped items
 *
 * @example
 * ```tsx
 * const byStatus = useMemoizedGroupBy(
 *   vpnClients,
 *   (client) => client.status,
 *   []
 * );
 * // byStatus.get('online') => [client1, client2, ...]
 * ```
 */
export function useMemoizedGroupBy<T, K>(
  items: T[],
  keyFn: (item: T) => K,
  deps: DependencyList
): Map<K, T[]> {
  return useMemo(() => {
    const groups = new Map<K, T[]>();

    for (const item of items) {
      const key = keyFn(item);
      const group = groups.get(key);

      if (group) {
        group.push(item);
      } else {
        groups.set(key, [item]);
      }
    }

    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ...deps]);
}

/**
 * Memoized reduce that only recomputes when items or deps change
 *
 * @param items - Array to reduce
 * @param reducer - Reducer function
 * @param initialValue - Initial accumulator value
 * @param deps - Additional dependencies
 * @returns Reduced value
 *
 * @example
 * ```tsx
 * const totalBandwidth = useMemoizedReduce(
 *   interfaces,
 *   (sum, iface) => sum + iface.rxBytes + iface.txBytes,
 *   0,
 *   []
 * );
 * ```
 */
export function useMemoizedReduce<T, U>(
  items: T[],
  reducer: (accumulator: U, currentValue: T, index: number, array: T[]) => U,
  initialValue: U,
  deps: DependencyList
): U {
  return useMemo(
    () => items.reduce(reducer, initialValue),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, ...deps]
  );
}

/**
 * Memoized unique values extraction
 *
 * @param items - Array to extract unique values from
 * @param keyFn - Optional function to extract comparison key
 * @param deps - Additional dependencies
 * @returns Array of unique items
 *
 * @example
 * ```tsx
 * // Simple primitive array
 * const uniqueStatuses = useMemoizedUnique(statuses, null, []);
 *
 * // Object array with key extractor
 * const uniqueRouters = useMemoizedUnique(
 *   routers,
 *   (r) => r.id,
 *   []
 * );
 * ```
 */
export function useMemoizedUnique<T>(
  items: T[],
  keyFn: ((item: T) => unknown) | null,
  deps: DependencyList
): T[] {
  return useMemo(() => {
    if (keyFn) {
      const seen = new Set<unknown>();
      return items.filter((item) => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return [...new Set(items)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ...deps]);
}
