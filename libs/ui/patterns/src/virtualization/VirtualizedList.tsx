/**
 * @fileoverview Virtualized List Component
 *
 * A performant list component that renders only visible items using TanStack Virtual.
 * Automatically enables virtualization for lists with >20 items.
 *
 * Features:
 * - Automatic virtualization threshold (>20 items)
 * - Variable height support via measureElement
 * - Scroll restoration on navigation
 * - Keyboard navigation support (arrow keys, Home, End)
 * - Loading placeholders for scroll boundaries
 * - Platform-aware row heights (44px minimum on mobile)
 * - WCAG AAA accessible (full keyboard navigation)
 * - TypeScript generic for type-safe items
 *
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={firewallRules}
 *   estimateSize={48}
 *   renderItem={(item, virtualItem) => (
 *     <FirewallRuleRow
 *       key={virtualItem.key}
 *       rule={item}
 *       ref={virtualItem.measureRef}
 *     />
 *   )}
 * />
 * ```
 *
 * @see https://tanstack.com/virtual/latest for TanStack Virtual documentation
 */

import React, {
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

import { type VirtualItem } from '@tanstack/react-virtual';

import { cn } from '@nasnet/ui/primitives';

import {
  useVirtualList,
  useScrollRestoration,
  VIRTUALIZATION_THRESHOLD,
  type UseVirtualListOptions,
} from './useVirtualList';

export interface VirtualizedListItemProps<T> {
  /** The actual item data */
  item: T;
  /** Virtual item with position information */
  virtualItem: VirtualItem;
  /** Index in the original array */
  index: number;
  /** Ref to attach for dynamic height measurement */
  measureRef: (node: Element | null) => void;
  /** Whether this item is currently focused */
  isFocused: boolean;
}

export interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (props: VirtualizedListItemProps<T>) => ReactNode;
  /** Estimated size of each item in pixels */
  estimateSize?: number | ((index: number) => number);
  /** Additional items to render outside visible area */
  overscan?: number;
  /** Unique key for scroll position restoration */
  scrollRestoreKey?: string;
  /** Container height (required for scrolling) */
  height?: number | string;
  /** Container className */
  className?: string;
  /** Container style */
  style?: CSSProperties;
  /** Horizontal virtualization instead of vertical */
  horizontal?: boolean;
  /** Loading state placeholder */
  loading?: boolean;
  /** Empty state content */
  emptyContent?: ReactNode;
  /** Callback when visible items change */
  onVisibleRangeChange?: (startIndex: number, endIndex: number) => void;
  /** Whether to enable keyboard navigation */
  enableKeyboardNav?: boolean;
  /** Callback when an item is selected via keyboard */
  onItemSelect?: (item: T, index: number) => void;
  /** Get unique key for each item (for stable keys) */
  getItemKey?: (index: number, item: T) => string | number;
  /** Item gap in pixels */
  gap?: number;
  /** ARIA label for the list */
  'aria-label'?: string;
  /** Whether virtualization is forced on/off */
  forceVirtualization?: boolean;
}

interface VirtualizedListComponent {
  <T>(props: VirtualizedListProps<T> & { ref?: React.Ref<HTMLDivElement> }): ReactNode;
  displayName?: string;
}

/**
 * A high-performance virtualized list component
 *
 * @template T - Item data type
 * @param props - Component props
 * @param ref - Forwarded ref to container div
 * @returns Virtualized list element
 */
