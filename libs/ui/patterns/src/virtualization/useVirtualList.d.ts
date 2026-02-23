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
import { type VirtualItem } from '@tanstack/react-virtual';
/**
 * Virtualization threshold - lists with more items than this will be virtualized
 */
export declare const VIRTUALIZATION_THRESHOLD = 20;
/**
 * Default overscan (number of items to render outside visible area)
 */
export declare const DEFAULT_OVERSCAN = 5;
/**
 * Default row heights by platform
 */
export declare const ROW_HEIGHTS: {
    readonly mobile: 56;
    readonly tablet: 48;
    readonly desktop: 40;
};
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
    scrollToIndex: (index: number, options?: {
        align?: 'start' | 'center' | 'end' | 'auto';
        behavior?: 'auto' | 'smooth';
    }) => void;
    /** Scroll to a specific offset */
    scrollToOffset: (offset: number, options?: {
        align?: 'start' | 'center' | 'end' | 'auto';
        behavior?: 'auto' | 'smooth';
    }) => void;
    /** Whether virtualization is active (items > threshold) */
    isVirtualized: boolean;
    /** Current scroll offset */
    scrollOffset: number;
    /** Get the item at a specific index */
    getItem: (index: number) => T | undefined;
    /** Range of currently rendered items */
    range: {
        startIndex: number;
        endIndex: number;
    } | null;
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
export declare function useVirtualList<T>(options: UseVirtualListOptions<T>): UseVirtualListReturn<T>;
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
export declare function useScrollRestoration(key: string): {
    saveScrollPosition: (offset: number) => void;
    restoreScrollPosition: () => number | null;
};
//# sourceMappingURL=useVirtualList.d.ts.map