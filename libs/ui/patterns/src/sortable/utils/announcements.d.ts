/**
 * Screen Reader Announcements
 *
 * ARIA live region announcements for drag and drop operations.
 * Ensures accessibility for screen reader users.
 *
 * @see NAS-4.21: Implement Drag & Drop System
 */
import type { SortableAnnouncements } from '../types';
import type { Announcements } from '@dnd-kit/core/dist/components/Accessibility/types';
export interface AnnouncementData {
    /** Item label */
    label?: string;
    /** Current index (0-based) */
    index?: number;
    /** Total number of items */
    total?: number;
}
/**
 * Default screen reader announcements for sortable lists
 */
export declare const defaultAnnouncements: SortableAnnouncements;
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
export declare function createAnnouncements(options?: CreateAnnouncementsOptions): SortableAnnouncements;
/**
 * Convert SortableAnnouncements to dnd-kit Announcements type
 */
export declare function toDndKitAnnouncements(announcements: SortableAnnouncements): Announcements;
/**
 * Announcements for multi-select operations
 */
export declare const multiSelectAnnouncements: {
    itemSelected: (label: string, count: number) => string;
    itemDeselected: (label: string, count: number) => string;
    rangeSelected: (count: number) => string;
    allSelected: (count: number) => string;
    selectionCleared: () => string;
    multiDragStart: (count: number) => string;
    multiDragEnd: (count: number, position: number) => string;
};
/**
 * Announcements for keyboard navigation
 */
export declare const keyboardAnnouncements: {
    enterDragMode: (label: string) => string;
    exitDragMode: (label: string) => string;
    movedTo: (label: string, position: number, direction: "up" | "down") => string;
    movedToTop: (label: string) => string;
    movedToBottom: (label: string) => string;
    cannotMove: (direction: "up" | "down") => string;
};
//# sourceMappingURL=announcements.d.ts.map