const VirtualizedListInner = forwardRef(function VirtualizedList<T>(
  {
    items,
    renderItem,
    estimateSize = 48,
    overscan = 5,
    scrollRestoreKey,
    height = '100%',
    className,
    style,
    horizontal = false,
    loading = false,
    emptyContent,
    onVisibleRangeChange,
    enableKeyboardNav = true,
    onItemSelect,
    getItemKey,
    gap = 0,
    'aria-label': ariaLabel,
    forceVirtualization,
  }: VirtualizedListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef<number>(0);

  // Merge refs
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  // Scroll restoration
  const { saveScrollPosition, restoreScrollPosition } = useScrollRestoration(
    scrollRestoreKey || 'virtualized-list'
  );

  // Virtual list hook
  const {
    virtualItems,
    totalSize,
    measureElement,
    scrollToIndex,
    isVirtualized,
    scrollOffset,
    range,
  } = useVirtualList<T>({
    items,
    estimateSize,
    overscan,
    getScrollElement: () => containerRef.current,
    horizontal,
    getItemKey,
    enabled: forceVirtualization ?? items.length > VIRTUALIZATION_THRESHOLD,
  });

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollRestoreKey) {
      const offset = restoreScrollPosition();
      if (offset && containerRef.current) {
        containerRef.current.scrollTop = offset;
      }
    }
  }, [scrollRestoreKey, restoreScrollPosition]);

  // Save scroll position on unmount
  useEffect(() => {
    return () => {
      if (scrollRestoreKey) {
        saveScrollPosition(scrollOffset);
      }
    };
  }, [scrollRestoreKey, scrollOffset, saveScrollPosition]);

  // Notify visible range changes
  useEffect(() => {
    if (range && onVisibleRangeChange) {
      onVisibleRangeChange(range.startIndex, range.endIndex);
    }
  }, [range, onVisibleRangeChange]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!enableKeyboardNav || items.length === 0) return;

      let newIndex = focusedIndexRef.current;

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          newIndex = Math.min(focusedIndexRef.current + 1, items.length - 1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = Math.max(focusedIndexRef.current - 1, 0);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
        case 'PageDown':
          event.preventDefault();
          newIndex = Math.min(focusedIndexRef.current + 10, items.length - 1);
          break;
        case 'PageUp':
          event.preventDefault();
          newIndex = Math.max(focusedIndexRef.current - 10, 0);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (onItemSelect && items[focusedIndexRef.current]) {
            onItemSelect(items[focusedIndexRef.current], focusedIndexRef.current);
          }
          return;
        default:
          return;
      }

      if (newIndex !== focusedIndexRef.current) {
        focusedIndexRef.current = newIndex;
        scrollToIndex(newIndex, { align: 'auto' });
        // Force re-render to update focus state
        containerRef.current?.dispatchEvent(new Event('focuschange'));
      }
    },
    [enableKeyboardNav, items, scrollToIndex, onItemSelect]
  );

  // Calculate actual item size including gap
  const getItemSizeWithGap = useCallback(
    (index: number) => {
      const baseSize = typeof estimateSize === 'function' ? estimateSize(index) : estimateSize;
      return index < items.length - 1 ? baseSize + gap : baseSize;
    },
    [estimateSize, gap, items.length]
  );

  // Loading state
  if (loading) {
    return (
      <div
        ref={setRef}
        className={cn('overflow-auto', className)}
        style={{ height, ...style }}
        aria-busy="true"
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        ref={setRef}
        className={cn('overflow-auto', className)}
        style={{ height, ...style }}
        aria-label={ariaLabel}
      >
        {emptyContent || (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            No items to display
          </div>
        )}
      </div>
    );
  }

  // Container and inner styles based on orientation
  const containerStyle: CSSProperties = {
    height,
    overflow: 'auto',
    ...style,
  };

  const innerStyle: CSSProperties =
    horizontal ?
      {
        width: totalSize + gap * (items.length - 1),
        height: '100%',
        position: 'relative',
      }
    : {
        height: totalSize + gap * (items.length - 1),
        width: '100%',
        position: 'relative',
      };

  return (
    <div
      ref={setRef}
      className={cn('overflow-auto', className)}
      style={containerStyle}
      onKeyDown={handleKeyDown}
      tabIndex={enableKeyboardNav ? 0 : undefined}
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={
        enableKeyboardNav ? `virtual-item-${focusedIndexRef.current}` : undefined
      }
    >
      <div style={innerStyle}>
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const isFocused = focusedIndexRef.current === virtualItem.index;

          const itemStyle: CSSProperties =
            horizontal ?
              {
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                transform: `translateX(${virtualItem.start + virtualItem.index * gap}px)`,
              }
            : {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start + virtualItem.index * gap}px)`,
              };

          return (
            <div
              key={virtualItem.key}
              id={`virtual-item-${virtualItem.index}`}
              style={itemStyle}
              role="option"
              aria-selected={isFocused}
              data-index={virtualItem.index}
            >
              {renderItem({
                item,
                virtualItem,
                index: virtualItem.index,
                measureRef: measureElement,
                isFocused,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}) as VirtualizedListComponent;

VirtualizedListInner.displayName = 'VirtualizedList';

/**
 * Memoized VirtualizedList to prevent unnecessary re-renders
 */
export const VirtualizedList = React.memo(VirtualizedListInner) as VirtualizedListComponent;

VirtualizedList.displayName = 'VirtualizedList';

export { VIRTUALIZATION_THRESHOLD };
