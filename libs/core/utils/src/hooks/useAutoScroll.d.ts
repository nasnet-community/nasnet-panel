/**
 * useAutoScroll Hook
 * Manages auto-scroll behavior for scrollable containers
 * Epic 0.8: System Logs - Story 0.8.4
 */
import { RefObject } from 'react';
/**
 * Options for useAutoScroll hook
 */
export interface UseAutoScrollOptions {
    /**
     * Ref to the scrollable container
     */
    scrollRef: RefObject<HTMLElement>;
    /**
     * Data array to watch for changes
     */
    data: unknown[];
    /**
     * Enable or disable auto-scroll
     * @default true
     */
    enabled?: boolean;
    /**
     * Scroll threshold in pixels - user is considered "at bottom" when within this distance
     * @default 100
     */
    threshold?: number;
}
/**
 * Return type for useAutoScroll hook
 */
export interface UseAutoScrollReturn {
    /**
     * Whether the user is currently scrolled to the bottom
     */
    isAtBottom: boolean;
    /**
     * Count of new entries since user scrolled up
     */
    newEntriesCount: number;
    /**
     * Scrolls the container to the bottom
     */
    scrollToBottom: () => void;
}
/**
 * useAutoScroll Hook
 *
 * Manages automatic scrolling behavior for scrollable containers like log viewers.
 * - Detects when user is at the bottom of the scroll container
 * - Auto-scrolls to bottom when new data arrives AND user is at bottom
 * - Pauses auto-scroll when user manually scrolls up
 * - Tracks count of new entries while auto-scroll is paused
 *
 * @param options - Configuration for auto-scroll behavior
 * @returns Scroll state and control functions
 *
 * @example
 * ```tsx
 * function LogViewer() {
 *   const scrollRef = useRef<HTMLDivElement>(null);
 *   const { data: logs } = useSystemLogs();
 *   const { isAtBottom, newEntriesCount, scrollToBottom } = useAutoScroll({
 *     scrollRef,
 *     data: logs || [],
 *   });
 *
 *   return (
 *     <div ref={scrollRef} className="overflow-auto">
 *       {logs?.map(log => <LogEntry key={log.id} entry={log} />)}
 *       {!isAtBottom && newEntriesCount > 0 && (
 *         <button onClick={scrollToBottom}>
 *           {newEntriesCount} new entries
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useAutoScroll({ scrollRef, data, enabled, threshold, }: UseAutoScrollOptions): UseAutoScrollReturn;
//# sourceMappingURL=useAutoScroll.d.ts.map