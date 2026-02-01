/**
 * Sortable System Types
 *
 * Type definitions for the drag & drop reordering system.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import type { Active, Over, UniqueIdentifier } from '@dnd-kit/core';
import type { ReactNode } from 'react';

// ============================================================================
// Core Types
// ============================================================================

/**
 * Base interface for sortable items.
 * Items must have a unique identifier.
 */
export interface SortableItemData {
  /** Unique identifier for the item */
  id: UniqueIdentifier;
  /** Optional label for screen reader announcements */
  label?: string;
  /** Whether the item is disabled (cannot be dragged) */
  disabled?: boolean;
}

/**
 * Generic sortable item with additional data
 */
export type SortableItem<T extends SortableItemData = SortableItemData> = T;

/**
 * Direction for sortable list layout
 */
export type SortableDirection = 'vertical' | 'horizontal';

/**
 * Strategy for collision detection
 */
export type CollisionStrategy =
  | 'closestCenter'
  | 'closestCorners'
  | 'rectIntersection'
  | 'pointerWithin';

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of drop validation
 */
export interface DropValidationResult {
  /** Whether the drop is valid */
  valid: boolean;
  /** Error message if invalid */
  message?: string;
  /** Whether to show error animation */
  showError?: boolean;
}

/**
 * Callback for validating a drop operation
 */
export type ValidateDropFn<T extends SortableItemData> = (
  item: T,
  targetIndex: number,
  items: T[]
) => DropValidationResult | boolean;

// ============================================================================
// Event Types
// ============================================================================

/**
 * Reorder event data
 */
export interface ReorderEvent<T extends SortableItemData> {
  /** The item being moved */
  item: T;
  /** Original index */
  fromIndex: number;
  /** New index */
  toIndex: number;
  /** All items after reorder */
  items: T[];
}

/**
 * Multi-select reorder event data
 */
