/**
 * Unit tests for useServiceLogViewer hook
 * Tests ring buffer, filtering, and search functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useServiceLogViewer } from './useServiceLogViewer';
import type { LogEntry } from '@nasnet/api-client/queries';

// Mock the API hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useServiceLogs: vi.fn(() => ({
    logFile: undefined,
    newLogEntry: undefined,
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })),
}));

describe('useServiceLogViewer', () => {
  const mockProps = {
    routerId: 'router-1',
    instanceId: 'instance-1',
    maxHistoricalLines: 100,
    autoScroll: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ring Buffer', () => {
    it('should maintain maximum 1000 entries', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');
      const mockRefetch = vi.fn();

      // Create 1100 log entries
      const entries: LogEntry[] = Array.from({ length: 1100 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        level: 'INFO' as const,
        message: `Log entry ${i}`,
        source: 'test',
        rawLine: `Log entry ${i}`,
      }));

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries: entries.slice(0, 1000) } as any,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result, rerender } = renderHook(() => useServiceLogViewer(mockProps));

      await waitFor(() => {
        expect(result.current.totalEntries).toBe(1000);
      });

      // Simulate adding 100 more entries via subscription
      for (let i = 1000; i < 1100; i++) {
        vi.mocked(useServiceLogs).mockReturnValue({
          logFile: { entries: entries.slice(0, 1000) } as any,
          newLogEntry: entries[i],
          loading: false,
          error: undefined,
          refetch: mockRefetch,
        });
        rerender();
      }

      await waitFor(() => {
        // Should still be 1000 (oldest 100 discarded)
        expect(result.current.totalEntries).toBe(1000);
      });
    });

    it('should preserve newest entries when buffer overflows', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');
      const mockRefetch = vi.fn();

      const oldEntry: LogEntry = {
        timestamp: '2024-01-01T00:00:00Z',
        level: 'INFO',
        message: 'Old entry',
        source: 'test',
        rawLine: 'Old entry',
      };

      const newEntry: LogEntry = {
        timestamp: '2024-01-02T00:00:00Z',
        level: 'INFO',
        message: 'New entry',
        source: 'test',
        rawLine: 'New entry',
      };

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries: [oldEntry] } as any,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result, rerender } = renderHook(() => useServiceLogViewer(mockProps));

      await waitFor(() => {
        expect(result.current.totalEntries).toBe(1);
      });

      // Add new entry
      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries: [oldEntry] } as any,
        newLogEntry: newEntry,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });
      rerender();

      await waitFor(() => {
        const entries = result.current.logEntries;
        expect(entries).toHaveLength(2);
        expect(entries[1].message).toBe('New entry');
      });
    });
  });

  describe('Level Filtering', () => {
    it('should filter logs by level', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');

      const entries: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          message: 'Info 1',
          source: 'test',
          rawLine: 'Info 1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          level: 'ERROR',
          message: 'Error 1',
          source: 'test',
          rawLine: 'Error 1',
        },
        {
          timestamp: '2024-01-01T00:00:02Z',
          level: 'INFO',
          message: 'Info 2',
          source: 'test',
          rawLine: 'Info 2',
        },
        {
          timestamp: '2024-01-01T00:00:03Z',
          level: 'WARN',
          message: 'Warn 1',
          source: 'test',
          rawLine: 'Warn 1',
        },
      ];

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries } as any,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useServiceLogViewer(mockProps));

      await waitFor(() => {
        expect(result.current.totalEntries).toBe(4);
      });

      // Filter by ERROR level
      act(() => {
        result.current.setLevelFilter('ERROR');
      });

      await waitFor(() => {
        expect(result.current.filteredEntries).toHaveLength(1);
        expect(result.current.filteredEntries[0].level).toBe('ERROR');
      });

      // Clear filter
      act(() => {
        result.current.setLevelFilter(null);
      });

      await waitFor(() => {
        expect(result.current.filteredEntries).toHaveLength(4);
      });
    });

    it('should calculate correct level counts', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');

      const entries: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          message: 'Info 1',
          source: 'test',
          rawLine: 'Info 1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          level: 'ERROR',
          message: 'Error 1',
          source: 'test',
          rawLine: 'Error 1',
        },
        {
          timestamp: '2024-01-01T00:00:02Z',
          level: 'INFO',
          message: 'Info 2',
          source: 'test',
          rawLine: 'Info 2',
        },
        {
          timestamp: '2024-01-01T00:00:03Z',
          level: 'ERROR',
          message: 'Error 2',
          source: 'test',
          rawLine: 'Error 2',
        },
        {
          timestamp: '2024-01-01T00:00:04Z',
          level: 'WARN',
          message: 'Warn 1',
          source: 'test',
          rawLine: 'Warn 1',
        },
      ];

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries } as any,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useServiceLogViewer(mockProps));

      await waitFor(() => {
        expect(result.current.levelCounts.INFO).toBe(2);
        expect(result.current.levelCounts.ERROR).toBe(2);
        expect(result.current.levelCounts.WARN).toBe(1);
        expect(result.current.levelCounts.DEBUG).toBe(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter logs by search query', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');

      const entries: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          message: 'Connection established',
          source: 'network',
          rawLine: 'Connection established',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          level: 'ERROR',
          message: 'Database error',
          source: 'database',
          rawLine: 'Database error',
        },
        {
          timestamp: '2024-01-01T00:00:02Z',
          level: 'INFO',
          message: 'Request processed',
          source: 'api',
          rawLine: 'Request processed',
        },
      ];

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries } as any,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useServiceLogViewer(mockProps));

      await waitFor(() => {
        expect(result.current.totalEntries).toBe(3);
      });

      // Search by message
      act(() => {
        result.current.setSearchQuery('error');
      });

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(1);
        expect(result.current.searchResults[0].message).toContain('error');
        expect(result.current.hasSearch).toBe(true);
      });

      // Clear search
      act(() => {
        result.current.setSearchQuery('');
      });

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(3);
        expect(result.current.hasSearch).toBe(false);
      });
    });

    it('should search across message, source, and rawLine', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');

      const entries: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          message: 'Test message',
          source: 'network',
          rawLine: 'Test message',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          level: 'INFO',
          message: 'Another log',
          source: 'test-service',
          rawLine: 'Another log',
        },
      ];

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries } as any,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useServiceLogViewer(mockProps));

      await waitFor(() => {
        expect(result.current.totalEntries).toBe(2);
      });

      // Search by source
      act(() => {
        result.current.setSearchQuery('test');
      });

      await waitFor(() => {
        expect(result.current.searchResults).toHaveLength(2);
      });
    });
  });

  describe('Actions', () => {
    it('should clear logs', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');

      const entries: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          level: 'INFO',
          message: 'Log 1',
          source: 'test',
          rawLine: 'Log 1',
        },
      ];

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: { entries } as any,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useServiceLogViewer(mockProps));

      await waitFor(() => {
        expect(result.current.totalEntries).toBe(1);
      });

      act(() => {
        result.current.clearLogs();
      });

      await waitFor(() => {
        expect(result.current.totalEntries).toBe(0);
      });
    });

    it('should refresh logs', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');
      const mockRefetch = vi.fn();

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: undefined,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useServiceLogViewer(mockProps));

      act(() => {
        result.current.refreshLogs();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Auto-scroll', () => {
    it('should toggle auto-scroll state', async () => {
      const { useServiceLogs } = await import('@nasnet/api-client/queries');

      vi.mocked(useServiceLogs).mockReturnValue({
        logFile: undefined,
        newLogEntry: undefined,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useServiceLogViewer(mockProps));

      expect(result.current.autoScroll).toBe(true);

      act(() => {
        result.current.setAutoScroll(false);
      });

      expect(result.current.autoScroll).toBe(false);

      act(() => {
        result.current.setAutoScroll(true);
      });

      expect(result.current.autoScroll).toBe(true);
    });
  });
});
