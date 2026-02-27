/**
 * useAutoScroll Hook
 * Manages auto-scroll behavior for scrollable containers
 * Epic 0.8: System Logs - Story 0.8.4
 */

import { useEffect, useState, useCallback, RefObject } from 'react';

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
export function useAutoScroll({
  scrollRef,
  data,
  enabled = true,
  threshold = 100,
}: UseAutoScrollOptions): UseAutoScrollReturn {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newEntriesCount, setNewEntriesCount] = useState(0);
  const [previousDataLength, setPreviousDataLength] = useState(data.length);

  /**
   * Checks if the scroll container is at the bottom
   */
  const checkIsAtBottom = useCallback(() => {
    if (!scrollRef.current) return false;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom <= threshold;
  }, [scrollRef, threshold]);

  /**
   * Scrolls the container to the bottom
   */
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      if (!scrollRef.current) return;

      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });

      // Reset new entries count when scrolling to bottom
      setNewEntriesCount(0);
      setIsAtBottom(true);
    },
    [scrollRef]
  );

  /**
   * Handle scroll events to detect user scrolling
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      // Cancel previous rAF if it exists
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Use requestAnimationFrame for better performance
      rafId = requestAnimationFrame(() => {
        const atBottom = checkIsAtBottom();
        setIsAtBottom(atBottom);

        // Reset count when user manually scrolls to bottom
        if (atBottom) {
          setNewEntriesCount(0);
        }
      });
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [scrollRef, enabled, checkIsAtBottom]);

  /**
   * Handle data changes to auto-scroll or track new entries
   */
  useEffect(() => {
    if (!enabled) return;

    const currentDataLength = data.length;
    const hasNewEntries = currentDataLength > previousDataLength;

    if (hasNewEntries) {
      const newCount = currentDataLength - previousDataLength;

      if (isAtBottom) {
        // Auto-scroll to bottom if user is already at bottom
        // Use instant scroll for initial load, smooth for updates
        const behavior: ScrollBehavior = previousDataLength === 0 ? 'instant' : 'smooth';
        scrollToBottom(behavior);
      } else {
        // Increment new entries count if user is scrolled up
        setNewEntriesCount((prev) => prev + newCount);
      }
    }

    setPreviousDataLength(currentDataLength);
  }, [data, data.length, enabled, isAtBottom, previousDataLength, scrollToBottom]);

  /**
   * Initial scroll to bottom on mount
   */
  useEffect(() => {
    if (enabled && data.length > 0) {
      // Instant scroll on initial load
      scrollToBottom('instant');
    }
  }, []); // Only run once on mount

  return {
    isAtBottom,
    newEntriesCount,
    scrollToBottom: () => scrollToBottom(),
  };
}
