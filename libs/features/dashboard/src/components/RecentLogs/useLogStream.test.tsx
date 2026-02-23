/**
 * useLogStream Hook Tests
 * Tests for the log streaming hook with TanStack Query polling
 * Story NAS-5.6: Recent Logs with Filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LogEntry } from '@nasnet/core/types';
import type { ReactNode } from 'react';

import { useLogStream } from './useLogStream';
import * as queries from '@nasnet/api-client/queries';

// Mock the dependencies
vi.mock('@nasnet/api-client/queries', () => ({
  useSystemLogs: vi.fn(),
}));

vi.mock('@nasnet/state/stores', () => ({
  useConnectionStore: vi.fn((selector) =>
    selector({ currentRouterIp: '192.168.88.1' })
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useLogStream', () => {
  const mockLogs: LogEntry[] = [
    {
      id: 'log-1',
      timestamp: new Date('2026-02-05T10:00:00Z'),
      topic: 'system',
      severity: 'info',
      message: 'System started successfully',
    },
    {
      id: 'log-2',
      timestamp: new Date('2026-02-05T10:05:00Z'),
      topic: 'firewall',
      severity: 'warning',
      message: 'Connection rejected from 192.168.1.100',
    },
    {
      id: 'log-3',
      timestamp: new Date('2026-02-05T10:10:00Z'),
      topic: 'wireless',
      severity: 'info',
      message: 'Client connected: AA:BB:CC:DD:EE:FF',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should return logs sorted newest first', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useLogStream({ deviceId: '192.168.88.1', topics: [] }),
        { wrapper: createWrapper() }
      );

      expect(result.current.logs).toHaveLength(3);
      expect(result.current.logs[0].id).toBe('log-3'); // Newest first
      expect(result.current.logs[2].id).toBe('log-1'); // Oldest last
    });

    it('should limit logs to maxEntries', () => {
      const manyLogs: LogEntry[] = Array.from({ length: 20 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date(`2026-02-05T${10 + i}:00:00Z`),
        topic: 'system',
        severity: 'info',
        message: `Log entry ${i}`,
      }));

      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: manyLogs,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(
        () =>
          useLogStream({ deviceId: '192.168.88.1', topics: [], maxEntries: 10 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.logs).toHaveLength(10);
      expect(result.current.hasMore).toBe(true);
    });
  });

  describe('Topic filtering', () => {
    it('should pass empty topics array as undefined to useSystemLogs', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderHook(
        () => useLogStream({ deviceId: '192.168.88.1', topics: [] }),
        { wrapper: createWrapper() }
      );

      expect(queries.useSystemLogs).toHaveBeenCalledWith(
        '192.168.88.1',
        expect.objectContaining({
          topics: undefined,
        })
      );
    });

    it('should pass selected topics to useSystemLogs', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderHook(
        () =>
          useLogStream({
            deviceId: '192.168.88.1',
            topics: ['firewall', 'dhcp'],
          }),
        { wrapper: createWrapper() }
      );

      expect(queries.useSystemLogs).toHaveBeenCalledWith(
        '192.168.88.1',
        expect.objectContaining({
          topics: ['firewall', 'dhcp'],
        })
      );
    });
  });

  describe('Loading and error states', () => {
    it('should return loading state', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useLogStream({ deviceId: '192.168.88.1', topics: [] }),
        { wrapper: createWrapper() }
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.logs).toEqual([]);
    });

    it('should return error state', () => {
      const mockError = new Error('Failed to fetch logs');
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useLogStream({ deviceId: '192.168.88.1', topics: [] }),
        { wrapper: createWrapper() }
      );

      expect(result.current.error).toBe(mockError);
      expect(result.current.logs).toEqual([]);
    });
  });

  describe('Polling configuration', () => {
    it('should configure polling interval for real-time updates', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      renderHook(
        () => useLogStream({ deviceId: '192.168.88.1', topics: [] }),
        { wrapper: createWrapper() }
      );

      expect(queries.useSystemLogs).toHaveBeenCalledWith(
        '192.168.88.1',
        expect.objectContaining({
          refetchInterval: 5000, // 5-second polling
        })
      );
    });
  });

  describe('Return values', () => {
    it('should provide refetch function', () => {
      const mockRefetch = vi.fn();
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any);

      const { result } = renderHook(
        () => useLogStream({ deviceId: '192.168.88.1', topics: [] }),
        { wrapper: createWrapper() }
      );

      result.current.refetch();
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should return total count and hasMore', () => {
      vi.mocked(queries.useSystemLogs).mockReturnValue({
        data: mockLogs,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useLogStream({ deviceId: '192.168.88.1', topics: [] }),
        { wrapper: createWrapper() }
      );

      expect(result.current.totalCount).toBe(3);
      expect(result.current.hasMore).toBe(false);
    });
  });
});
