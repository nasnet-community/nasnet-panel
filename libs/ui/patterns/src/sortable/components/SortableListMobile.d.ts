/**
 * SortableListMobile Component
 *
 * Mobile-optimized sortable list with touch-friendly interactions.
 * Features larger touch targets and move up/down button fallbacks.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import type { SortableListProps, SortableItemData, SortableItemRenderOptions } from '../types';
export interface SortableListMobileProps<T extends SortableItemData> extends Omit<SortableListProps<T>, 'renderItem'> {
    /** Render function for item content (not the full item) */
    renderItem: (item: T, options: SortableItemRenderOptions) => React.ReactNode;
    /** Whether to show move up/down buttons (default: true for mobile) */
    showMoveButtons?: boolean;
    /** Callback when item is moved via button */
    onMoveItem?: (id: T['id'], direction: 'up' | 'down') => void;
}
export declare function SortableListMobile<T extends SortableItemData>({ renderItem: externalRenderItem, showMoveButtons, onMoveItem, className, ...props }: SortableListMobileProps<T>): import("react/jsx-runtime").JSX.Element;
export declare namespace SortableListMobile {
    var displayName: string;
}
export default SortableListMobile;
//# sourceMappingURL=SortableListMobile.d.ts.map