/**
 * SortableItem Component
 *
 * Individual sortable item wrapper with drag state styling.
 * Uses useSortable hook from dnd-kit.
 *
 * Features:
 * - Drag handle support
 * - Position numbering
 * - Drop zone indicators
 * - Selection state
 * - Disabled state support
 * - WCAG AAA accessible
 *
 * @see NAS-4.21: Implement Drag & Drop System
 *
 * @example
 * ```tsx
 * <SortableItem id="item-1" position={1}>
 *   <div>Item content here</div>
 * </SortableItem>
 * ```
 */
import * as React from 'react';
import type { SortableItemProps } from '../types';
/**
 * Memoized SortableItem to prevent unnecessary re-renders
 */
export declare const SortableItem: React.NamedExoticComponent<SortableItemProps>;
/**
 * Props for SortableItem with action buttons
 */
export interface SortableItemWithActionsProps extends SortableItemProps {
    /** Move up callback */
    onMoveUp?: () => void;
    /** Move down callback */
    onMoveDown?: () => void;
    /** Whether this is the first item */
    isFirst?: boolean;
    /** Whether this is the last item */
    isLast?: boolean;
    /** Show move buttons (fallback for touch) */
    showMoveButtons?: boolean;
}
/**
 * Memoized SortableItemWithActions to prevent unnecessary re-renders
 */
export declare const SortableItemWithActions: React.NamedExoticComponent<SortableItemWithActionsProps>;
export default SortableItem;
//# sourceMappingURL=SortableItem.d.ts.map