/**
 * SortableListDesktop Component
 *
 * Desktop-optimized sortable list with context menu and keyboard shortcuts.
 * Features right-click context menu with move options.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import * as React from 'react';
import type { SortableListProps, SortableItemData, SortableItemRenderOptions } from '../types';
export interface ContextMenuActions<T extends SortableItemData> {
    onMoveToTop?: (item: T) => void;
    onMoveUp?: (item: T) => void;
    onMoveDown?: (item: T) => void;
    onMoveToBottom?: (item: T) => void;
    onDuplicate?: (item: T) => void;
    onDelete?: (item: T) => void;
    /** Custom actions to add to context menu */
    customActions?: Array<{
        label: string;
        icon?: React.ReactNode;
        onClick: (item: T) => void;
        disabled?: (item: T) => boolean;
    }>;
}
export interface SortableListDesktopProps<T extends SortableItemData> extends Omit<SortableListProps<T>, 'renderItem'> {
    /** Render function for item content */
    renderItem: (item: T, options: SortableItemRenderOptions) => React.ReactNode;
    /** Context menu action callbacks */
    actions?: ContextMenuActions<T>;
    /** Whether to show context menu on right-click (default: true) */
    showContextMenu?: boolean;
    /** Whether to show row numbers (default: true for desktop) */
    showRowNumbers?: boolean;
}
export declare function SortableListDesktop<T extends SortableItemData>({ renderItem: externalRenderItem, actions, showContextMenu, showRowNumbers, className, ...props }: SortableListDesktopProps<T>): import("react/jsx-runtime").JSX.Element;
export declare namespace SortableListDesktop {
    var displayName: string;
}
export default SortableListDesktop;
//# sourceMappingURL=SortableListDesktop.d.ts.map