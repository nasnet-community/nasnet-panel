import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useLogBookmarks } from './useLogBookmarks';
import type { LogEntry } from '@nasnet/core/types';

describe('useLogBookmarks', () => {
  const mockLogEntry = (
    id: string,
    message = 'Test log',
    severity: LogEntry['severity'] = 'info',
    topic: LogEntry['topic'] = 'system'
  ): LogEntry => ({
    id,
    message,
    severity,
    topic,
    timestamp: new Date(),
  });

  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with empty bookmarks', () => {
      const { result } = renderHook(() => useLogBookmarks());

      expect(result.current.bookmarkedLogs).toEqual([]);
      expect(result.current.bookmarkedIds.size).toBe(0);
      expect(result.current.count).toBe(0);
      expect(result.current.isMaxReached).toBe(false);
    });

    it('should load bookmarks from sessionStorage on mount', () => {
      const logs = [mockLogEntry('1'), mockLogEntry('2')];
      sessionStorage.setItem('nasnet-log-bookmarks', JSON.stringify(logs));

      const { result } = renderHook(() => useLogBookmarks());

      expect(result.current.bookmarkedLogs).toHaveLength(2);
      expect(result.current.count).toBe(2);
    });

    it('should handle corrupted sessionStorage data', () => {
      sessionStorage.setItem('nasnet-log-bookmarks', 'invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useLogBookmarks());

      expect(result.current.bookmarkedLogs).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('adding bookmarks', () => {
    it('should add a bookmark', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
      });

      expect(result.current.bookmarkedLogs).toHaveLength(1);
      expect(result.current.bookmarkedLogs[0]).toEqual(log);
      expect(result.current.count).toBe(1);
    });

    it('should not add duplicate bookmarks', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
        result.current.addBookmark(log);
      });

      expect(result.current.bookmarkedLogs).toHaveLength(1);
    });

    it('should not exceed MAX_BOOKMARKS', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create 51 logs (1 more than MAX_BOOKMARKS which is 50)
      for (let i = 0; i < 51; i++) {
        act(() => {
          result.current.addBookmark(mockLogEntry(String(i)));
        });
      }

      expect(result.current.count).toBe(50);
      expect(result.current.isMaxReached).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should persist bookmarks to sessionStorage', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
      });

      const stored = sessionStorage.getItem('nasnet-log-bookmarks');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('1');
    });
  });

  describe('removing bookmarks', () => {
    it('should remove a bookmark by ID', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
      });

      expect(result.current.count).toBe(1);

      act(() => {
        result.current.removeBookmark('1');
      });

      expect(result.current.bookmarkedLogs).toHaveLength(0);
      expect(result.current.count).toBe(0);
    });

    it('should handle removing non-existent bookmark', () => {
      const { result } = renderHook(() => useLogBookmarks());

      act(() => {
        result.current.removeBookmark('non-existent');
      });

      expect(result.current.bookmarkedLogs).toHaveLength(0);
    });

    it('should persist after removing bookmark', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
      });

      act(() => {
        result.current.removeBookmark('1');
      });

      const stored = sessionStorage.getItem('nasnet-log-bookmarks');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('toggling bookmarks', () => {
    it('should add bookmark if not bookmarked', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.toggleBookmark(log);
      });

      expect(result.current.isBookmarked('1')).toBe(true);
      expect(result.current.count).toBe(1);
    });

    it('should remove bookmark if already bookmarked', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
      });

      expect(result.current.isBookmarked('1')).toBe(true);

      act(() => {
        result.current.toggleBookmark(log);
      });

      expect(result.current.isBookmarked('1')).toBe(false);
      expect(result.current.count).toBe(0);
    });
  });

  describe('checking bookmark status', () => {
    it('should return true for bookmarked logs', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
      });

      expect(result.current.isBookmarked('1')).toBe(true);
    });

    it('should return false for non-bookmarked logs', () => {
      const { result } = renderHook(() => useLogBookmarks());

      expect(result.current.isBookmarked('non-existent')).toBe(false);
    });

    it('should have O(1) lookup performance via bookmarkedIds Set', () => {
      const { result } = renderHook(() => useLogBookmarks());

      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.addBookmark(mockLogEntry(String(i)));
        });
      }

      expect(result.current.bookmarkedIds).toBeInstanceOf(Set);
      expect(result.current.bookmarkedIds.size).toBe(50);

      // isBookmarked should use Set.has() for O(1) lookup
      expect(result.current.isBookmarked('25')).toBe(true);
    });
  });

  describe('clearing bookmarks', () => {
    it('should clear all bookmarks', () => {
      const { result } = renderHook(() => useLogBookmarks());

      act(() => {
        result.current.addBookmark(mockLogEntry('1'));
        result.current.addBookmark(mockLogEntry('2'));
        result.current.addBookmark(mockLogEntry('3'));
      });

      expect(result.current.count).toBe(3);

      act(() => {
        result.current.clearBookmarks();
      });

      expect(result.current.bookmarkedLogs).toHaveLength(0);
      expect(result.current.count).toBe(0);
      expect(result.current.isMaxReached).toBe(false);
    });

    it('should persist empty state after clearing', () => {
      const { result } = renderHook(() => useLogBookmarks());

      act(() => {
        result.current.addBookmark(mockLogEntry('1'));
      });

      act(() => {
        result.current.clearBookmarks();
      });

      const stored = sessionStorage.getItem('nasnet-log-bookmarks');
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('bookmark count and max tracking', () => {
    it('should track count accurately', () => {
      const { result } = renderHook(() => useLogBookmarks());

      expect(result.current.count).toBe(0);

      act(() => {
        result.current.addBookmark(mockLogEntry('1'));
      });

      expect(result.current.count).toBe(1);

      act(() => {
        result.current.addBookmark(mockLogEntry('2'));
      });

      expect(result.current.count).toBe(2);

      act(() => {
        result.current.removeBookmark('1');
      });

      expect(result.current.count).toBe(1);
    });

    it('should set isMaxReached when at 50 bookmarks', () => {
      const { result } = renderHook(() => useLogBookmarks());

      expect(result.current.isMaxReached).toBe(false);

      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.addBookmark(mockLogEntry(String(i)));
        });
      }

      expect(result.current.isMaxReached).toBe(true);

      act(() => {
        result.current.removeBookmark('0');
      });

      expect(result.current.isMaxReached).toBe(false);
    });
  });

  describe('bookmarkedIds Set', () => {
    it('should maintain bookmarkedIds in sync with bookmarkedLogs', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const logs = [mockLogEntry('1'), mockLogEntry('2'), mockLogEntry('3')];

      act(() => {
        for (const log of logs) {
          result.current.addBookmark(log);
        }
      });

      expect(result.current.bookmarkedIds.size).toBe(3);
      expect(result.current.bookmarkedIds.has('1')).toBe(true);
      expect(result.current.bookmarkedIds.has('2')).toBe(true);
      expect(result.current.bookmarkedIds.has('3')).toBe(true);
    });

    it('should update bookmarkedIds when removing bookmarks', () => {
      const { result } = renderHook(() => useLogBookmarks());
      const log = mockLogEntry('1');

      act(() => {
        result.current.addBookmark(log);
      });

      expect(result.current.bookmarkedIds.has('1')).toBe(true);

      act(() => {
        result.current.removeBookmark('1');
      });

      expect(result.current.bookmarkedIds.has('1')).toBe(false);
    });
  });

  describe('timestamp handling', () => {
    it('should preserve timestamp objects when loading from sessionStorage', () => {
      const originalLog = mockLogEntry('1');
      sessionStorage.setItem('nasnet-log-bookmarks', JSON.stringify([originalLog]));

      const { result } = renderHook(() => useLogBookmarks());

      const loadedLog = result.current.bookmarkedLogs[0];
      expect(loadedLog.timestamp).toBeInstanceOf(Date);
      expect(loadedLog.timestamp).toEqual(originalLog.timestamp);
    });
  });

  describe('multiple hook instances', () => {
    it('should sync state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useLogBookmarks());
      const { result: result2 } = renderHook(() => useLogBookmarks());

      const log = mockLogEntry('1');

      act(() => {
        result1.current.addBookmark(log);
      });

      // Create a new instance to load from sessionStorage
      const { result: result3 } = renderHook(() => useLogBookmarks());

      expect(result3.current.bookmarkedLogs).toHaveLength(1);
      expect(result3.current.isBookmarked('1')).toBe(true);
    });
  });
});
