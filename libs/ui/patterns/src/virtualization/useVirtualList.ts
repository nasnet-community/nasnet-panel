/**
 * @fileoverview Reusable virtualization hook wrapping @tanstack/react-virtual
 *
 * This hook provides a simplified API for virtualizing lists with:
 * - Automatic virtualization for lists with >20 items
 * - Variable height support via measureElement
 * - Configurable overscan (buffer items)
 * - Platform-aware row heights (44px minimum on mobile)
 *
 * @see https://tanstack.com/virtual/latest
 */

import { useCallback, useMemo, type RefObject } from 'react';

import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';

/**
 * Virtualization threshold - lists with more items than this will be virtualized
 */
export const VIRTUALIZATION_THRESHOLD = 20;

/**
 * Default overscan (number of items to render outside visible area)
 */
export const DEFAULT_OVERSCAN = 5;

/**
 * Default row heights by platform
 */
export const ROW_HEIGHTS = {
  mobile: 56, // 44px minimum touch target + padding
  tablet: 48,
  desktop: 40,
} as const;

export interface UseVirtualListOptions<T> {
  /** Array of items to virtualize */
  items: T[];
  /** Estimated size of each item (or function returning size for variable heights) */
  estimateSize: number | ((index: number) => number);
  /** Number of extra items to render outside visible area (default: 5) */
  overscan?: number;
  /** Function returning the scroll container element */
  getScrollElement: () => HTMLElement | null;
  /** Whether to enable horizontal virtualization */
  horizontal?: boolean;
  /** Initial scroll offset */
  initialOffset?: number;
  /** Whether to enable smooth scrolling */
  smoothScroll?: boolean;
  /** Callback when scroll position changes */
  onScroll?: (offset: number) => void;
  /** Key extractor function for stable item keys */
  getItemKey?: (index: number, item: T) => string | number;
  /** Whether virtualization is enabled (auto-enabled for items > threshold) */
  enabled?: boolean;
}

export interface UseVirtualListReturn<T> {
  /** Array of virtualized items with position info */
  virtualItems: VirtualItem[];
  /** Total size of all items (for container sizing) */
  totalSize: number;
  /** Function to measure an element for variable heights */
  measureElement: (node: Element | null) => void;
  /** Scroll to a specific index */
  scrollToIndex: (
    index: number,
    options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }
  ) => void;
  /** Scroll to a specific offset */
  scrollToOffset: (
    offset: number,
    options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }
  ) => void;
  /** Whether virtualization is active (items > threshold) */
  isVirtualized: boolean;
  /** Current scroll offset */
  scrollOffset: number;
  /** Get the item at a specific index */
  getItem: (index: number) => T | undefined;
  /** Range of currently rendered items */
  range: { startIndex: number; endIndex: number } | null;
}

/**
 * Hook for virtualizing large lists with TanStack Virtual
 *
 * @example
 * ```tsx
 * const parentRef = useRef<HTMLDivElement>(null);
 *
 * const { virtualItems, totalSize, measureElement } = useVirtualList({
 *   items: data,
 *   estimateSize: 48,
 *   getScrollElement: () => parentRef.current,
 * });
 *
 * return (
 *   <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
 *     <div style={{ height: totalSize, position: 'relative' }}>
 *       {virtualItems.map((virtualItem) => (
 *         <div
 *           key={virtualItem.key}
 *           ref={measureElement}
 *           style={{
 *             position: 'absolute',
 *             top: 0,
 *             left: 0,
 *             width: '100%',
 *             transform: `translateY(${virtualItem.start}px)`,
 *           }}
 *         >
 *           {data[virtualItem.index].name}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualList<T>(options: UseVirtualListOptions<T>): UseVirtualListReturn<T> {
  const {
    items,
    estimateSize,
    overscan = DEFAULT_OVERSCAN,
    getScrollElement,
    horizontal = false,
    initialOffset,
    smoothScroll = false,
    onScroll,
    getItemKey,
    enabled,
  } = options;

  // Determine if virtualization should be active
  const isVirtualized = enabled ?? items.length > VIRTUALIZATION_THRESHOLD;

  // Normalize estimateSize to always be a function
  const estimateSizeFn = useMemo(() => {
    if (typeof estimateSize === 'number') {
      return () => estimateSize;
    }
    return estimateSize;
  }, [estimateSize]);

  // Key extractor with fallback to index
  const getItemKeyFn = useCallback(
    (index: number) => {
      if (getItemKey && items[index]) {
        return getItemKey(index, items[index]);
      }
      return index;
    },
    [getItemKey, items]
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement,
    estimateSize: estimateSizeFn,
    overscan: isVirtualized ? overscan : items.length, // Render all if not virtualized
    horizontal,
    initialOffset,
    getItemKey: getItemKeyFn,
    onChange: (instance) => {
      if (onScroll) {
        onScroll(instance.scrollOffset ?? 0);
      }
    },
    enabled: isVirtualized,
  });

  // Memoize return values to prevent unnecessary re-renders
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const scrollOffset = virtualizer.scrollOffset ?? 0;

  const range = useMemo(() => {
    if (virtualItems.length === 0) return null;
    return {
      startIndex: virtualItems[0].index,
      endIndex: virtualItems[virtualItems.length - 1].index,
    };
  }, [virtualItems]);

  const getItem = useCallback(
    (index: number): T | undefined => {
      return items[index];
    },
    [items]
  );

  const scrollToIndex = useCallback(
    (
      index: number,
      options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }
    ) => {
      virtualizer.scrollToIndex(index, options);
    },
    [virtualizer]
  );

  const scrollToOffset = useCallback(
    (
      offset: number,
      options?: { align?: 'start' | 'center' | 'end' | 'auto'; behavior?: 'auto' | 'smooth' }
    ) => {
      virtualizer.scrollToOffset(offset, options);
    },
    [virtualizer]
  );

  return {
    virtualItems,
    totalSize,
    measureElement: virtualizer.measureElement,
    scrollToIndex,
    scrollToOffset,
    isVirtualized,
    scrollOffset,
    getItem,
    range,
  };
}

/**
 * Utility hook for scroll position restoration
 *
 * @example
 * ```tsx
 * const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration('list-key');
 *
 * // Save on unmount or navigation
 * useEffect(() => {
 *   return () => saveScrollPosition(scrollOffset);
 * }, [scrollOffset]);
 *
 * // Restore on mount
 * useEffect(() => {
 *   const offset = restoreScrollPosition();
 *   if (offset) scrollToOffset(offset);
 * }, []);
 * ```
 */
export function useScrollRestoration(key: string) {
  const storageKey = `scroll-position-${key}`;

  const saveScrollPosition = useCallback(
    (offset: number) => {
      try {
        sessionStorage.setItem(storageKey, String(offset));
      } catch {
        // Ignore storage errors
      }
    },
    [storageKey]
  );

  const restoreScrollPosition = useCallback((): number | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        sessionStorage.removeItem(storageKey);
        return parseInt(saved, 10);
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }, [storageKey]);

  return { saveScrollPosition, restoreScrollPosition };
}
