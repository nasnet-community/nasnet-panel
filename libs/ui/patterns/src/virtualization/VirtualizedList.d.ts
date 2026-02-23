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
import React, { type ReactNode, type CSSProperties } from 'react';
import { type VirtualItem } from '@tanstack/react-virtual';
import { VIRTUALIZATION_THRESHOLD } from './useVirtualList';
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
    <T>(props: VirtualizedListProps<T> & {
        ref?: React.Ref<HTMLDivElement>;
    }): ReactNode;
    displayName?: string;
}
/**
 * Memoized VirtualizedList to prevent unnecessary re-renders
 */
export declare const VirtualizedList: VirtualizedListComponent;
export { VIRTUALIZATION_THRESHOLD };
//# sourceMappingURL=VirtualizedList.d.ts.map