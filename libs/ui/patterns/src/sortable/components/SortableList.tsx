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

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext as DndSortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

import { cn } from '@nasnet/ui/primitives';

import { SortableContext } from '../context';
import { SortableItem } from './SortableItem';
import {
  useSortableSensors,
  getCollisionDetection,
  SORTABLE_LIST_ROLE,
  dragOverlayAnimation,
} from '../config';
import { useSortableList } from '../hooks/useSortableList';
import { defaultAnnouncements, toDndKitAnnouncements } from '../utils/announcements';

import type {
  SortableListProps,
  SortableItemData,
  SortableContextValue,
  SortableItemRenderOptions,
} from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * SortableList - High-performance drag-and-drop sortable list
 *
 * @template T - Item data type, must extend SortableItemData
 * @param props - Component props
 * @returns Sortable list component
 */
function SortableListComponent<T extends SortableItemData>({
  items: externalItems,
  onReorder,
  onMultiReorder,
  validateDrop,
  renderItem,
  direction = 'vertical',
  collisionStrategy = 'closestCenter',
  multiSelect = false,
  showDragHandle = true,
  showPositionNumbers = false,
  className,
  itemClassName,
  gap = 2,
  'aria-label': ariaLabel = 'Sortable list',
  emptyState,
}: SortableListProps<T>) {
  // ============================================================================
  // Hook
  // ============================================================================

  const sortable = useSortableList(externalItems, {
    onReorder,
    onMultiReorder,
    validateDrop,
    direction,
    collisionStrategy,
    multiSelect,
    undoEnabled: true,
  });

  const { items, activeId, overId, isDragging, activeItem, selectedIds, isSelected, _handlers } =
    sortable as ReturnType<typeof useSortableList<T>> & {
      _handlers: {
        onDragStart: (event: DragStartEvent) => void;
        onDragOver: (event: DragOverEvent) => void;
        onDragEnd: (event: DragEndEvent) => void;
        onDragCancel: () => void;
      };
    };

  // ============================================================================
  // Sensors
  // ============================================================================

  const sensors = useSortableSensors({
    touchEnabled: true,
    keyboardEnabled: true,
  });

  // ============================================================================
  // Modifiers
  // ============================================================================

  const modifiers = React.useMemo(() => {
    return direction === 'horizontal' ? [restrictToHorizontalAxis] : [restrictToVerticalAxis];
  }, [direction]);

  // ============================================================================
  // Sorting Strategy
  // ============================================================================

  const sortingStrategy = React.useMemo(() => {
    return direction === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy;
  }, [direction]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = React.useMemo<SortableContextValue<T>>(
    () => ({
      items,
      activeId,
      overId,
      isDragging,
      direction,
      selectedIds,
      multiSelect,
      showDragHandle,
      showPositionNumbers,
    }),
    [
      items,
      activeId,
      overId,
      isDragging,
      direction,
      selectedIds,
      multiSelect,
      showDragHandle,
      showPositionNumbers,
    ]
  );

  // ============================================================================
  // Render Options Factory
  // ============================================================================

  const createRenderOptions = React.useCallback(
    (item: T, index: number): SortableItemRenderOptions => ({
      index,
      total: items.length,
      isDragging: activeId === item.id,
      isSelected: isSelected(item.id),
      isOver: overId === item.id,
      isFirst: index === 0,
      isLast: index === items.length - 1,
      dragHandleProps: {}, // Will be provided by SortableItem
    }),
    [items.length, activeId, overId, isSelected]
  );

  // ============================================================================
  // Announcements
  // ============================================================================

  const announcements = React.useMemo(() => toDndKitAnnouncements(defaultAnnouncements), []);

  // ============================================================================
  // Empty State
  // ============================================================================

  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'min-h-[100px]',
          'border-primary/30 border-2 border-dashed',
          'bg-primary/5',
          'rounded-[var(--semantic-radius-card)]',
          'p-6',
          className
        )}
        role={SORTABLE_LIST_ROLE}
        aria-label={ariaLabel}
      >
        {emptyState ?? <span className="text-muted-foreground text-sm">No items to display</span>}
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <SortableContext.Provider value={contextValue as SortableContextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={getCollisionDetection(collisionStrategy)}
        onDragStart={_handlers.onDragStart}
        onDragOver={_handlers.onDragOver}
        onDragEnd={_handlers.onDragEnd}
        onDragCancel={_handlers.onDragCancel}
        modifiers={modifiers}
        accessibility={{
          announcements,
        }}
      >
        <DndSortableContext
          items={items.map((item) => item.id)}
          strategy={sortingStrategy}
        >
          <LayoutGroup>
            <motion.div
              className={cn(
                'flex',
                direction === 'vertical' ? 'flex-col' : 'flex-row',
                typeof gap === 'number' ? `gap-${gap}` : gap,
                className
              )}
              role={SORTABLE_LIST_ROLE}
              aria-label={ariaLabel}
              style={{
                gap: typeof gap === 'number' ? `${gap * 4}px` : undefined,
              }}
            >
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    disabled={item.disabled}
                    className={itemClassName}
                    showPosition={showPositionNumbers}
                    position={index + 1}
                  >
                    {renderItem(item, createRenderOptions(item, index))}
                  </SortableItem>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        </DndSortableContext>

        {/* Drag Overlay - Shows dragged item preview */}
        <DragOverlay>
          {activeId && activeItem && (
            <motion.div
              initial={dragOverlayAnimation.initial}
              animate={dragOverlayAnimation.dragging}
              className={cn('pointer-events-none', itemClassName)}
            >
              <SortableItem
                id={activeItem.id}
                disabled={false}
                showPosition={showPositionNumbers}
                position={items.findIndex((i) => i.id === activeId) + 1}
              >
                {renderItem(
                  activeItem,
                  createRenderOptions(
                    activeItem,
                    items.findIndex((i) => i.id === activeId)
                  )
                )}
              </SortableItem>
            </motion.div>
          )}
        </DragOverlay>
      </DndContext>
    </SortableContext.Provider>
  );
}

SortableListComponent.displayName = 'SortableList';

/**
 * Memoized SortableList component to prevent unnecessary re-renders
 */
export const SortableList = React.memo(SortableListComponent) as typeof SortableListComponent;

SortableList.displayName = 'SortableList';

export default SortableList;
