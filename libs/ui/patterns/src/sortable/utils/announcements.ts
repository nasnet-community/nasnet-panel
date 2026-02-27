/**
 * Screen Reader Announcements
 *
 * ARIA live region announcements for drag and drop operations.
 * Ensures accessibility for screen reader users.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */

import type { SortableAnnouncements } from '../types';
import type { Active, Over } from '@dnd-kit/core';
import type { Announcements } from '@dnd-kit/core/dist/components/Accessibility/types';

// ============================================================================
// Types
// ============================================================================

export interface AnnouncementData {
  /** Item label */
  label?: string;
  /** Current index (0-based) */
  index?: number;
  /** Total number of items */
  total?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract announcement data from active/over item
 */
function getItemData(item: Active | Over | null): AnnouncementData {
  if (!item) return {};

  const data = item.data?.current as AnnouncementData | undefined;

  return {
    label: data?.label ?? String(item.id),
    index: data?.index ?? 0,
    total: data?.total ?? 0,
  };
}

/**
 * Format position for announcement (1-indexed for humans)
 */
function formatPosition(index: number): string {
  return String(index + 1);
}

// ============================================================================
// Default Announcements (English)
// ============================================================================

/**
 * Default screen reader announcements for sortable lists
 */
export const defaultAnnouncements: SortableAnnouncements = {
  onDragStart: ({ active }) => {
    const { label, index, total } = getItemData(active);
    return `Picked up ${label}. Position ${formatPosition(index ?? 0)} of ${total}. Use arrow keys to move, Space to drop, Escape to cancel.`;
  },

  onDragOver: ({ active, over }) => {
    if (!over) return undefined;

    const { label: activeLabel } = getItemData(active);
    const { index: overIndex } = getItemData(over);

    if (overIndex === undefined) return undefined;

    return `${activeLabel} is now at position ${formatPosition(overIndex)}.`;
  },

  onDragEnd: ({ active, over }) => {
    const { label, index: originalIndex } = getItemData(active);

    if (!over) {
      return `Dropped ${label}. No change in position.`;
    }

    const { index: newIndex } = getItemData(over);

    if (newIndex === originalIndex) {
      return `Dropped ${label}. Position unchanged at ${formatPosition(newIndex ?? 0)}.`;
    }

    return `Dropped ${label} at position ${formatPosition(newIndex ?? 0)}.`;
  },

  onDragCancel: ({ active }) => {
    const { label, index } = getItemData(active);
    return `Cancelled moving ${label}. Returned to position ${formatPosition(index ?? 0)}.`;
  },
};

// ============================================================================
// Create Custom Announcements
// ============================================================================

export interface CreateAnnouncementsOptions {
  /** Custom item label getter */
  getLabel?: (id: string) => string;
  /** Language/locale for announcements */
  locale?: string;
  /** Custom announcement templates */
  templates?: Partial<{
    dragStart: (label: string, position: number, total: number) => string;
    dragOver: (label: string, position: number) => string;
    dragEnd: (label: string, position: number) => string;
    dragCancel: (label: string, position: number) => string;
  }>;
}

/**
 * Create custom announcements with options
 */
export function createAnnouncements(
  options: CreateAnnouncementsOptions = {}
): SortableAnnouncements {
  const { getLabel, templates } = options;

  return {
    onDragStart: ({ active }) => {
      const { index, total } = getItemData(active);
      const label = getLabel?.(String(active.id)) ?? getItemData(active).label ?? String(active.id);

      if (templates?.dragStart) {
        return templates.dragStart(label, (index ?? 0) + 1, total ?? 0);
      }

      return defaultAnnouncements.onDragStart({ active });
    },

    onDragOver: ({ active, over }) => {
      if (!over) return undefined;

      const { index: overIndex } = getItemData(over);
      const label = getLabel?.(String(active.id)) ?? getItemData(active).label ?? String(active.id);

      if (templates?.dragOver && overIndex !== undefined) {
        return templates.dragOver(label, overIndex + 1);
      }

      return defaultAnnouncements.onDragOver({ active, over });
    },

    onDragEnd: ({ active, over }) => {
      const label = getLabel?.(String(active.id)) ?? getItemData(active).label ?? String(active.id);

      if (!over) {
        return `Dropped ${label}. No change in position.`;
      }

      const { index: newIndex } = getItemData(over);

      if (templates?.dragEnd && newIndex !== undefined) {
        return templates.dragEnd(label, newIndex + 1);
      }

      return defaultAnnouncements.onDragEnd({ active, over });
    },

    onDragCancel: ({ active }) => {
      const { index } = getItemData(active);
      const label = getLabel?.(String(active.id)) ?? getItemData(active).label ?? String(active.id);

      if (templates?.dragCancel) {
        return templates.dragCancel(label, (index ?? 0) + 1);
      }

      return defaultAnnouncements.onDragCancel({ active });
    },
  };
}

// ============================================================================
// Convert to dnd-kit Announcements Type
// ============================================================================

/**
 * Convert SortableAnnouncements to dnd-kit Announcements type
 */
export function toDndKitAnnouncements(announcements: SortableAnnouncements): Announcements {
  return {
    onDragStart: ({ active }) => announcements.onDragStart({ active }),
    onDragOver: ({ active, over }) => announcements.onDragOver({ active, over }),
    onDragEnd: ({ active, over }) => announcements.onDragEnd({ active, over }),
    onDragCancel: ({ active }) => announcements.onDragCancel({ active }),
  };
}

// ============================================================================
// Multi-Select Announcements
// ============================================================================

/**
 * Announcements for multi-select operations
 */
export const multiSelectAnnouncements = {
  itemSelected: (label: string, count: number) =>
    `Selected ${label}. ${count} item${count === 1 ? '' : 's'} selected.`,

  itemDeselected: (label: string, count: number) =>
    `Deselected ${label}. ${count} item${count === 1 ? '' : 's'} selected.`,

  rangeSelected: (count: number) => `Selected ${count} items.`,

  allSelected: (count: number) => `Selected all ${count} items.`,

  selectionCleared: () => 'Selection cleared.',

  multiDragStart: (count: number) =>
    `Dragging ${count} items. Use arrow keys to move, Space to drop, Escape to cancel.`,

  multiDragEnd: (count: number, position: number) =>
    `Dropped ${count} items at position ${position}.`,
};

// ============================================================================
// Keyboard Navigation Announcements
// ============================================================================

/**
 * Announcements for keyboard navigation
 */
export const keyboardAnnouncements = {
  enterDragMode: (label: string) => `Entered drag mode for ${label}. Use arrow keys to move.`,

  exitDragMode: (label: string) => `Exited drag mode for ${label}.`,

  movedTo: (label: string, position: number, direction: 'up' | 'down') =>
    `Moved ${label} ${direction} to position ${position}.`,

  movedToTop: (label: string) => `Moved ${label} to top of list.`,

  movedToBottom: (label: string) => `Moved ${label} to bottom of list.`,

  cannotMove: (direction: 'up' | 'down') =>
    `Cannot move ${direction}. Already at ${direction === 'up' ? 'top' : 'bottom'} of list.`,
};
