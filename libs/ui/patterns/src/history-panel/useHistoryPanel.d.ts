/**
 * Headless History Panel Hook
 *
 * Provides all logic for the history panel without UI implementation.
 * Follows the Headless + Platform Presenters pattern (ADR-018).
 *
 * Features:
 * - Action list management
 * - Jump to history point
 * - Keyboard navigation
 * - Screen reader announcements
 *
 * @see NAS-4.24: Implement Undo/Redo History
 */
import type { UndoableAction } from '@nasnet/state/stores';
export interface HistoryPanelItem {
    /** Action data */
    action: UndoableAction;
    /** Index in combined history (past + future) */
    index: number;
    /** Whether this action is in the past (already executed) */
    isInPast: boolean;
    /** Whether this is the current position */
    isCurrent: boolean;
    /** Whether this is the first action */
    isFirst: boolean;
    /** Whether this is the last action */
    isLast: boolean;
}
export interface UseHistoryPanelOptions {
    /** Callback when panel should close */
    onClose?: () => void;
    /** Callback when announcement should be made */
    onAnnounce?: (message: string) => void;
}
export interface UseHistoryPanelReturn {
    /** All history items for display */
    items: HistoryPanelItem[];
    /** Current position in history (index of last executed action) */
    currentIndex: number;
    /** Currently focused item index for keyboard navigation */
    focusedIndex: number;
    /** Whether undo is available */
    canUndo: boolean;
    /** Whether redo is available */
    canRedo: boolean;
    /** Whether history is empty */
    isEmpty: boolean;
    /** Total number of items in history */
    totalItems: number;
    /** Jump to a specific index in history */
    jumpTo: (index: number) => Promise<void>;
    /** Undo the last action */
    undo: () => Promise<boolean>;
    /** Redo the next action */
    redo: () => Promise<boolean>;
    /** Clear all history */
    clearAll: () => void;
    /** Move focus up */
    focusPrevious: () => void;
    /** Move focus down */
    focusNext: () => void;
    /** Execute focused action */
    executeFocused: () => Promise<void>;
    /** Get props for item element */
    getItemProps: (index: number) => {
        role: string;
        tabIndex: number;
        'aria-selected': boolean;
        'aria-current': boolean | 'step';
        onKeyDown: (e: React.KeyboardEvent) => void;
        onClick: () => Promise<void>;
        onFocus: () => void;
    };
    /** Get props for list container */
    getListProps: () => {
        role: string;
        'aria-label': string;
        'aria-activedescendant': string | undefined;
    };
    /** Get formatted shortcut display */
    getShortcutDisplay: (action: 'undo' | 'redo') => string;
}
/**
 * Hook providing all logic for the history panel
 *
 * @example
 * ```tsx
 * function HistoryPanel() {
 *   const {
 *     items,
 *     currentIndex,
 *     getListProps,
 *     getItemProps,
 *   } = useHistoryPanel();
 *
 *   return (
 *     <ul {...getListProps()}>
 *       {items.map((item, i) => (
 *         <li key={item.action.id} {...getItemProps(i)}>
 *           {item.action.description}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export declare function useHistoryPanel(options?: UseHistoryPanelOptions): UseHistoryPanelReturn;
/**
 * Format timestamp for display
 */
export declare function formatHistoryTimestamp(date: Date): string;
/**
 * Get icon name for action type
 */
export declare function getActionTypeIcon(type: string): string;
//# sourceMappingURL=useHistoryPanel.d.ts.map