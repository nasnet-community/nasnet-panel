/**
 * @nasnet/ui/patterns/sortable
 *
 * Drag & Drop Sortable List System for NasNetConnect.
 *
 * This module provides a comprehensive sortable list implementation with:
 * - Mouse, touch, and keyboard support
 * - Multi-select drag functionality
 * - Platform-specific presenters (Mobile/Desktop)
 * - WCAG AAA accessibility compliance
 * - Animation integration with Framer Motion
 * - Undo/redo support
 * - Context menu integration
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
export type { SortableItemData, SortableDirection, CollisionStrategy, DropValidationResult, ValidateDropFn, ReorderEvent, MultiReorderEvent, UseSortableListOptions, UseSortableListReturn, SortableListProps, SortableItemRenderOptions, SortableItemProps, DragHandleProps, DropZoneIndicatorProps, SortableContextValue, SortableAnnouncements, } from './types';
export { SortableList, SortableItem, SortableItemWithActions, DragHandle, DropZoneIndicator, InsertionLine, SortableListMobile, SortableListDesktop, SortableListDesktop as SortableListWithActions, } from './components';
export type { SortableItemWithActionsProps, InsertionLineProps, SortableListMobileProps, SortableListDesktopProps, ContextMenuActions, } from './components';
export { useSortableList, useMultiSelect, } from './hooks';
export type { UseMultiSelectOptions, UseMultiSelectReturn, } from './hooks';
export { defaultAnnouncements, createAnnouncements, toDndKitAnnouncements, multiSelectAnnouncements, keyboardAnnouncements, } from './utils';
export type { AnnouncementData, CreateAnnouncementsOptions, } from './utils';
export { SortableContext, useSortableContext, useSortableContextOptional, } from './context';
export { useSortableSensors, defaultMouseSensorOptions, defaultTouchSensorOptions, defaultKeyboardSensorOptions, collisionStrategies, getCollisionDetection, getSortingStrategy, ANIMATION_DURATION, dragOverlayAnimation, layoutTransition, MIN_TOUCH_TARGET, autoScrollConfig, keyboardBindings, SORTABLE_LIST_ROLE, SORTABLE_ITEM_ROLE, errorMessages, } from './config';
export { FirewallRuleList, } from './domain';
export type { FirewallRule, FirewallRuleListProps, } from './domain';
//# sourceMappingURL=index.d.ts.map