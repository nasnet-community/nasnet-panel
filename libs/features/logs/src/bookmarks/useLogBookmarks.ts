/**
 * Log bookmarks hook
 * Epic 0.8: System Logs - Pinned/Bookmarked Logs
 */

import * as React from 'react';
import type { LogEntry } from '@nasnet/core/types';

const STORAGE_KEY = 'nasnet-log-bookmarks';
const MAX_BOOKMARKS = 50;

export interface UseLogBookmarksReturn {
  /**
   * List of bookmarked log IDs
   */
  bookmarkedIds: Set<string>;
  /**
   * List of bookmarked log entries
   */
  bookmarkedLogs: LogEntry[];
  /**
   * Check if a log is bookmarked
   */
  isBookmarked: (logId: string) => boolean;
  /**
   * Toggle bookmark for a log entry
   */
  toggleBookmark: (log: LogEntry) => void;
  /**
   * Add a bookmark
   */
  addBookmark: (log: LogEntry) => void;
  /**
   * Remove a bookmark
   */
  removeBookmark: (logId: string) => void;
  /**
   * Clear all bookmarks
   */
  clearBookmarks: () => void;
  /**
   * Number of bookmarks
   */
  count: number;
  /**
   * Whether max bookmarks reached
   */
  isMaxReached: boolean;
}

/**
 * Load bookmarks from sessionStorage
 */
function loadBookmarks(): LogEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return parsed.map((log: LogEntry) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  } catch (error) {
    console.error('[useLogBookmarks] Failed to load bookmarks:', error);
  }
  return [];
}

/**
 * Save bookmarks to sessionStorage
 */
function saveBookmarks(logs: LogEntry[]): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('[useLogBookmarks] Failed to save bookmarks:', error);
  }
}

/**
 * Hook for managing bookmarked log entries
 */
export function useLogBookmarks(): UseLogBookmarksReturn {
  const [bookmarkedLogs, setBookmarkedLogs] = React.useState<LogEntry[]>(() =>
    loadBookmarks()
  );

  // Compute bookmarked IDs set for O(1) lookup
  const bookmarkedIds = React.useMemo(
    () => new Set(bookmarkedLogs.map((log) => log.id)),
    [bookmarkedLogs]
  );

  // Persist to sessionStorage when bookmarks change
  React.useEffect(() => {
    saveBookmarks(bookmarkedLogs);
  }, [bookmarkedLogs]);

  const isBookmarked = React.useCallback(
    (logId: string) => bookmarkedIds.has(logId),
    [bookmarkedIds]
  );

  const addBookmark = React.useCallback((log: LogEntry) => {
    setBookmarkedLogs((prev) => {
      // Check if already bookmarked
      if (prev.some((l) => l.id === log.id)) {
        return prev;
      }

      // Check max limit
      if (prev.length >= MAX_BOOKMARKS) {
        console.warn('[useLogBookmarks] Max bookmarks reached');
        return prev;
      }

      return [...prev, log];
    });
  }, []);

  const removeBookmark = React.useCallback((logId: string) => {
    setBookmarkedLogs((prev) => prev.filter((log) => log.id !== logId));
  }, []);

  const toggleBookmark = React.useCallback(
    (log: LogEntry) => {
      if (isBookmarked(log.id)) {
        removeBookmark(log.id);
      } else {
        addBookmark(log);
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  );

  const clearBookmarks = React.useCallback(() => {
    setBookmarkedLogs([]);
  }, []);

  return {
    bookmarkedIds,
    bookmarkedLogs,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    count: bookmarkedLogs.length,
    isMaxReached: bookmarkedLogs.length >= MAX_BOOKMARKS,
  };
}







