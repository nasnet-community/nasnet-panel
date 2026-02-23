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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

import { cn } from '@nasnet/ui/primitives';

import { DragHandle } from './DragHandle';
import { DropZoneIndicator } from './DropZoneIndicator';
import { useSortableContext } from '../context';

import type { SortableItemProps } from '../types';

// ============================================================================
// Component
// ============================================================================

/**
 * SortableItem - Draggable item within a sortable list
 *
 * @param props - Component props
 * @returns Sortable item element
 */
const SortableItemInner: React.FC<SortableItemProps> = ({
  id,
  disabled = false,
  children,
  className,
  showPosition = false,
  position,
}) => {
  const context = useSortableContext();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    isSorting,
  } = useSortable({
    id,
    disabled,
    data: {
      label: `Item ${position ?? id}`,
      index: position ? position - 1 : undefined,
      total: context?.items?.length,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Prevent layout shift when dragging
    ...(isDragging && {
      zIndex: 50,
      position: 'relative',
    }),
  };

  const isSelected = context?.selectedIds?.has(id) ?? false;
  const isActive = context?.activeId === id;
  const isOverItem = context?.overId === id && !isActive;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        'rounded-lg',
        'transition-shadow duration-200',
        // Dragging styles
        isDragging && [
          'opacity-50',
          'shadow-lg',
          'ring-2 ring-primary ring-offset-2',
        ],
        // Over styles (when another item is being dragged over this one)
        isOverItem && 'ring-2 ring-primary/50',
        // Selected styles
        isSelected && !isDragging && 'ring-2 ring-primary/30 bg-primary/5',
        // Disabled styles
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      layout={isSorting}
      layoutId={String(id)}
      {...attributes}
    >
      {/* Drop zone indicator (top) */}
      <DropZoneIndicator visible={isOverItem && !isDragging} position="before" />

      {/* Item content wrapper */}
      <div
        className={cn(
          'flex items-center gap-2',
          context?.showDragHandle && 'pl-0',
        )}
      >
        {/* Drag handle */}
        {context?.showDragHandle && (
          <DragHandle
            disabled={disabled}
            aria-label={`Drag ${position ? `item ${position}` : id} to reorder`}
            {...listeners}
          />
        )}

        {/* Position number */}
        {showPosition && position !== undefined && (
          <span
            className={cn(
              'flex-shrink-0',
              'w-8 h-8',
              'flex items-center justify-center',
              'text-sm font-medium',
              'text-muted-foreground',
              'bg-muted/50',
              'rounded-md',
            )}
            aria-hidden="true"
          >
            #{position}
          </span>
        )}

        {/* Item content */}
        <div
          className={cn(
            'flex-1 min-w-0',
            // If no drag handle, make entire item draggable
            !context?.showDragHandle && 'cursor-grab active:cursor-grabbing',
          )}
          {...(!context?.showDragHandle ? listeners : {})}
        >
          {children}
        </div>
      </div>

      {/* Drop zone indicator (bottom) */}
      <DropZoneIndicator visible={isOverItem && !isDragging} position="after" />
    </motion.div>
  );
};

SortableItemInner.displayName = 'SortableItem';

/**
 * Memoized SortableItem to prevent unnecessary re-renders
 */
export const SortableItem = React.memo(SortableItemInner);

// ============================================================================
// Sortable Item with Actions
// ============================================================================

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
 * SortableItem with built-in move action buttons
 *
 * @param props - Component props
 * @returns Sortable item with action buttons
 */
const SortableItemWithActionsInner: React.FC<SortableItemWithActionsProps> = ({
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  showMoveButtons = false,
  ...props
}) => {
  return (
    <SortableItem {...props}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">{props.children}</div>

        {showMoveButtons && (
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst || props.disabled}
              className={cn(
                'p-1 rounded hover:bg-muted',
                'transition-colors',
                'text-muted-foreground hover:text-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              aria-label="Move up"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast || props.disabled}
              className={cn(
                'p-1 rounded hover:bg-muted',
                'transition-colors',
                'text-muted-foreground hover:text-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              aria-label="Move down"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </SortableItem>
  );
};

SortableItemWithActionsInner.displayName = 'SortableItemWithActions';

/**
 * Memoized SortableItemWithActions to prevent unnecessary re-renders
 */
export const SortableItemWithActions = React.memo(SortableItemWithActionsInner);

SortableItemWithActions.displayName = 'SortableItemWithActions';

export default SortableItem;