export interface MultiReorderEvent<T extends SortableItemData> {
  /** The items being moved */
  items: T[];
  /** Original indices */
  fromIndices: number[];
  /** New starting index */
  toIndex: number;
  /** All items after reorder */
  allItems: T[];
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Options for useSortableList hook
 */
export interface UseSortableListOptions<T extends SortableItemData> {
  /** Callback when items are reordered */
  onReorder?: (event: ReorderEvent<T>) => void;
  /** Callback when multiple items are reordered */
  onMultiReorder?: (event: MultiReorderEvent<T>) => void;
  /** Validate drop before applying */
  validateDrop?: ValidateDropFn<T>;
  /** Direction of the list */
  direction?: SortableDirection;
  /** Collision detection strategy */
  collisionStrategy?: CollisionStrategy;
  /** Whether multi-select is enabled */
  multiSelect?: boolean;
  /** Whether keyboard navigation is enabled */
  keyboardEnabled?: boolean;
  /** Whether touch drag is enabled */
  touchEnabled?: boolean;
  /** Touch delay in ms before drag starts */
  touchDelay?: number;
  /** Whether to enable undo/redo */
  undoEnabled?: boolean;
}

/**
 * Return type for useSortableList hook
 */
export interface UseSortableListReturn<T extends SortableItemData> {
  /** Current items in order */
  items: T[];
  /** Currently active (dragging) item ID */
  activeId: UniqueIdentifier | null;
  /** Item ID being hovered over */
  overId: UniqueIdentifier | null;
  /** Whether any item is being dragged */
  isDragging: boolean;
  /** Get the active item data */
  activeItem: T | null;
  /** Get the over item data */
  overItem: T | null;
  /** Selected item IDs (for multi-select) */
  selectedIds: Set<UniqueIdentifier>;
  /** Whether an item is selected */
  isSelected: (id: UniqueIdentifier) => boolean;
  /** Select an item */
  select: (id: UniqueIdentifier) => void;
  /** Deselect an item */
  deselect: (id: UniqueIdentifier) => void;
  /** Toggle item selection */
  toggleSelection: (id: UniqueIdentifier) => void;
  /** Select range of items */
  selectRange: (fromId: UniqueIdentifier, toId: UniqueIdentifier) => void;
  /** Select all items */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Move item to specific position */
  moveItem: (id: UniqueIdentifier, toIndex: number) => void;
  /** Move item up one position */
  moveUp: (id: UniqueIdentifier) => void;
  /** Move item down one position */
  moveDown: (id: UniqueIdentifier) => void;
  /** Move item to top */
  moveToTop: (id: UniqueIdentifier) => void;
  /** Move item to bottom */
  moveToBottom: (id: UniqueIdentifier) => void;
  /** Undo last reorder */
  undo: () => void;
  /** Redo last undone reorder */
  redo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Set items directly (for external updates) */
  setItems: (items: T[]) => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for SortableList component
 */
export interface SortableListProps<T extends SortableItemData> {
  /** Items to render */
  items: T[];
  /** Callback when items are reordered */
  onReorder?: (event: ReorderEvent<T>) => void;
  /** Callback when multiple items are reordered */
  onMultiReorder?: (event: MultiReorderEvent<T>) => void;
  /** Validate drop before applying */
  validateDrop?: ValidateDropFn<T>;
  /** Render function for each item */
  renderItem: (item: T, options: SortableItemRenderOptions) => ReactNode;
  /** Direction of the list */
  direction?: SortableDirection;
  /** Collision detection strategy */
  collisionStrategy?: CollisionStrategy;
  /** Whether multi-select is enabled */
  multiSelect?: boolean;
  /** Whether to show drag handles */
  showDragHandle?: boolean;
  /** Whether to show position numbers */
  showPositionNumbers?: boolean;
  /** CSS class for the list container */
  className?: string;
  /** CSS class for individual items */
  itemClassName?: string;
  /** Gap between items (in pixels or Tailwind spacing) */
  gap?: number | string;
  /** Accessible label for the list */
  'aria-label'?: string;
  /** Custom empty state */
  emptyState?: ReactNode;
}

/**
 * Render options passed to renderItem function
 */
export interface SortableItemRenderOptions {
  /** Current index in the list */
  index: number;
  /** Total number of items */
  total: number;
  /** Whether this item is being dragged */
  isDragging: boolean;
  /** Whether this item is selected */
  isSelected: boolean;
  /** Whether another item is being dragged over this one */
  isOver: boolean;
  /** Whether this item is the first in the list */
  isFirst: boolean;
  /** Whether this item is the last in the list */
  isLast: boolean;
  /** Drag handle props (spread onto drag handle element) */
  dragHandleProps: Record<string, unknown>;
}

/**
 * Props for SortableItem component
 */
export interface SortableItemProps {
  /** Unique identifier */
  id: UniqueIdentifier;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Content to render */
  children: ReactNode;
  /** CSS class */
  className?: string;
  /** Whether to show position number */
  showPosition?: boolean;
  /** Current position (1-indexed) */
  position?: number;
}

/**
 * Props for DragHandle component
 */
export interface DragHandleProps {
  /** CSS class */
  className?: string;
  /** Whether the handle is disabled */
  disabled?: boolean;
  /** Accessible label */
  'aria-label'?: string;
  /** Children (icon) */
  children?: ReactNode;
}

/**
 * Props for DropZoneIndicator component
 */
export interface DropZoneIndicatorProps {
  /** Whether to show the indicator */
  visible: boolean;
  /** Position (top or bottom of the item) */
  position: 'before' | 'after';
  /** CSS class */
  className?: string;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context value for sortable list
 */
export interface SortableContextValue<T extends SortableItemData = SortableItemData> {
  /** Current items */
  items: T[];
  /** Active item ID */
  activeId: UniqueIdentifier | null;
  /** Over item ID */
  overId: UniqueIdentifier | null;
  /** Whether dragging */
  isDragging: boolean;
  /** Direction */
  direction: SortableDirection;
  /** Selected IDs */
  selectedIds: Set<UniqueIdentifier>;
  /** Multi-select enabled */
  multiSelect: boolean;
  /** Show drag handles */
  showDragHandle: boolean;
  /** Show position numbers */
  showPositionNumbers: boolean;
}

// ============================================================================
// Announcement Types (for screen readers)
// ============================================================================

/**
 * Announcements for screen readers
 */
export interface SortableAnnouncements {
  /** Announced when drag starts */
  onDragStart: (event: { active: Active }) => string;
  /** Announced when dragging over another item */
  onDragOver: (event: { active: Active; over: Over | null }) => string | undefined;
  /** Announced when drag ends */
  onDragEnd: (event: { active: Active; over: Over | null }) => string;
  /** Announced when drag is cancelled */
  onDragCancel: (event: { active: Active }) => string;
}
