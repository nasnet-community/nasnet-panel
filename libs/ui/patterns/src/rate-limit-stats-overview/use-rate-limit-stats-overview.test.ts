/**
 * useRateLimitStatsOverview Hook Tests
 *
 * Tests polling, trend calculation, CSV export for rate limit statistics.
 * Uses fixtures from __test-utils__/rate-limit-fixtures.ts
 *
 * @see NAS-7.11: Implement Connection Rate Limiting
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { UseQueryResult } from '@tanstack/react-query';

import { useRateLimitStats } from '@nasnet/api-client/queries';

import { useRateLimitStatsOverview } from './use-rate-limit-stats-overview';
import {
  mockStatsWithActivity,
  mockStatsEmpty,
  mockStatsRecent,
} from '../__test-utils__/rate-limit-fixtures';

// Mock dependencies - must be before importing the mocked module
vi.mock('@nasnet/api-client/queries', () => ({
  useRateLimitStats: vi.fn(),
}));

// Setup mock
const mockUseRateLimitStats = vi.mocked(useRateLimitStats);

// Mock DOM APIs for CSV export
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

describe('useRateLimitStatsOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset to default mock implementation
    mockUseRateLimitStats.mockReturnValue({
      data: mockStatsWithActivity,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any as UseQueryResult<typeof mockStatsWithActivity>);

    // Mock document methods
    mockCreateElement.mockImplementation((tag: string) => {
      const element = {
        tagName: tag.toUpperCase(),
        href: '',
        download: '',
        click: vi.fn(),
      };
      return element;
    });

    document.createElement = mockCreateElement;
    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    // Mock URL methods
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should load stats successfully', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.stats).toEqual(mockStatsWithActivity);
      expect(result.current.state.loading).toBe(false);
      expect(result.current.state.error).toBeNull();
    });

    it('should initialize with default polling interval (5s)', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.pollingInterval).toBe('5s');
    });

    it('should handle loading state', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.loading).toBe(true);
      expect(result.current.state.stats).toBeNull();
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch stats');
      mockUseRateLimitStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.error).toBe('Failed to fetch stats');
      expect(result.current.state.stats).toBeNull();
    });
  });

  describe('Polling Interval', () => {
    it('should change polling interval', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.pollingInterval).toBe('5s');

      act(() => {
        result.current.actions.setPollingInterval('30s');
      });

      expect(result.current.state.pollingInterval).toBe('30s');
    });

    it('should support all polling intervals', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const intervals = ['5s', '10s', '30s', '60s'] as const;

      intervals.forEach((interval) => {
        act(() => {
          result.current.actions.setPollingInterval(interval);
        });

        expect(result.current.state.pollingInterval).toBe(interval);
      });
    });

    it('should call useRateLimitStats with correct polling interval', () => {
      renderHook(() => useRateLimitStatsOverview({ routerId: '192.168.1.1' }));

      // Default 5s = 5000ms
      expect(mockUseRateLimitStats).toHaveBeenCalledWith('192.168.1.1', {
        pollingInterval: 5000,
      });
    });
  });

  describe('Chart Data Transformation', () => {
    it('should transform trigger events to chart data', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const chartData = result.current.state.chartData;
      expect(chartData).toHaveLength(mockStatsWithActivity.triggerEvents.length);

      chartData.forEach((point, index) => {
        expect(point.hour).toBe(mockStatsWithActivity.triggerEvents[index]!.hour);
        expect(point.count).toBe(mockStatsWithActivity.triggerEvents[index]!.count);
        expect(typeof point.timestamp).toBe('number');
      });

      expect(result.current.state.stats!.totalBlocked).toBeDefined();
    });

    it('should handle empty trigger events', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: mockStatsEmpty,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const chartData = result.current.state.chartData;
      expect(chartData).toHaveLength(mockStatsEmpty.triggerEvents.length);
      expect(chartData.every((point) => point.count === 0)).toBe(true);
    });

    it('should handle missing stats gracefully', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.chartData).toEqual([]);
    });
  });

  describe('Trend Calculation', () => {
    it('should calculate positive trend', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: {
          ...mockStatsWithActivity,
          triggerEvents: [
            { hour: '00:00', count: 50 },
            { hour: '01:00', count: 100 },
          ],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.trend).toBe(50); // 100 - 50
    });

    it('should calculate negative trend', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: {
          ...mockStatsWithActivity,
          triggerEvents: [
            { hour: '00:00', count: 100 },
            { hour: '01:00', count: 50 },
          ],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.trend).toBe(-50); // 50 - 100
    });

    it('should return 0 trend when less than 2 data points', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: {
          ...mockStatsWithActivity,
          triggerEvents: [{ hour: '00:00', count: 100 }],
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.trend).toBe(0);
    });

    it('should return 0 trend when no data', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.trend).toBe(0);
    });
  });

  describe('CSV Export', () => {
    it('should export stats to CSV', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      act(() => {
        result.current.actions.exportToCsv();
      });

      // Verify Blob was created
      expect(mockCreateObjectURL).toHaveBeenCalled();

      // Verify link was created and clicked
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();

      // Verify URL was revoked
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should include correct CSV headers', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      // Spy on Blob constructor
      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.actions.exportToCsv();
      });

      expect(blobSpy).toHaveBeenCalled();
      const blobContent = blobSpy.mock.calls[0]?.[0]?.[0] as string;
      expect(blobContent).toContain('Timestamp,Blocked Count,Top IP,Top IP Count');
    });

    it('should include data rows in CSV', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.actions.exportToCsv();
      });

      const blobContent = blobSpy.mock.calls[0]?.[0]?.[0] as string;
      const rows = blobContent.split('\n');

      // Should have header + data rows
      expect(rows.length).toBeGreaterThan(1);

      // Check data format (timestamp, count, IP, count)
      const dataRow = rows[1].split(',');
      expect(dataRow).toHaveLength(4);
    });

    it('should handle export with no stats', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      // Should not throw
      act(() => {
        result.current.actions.exportToCsv();
      });

      // Should not create blob
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('should include top IP in CSV export', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.actions.exportToCsv();
      });

      const blobContent = blobSpy.mock.calls[0]?.[0]?.[0] as string;
      const topIP = result.current.state.stats!.topBlockedIPs?.[0];

      if (topIP) {
        expect(blobContent).toContain(topIP.address);
      }
    });

    it('should handle missing top IP gracefully', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: mockStatsEmpty,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.actions.exportToCsv();
      });

      const blobContent = blobSpy.mock.calls[0]?.[0]?.[0] as string;
      expect(blobContent).toContain('N/A'); // Default for missing IP
    });

    it('should generate filename with current date', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      act(() => {
        result.current.actions.exportToCsv();
      });

      const linkElement = mockCreateElement.mock.results.find(
        (r) => r.value?.tagName === 'A'
      )?.value;

      expect(linkElement.download).toMatch(/^rate-limit-stats-\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('Manual Refresh', () => {
    it('should call refetch when refresh is triggered', () => {
      const mockRefetch = vi.fn();
      mockUseRateLimitStats.mockReturnValue({
        data: mockStatsWithActivity,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      act(() => {
        result.current.actions.refresh();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Last Updated', () => {
    it('should track last updated timestamp', () => {
      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.lastUpdated).toEqual(
        mockStatsWithActivity.lastUpdated
      );
    });

    it('should handle missing last updated', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.lastUpdated).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should memoize chart data', () => {
      const { result, rerender } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const firstChartData = result.current.state.chartData;

      // Re-render without changing stats
      rerender();

      const secondChartData = result.current.state.chartData;

      // Should be same reference (memoized)
      expect(firstChartData).toBe(secondChartData);
    });

    it('should memoize trend calculation', () => {
      const { result, rerender } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      const firstTrend = result.current.state.trend;

      // Re-render without changing data
      rerender();

      const secondTrend = result.current.state.trend;

      expect(firstTrend).toBe(secondTrend);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chart data', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: { ...mockStatsWithActivity, triggerEvents: [] },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.chartData).toEqual([]);
      expect(result.current.state.trend).toBe(0);
    });

    it('should handle stats with recent activity', () => {
      mockUseRateLimitStats.mockReturnValue({
        data: mockStatsRecent,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      } as any as UseQueryResult<typeof mockStatsWithActivity>);

      const { result } = renderHook(() =>
        useRateLimitStatsOverview({ routerId: '192.168.1.1' })
      );

      expect(result.current.state.stats?.totalBlocked).toBe(50);
      expect(result.current.state.chartData.length).toBe(24);
    });
  });
});
