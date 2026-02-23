/**
 * SortableList Component
 *
 * Main sortable list component with DndContext wrapper.
 * Supports keyboard, mouse, and touch interactions.
 *
 * Features:
 * - Mouse, touch, and keyboard support
 * - Multi-select drag functionality
 * - Drag/drop validation
 * - Undo/redo support
 * - WCAG AAA accessibility compliance
 *
 * @see NAS-4.21: Implement Drag & Drop System
 *
 * @example
 * ```tsx
 * import { SortableList } from '@nasnet/ui/patterns/sortable';
 *
 * function MyList() {
 *   const [items, setItems] = useState([
 *     { id: '1', label: 'Item 1' },
 *     { id: '2', label: 'Item 2' },
 *   ]);
 *
 *   return (
 *     <SortableList
 *       items={items}
 *       onReorder={({ items }) => setItems(items)}
 *       renderItem={(item) => <div>{item.label}</div>}
 *     />
 *   );
 * }
 * ```
 */
import type { SortableListProps, SortableItemData } from '../types';
/**
 * SortableList - High-performance drag-and-drop sortable list
 *
 * @template T - Item data type, must extend SortableItemData
 * @param props - Component props
 * @returns Sortable list component
 */
declare function SortableListComponent<T extends SortableItemData>({ items: externalItems, onReorder, onMultiReorder, validateDrop, renderItem, direction, collisionStrategy, multiSelect, showDragHandle, showPositionNumbers, className, itemClassName, gap, 'aria-label': ariaLabel, emptyState, }: SortableListProps<T>): import("react/jsx-runtime").JSX.Element;
declare namespace SortableListComponent {
    var displayName: string;
}
/**
 * Memoized SortableList component to prevent unnecessary re-renders
 */
export declare const SortableList: typeof SortableListComponent;
export default SortableList;
//# sourceMappingURL=SortableList.d.ts.map