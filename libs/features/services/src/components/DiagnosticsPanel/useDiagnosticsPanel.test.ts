/**
 * Unit tests for useDiagnosticsPanel hook
 * Tests diagnostic execution, history, and progress tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDiagnosticsPanel } from './useDiagnosticsPanel';
import type { StartupDiagnostics, DiagnosticResult } from '@nasnet/api-client/queries';

// Mock the API hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useDiagnosticHistory: vi.fn(() => ({
    history: [],
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })),
  useRunDiagnostics: vi.fn(() => [
    vi.fn(),
    {
      data: undefined,
      loading: false,
      error: undefined,
    },
  ]),
  useDiagnosticsProgressSubscription: vi.fn(() => ({
    progress: null,
  })),
  getStartupDiagnostics: vi.fn((history) => history?.[0]),
  hasFailures: vi.fn((diagnostics) => (diagnostics?.failedCount ?? 0) > 0),
}));

describe('useDiagnosticsPanel', () => {
  const mockProps = {
    routerId: 'router-1',
    instanceId: 'instance-1',
    serviceName: 'tor',
    maxHistory: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Diagnostic History', () => {
    it('should load diagnostic history', async () => {
      const { useDiagnosticHistory } = await import('@nasnet/api-client/queries');

      const mockHistory: StartupDiagnostics[] = [
        {
          instanceID: 'instance-1',
          runGroupID: 'run-1',
          results: [],
          overallStatus: 'PASS',
          passedCount: 5,
          failedCount: 0,
          warningCount: 0,
          totalTests: 5,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useDiagnosticHistory).mockReturnValue({
        history: mockHistory,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      await waitFor(() => {
        expect(result.current.history).toEqual(mockHistory);
        expect(result.current.isLoadingHistory).toBe(false);
      });
    });

    it('should identify latest run with failures', async () => {
      const { useDiagnosticHistory, getStartupDiagnostics, hasFailures } = await import(
        '@nasnet/api-client/queries'
      );

      const mockHistory: StartupDiagnostics[] = [
        {
          instanceID: 'instance-1',
          runGroupID: 'run-1',
          results: [],
          overallStatus: 'FAIL',
          passedCount: 3,
          failedCount: 2,
          warningCount: 0,
          totalTests: 5,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(useDiagnosticHistory).mockReturnValue({
        history: mockHistory,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      vi.mocked(getStartupDiagnostics).mockReturnValue(mockHistory[0]);
      vi.mocked(hasFailures).mockReturnValue(true);

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      await waitFor(() => {
        expect(result.current.latestRun).toEqual(mockHistory[0]);
        expect(result.current.hasLatestFailures).toBe(true);
      });
    });
  });

  describe('Test Execution', () => {
    it('should run diagnostics', async () => {
      const { useRunDiagnostics } = await import('@nasnet/api-client/queries');

      const mockRunDiagnostics = vi.fn().mockResolvedValue({
        data: {
          success: true,
          results: [],
          runGroupID: 'run-1',
        },
      });

      vi.mocked(useRunDiagnostics).mockReturnValue([
        mockRunDiagnostics,
        {
          data: undefined,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      await act(async () => {
        await result.current.runDiagnostics();
      });

      expect(mockRunDiagnostics).toHaveBeenCalledWith({
        variables: {
          input: {
            routerID: 'router-1',
            instanceID: 'instance-1',
            testNames: [],
          },
        },
      });
    });

    it('should handle diagnostic completion callback', async () => {
      const { useRunDiagnostics } = await import('@nasnet/api-client/queries');

      const mockResults: DiagnosticResult[] = [
        {
          id: 'result-1',
          instanceID: 'instance-1',
          testName: 'test-1',
          status: 'PASS',
          message: 'Test passed',
          durationMs: 100,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const mockRunDiagnostics = vi.fn().mockResolvedValue({
        data: {
          success: true,
          results: mockResults,
          runGroupID: 'run-1',
        },
      });

      vi.mocked(useRunDiagnostics).mockReturnValue([
        mockRunDiagnostics,
        {
          data: undefined,
          loading: false,
          error: undefined,
        },
      ]);

      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useDiagnosticsPanel({ ...mockProps, onDiagnosticsComplete: onComplete })
      );

      await act(async () => {
        await result.current.runDiagnostics();
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(mockResults);
      });
    });

    it('should handle run errors', async () => {
      const { useRunDiagnostics } = await import('@nasnet/api-client/queries');

      const mockError = new Error('Run failed');
      const mockRunDiagnostics = vi.fn().mockRejectedValue(mockError);

      vi.mocked(useRunDiagnostics).mockReturnValue([
        mockRunDiagnostics,
        {
          data: undefined,
          loading: false,
          error: undefined,
        },
      ]);

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      await act(async () => {
        await result.current.runDiagnostics();
      });

      await waitFor(() => {
        expect(result.current.runError).toEqual(mockError);
      });

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.runError).toBeUndefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should track diagnostic progress', async () => {
      const { useDiagnosticsProgressSubscription, useRunDiagnostics } = await import(
        '@nasnet/api-client/queries'
      );

      vi.mocked(useRunDiagnostics).mockReturnValue([
        vi.fn(),
        {
          data: undefined,
          loading: true,
          error: undefined,
        },
      ]);

      vi.mocked(useDiagnosticsProgressSubscription).mockReturnValue({
        progress: {
          instanceID: 'instance-1',
          runGroupID: 'run-1',
          result: {
            id: 'result-1',
            instanceID: 'instance-1',
            testName: 'test-1',
            status: 'PASS',
            message: 'Test passed',
            durationMs: 100,
            createdAt: '2024-01-01T00:00:00Z',
          },
          progress: 50,
          completedTests: 2,
          totalTests: 4,
          timestamp: '2024-01-01T00:00:00Z',
        },
        loading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      expect(result.current.isRunning).toBe(true);
      expect(result.current.progress).toBe(50);
      expect(result.current.completedTests).toBe(2);
      expect(result.current.totalTests).toBe(4);
      expect(result.current.currentTest).toBe('test-1');
    });
  });

  describe('Helper Functions', () => {
    it('should return correct status colors', () => {
      const { useDiagnosticHistory } = vi.mocked(
        require('@nasnet/api-client/queries')
      );

      vi.mocked(useDiagnosticHistory).mockReturnValue({
        history: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      expect(result.current.getStatusColor('PASS')).toContain('green');
      expect(result.current.getStatusColor('FAIL')).toContain('red');
      expect(result.current.getStatusColor('WARNING')).toContain('amber');
      expect(result.current.getStatusColor('SKIPPED')).toContain('gray');
    });

    it('should return correct status icons', () => {
      const { useDiagnosticHistory } = vi.mocked(
        require('@nasnet/api-client/queries')
      );

      vi.mocked(useDiagnosticHistory).mockReturnValue({
        history: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      expect(result.current.getStatusIcon('PASS')).toBe('check');
      expect(result.current.getStatusIcon('FAIL')).toBe('x');
      expect(result.current.getStatusIcon('WARNING')).toBe('alert');
      expect(result.current.getStatusIcon('SKIPPED')).toBe('minus');
    });

    it('should format duration correctly', () => {
      const { useDiagnosticHistory } = vi.mocked(
        require('@nasnet/api-client/queries')
      );

      vi.mocked(useDiagnosticHistory).mockReturnValue({
        history: [],
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      expect(result.current.formatDuration(500)).toBe('500ms');
      expect(result.current.formatDuration(1500)).toBe('1.50s');
      expect(result.current.formatDuration(2345)).toBe('2.35s');
    });
  });

  describe('Actions', () => {
    it('should refresh history', async () => {
      const { useDiagnosticHistory } = await import('@nasnet/api-client/queries');
      const mockRefetch = vi.fn();

      vi.mocked(useDiagnosticHistory).mockReturnValue({
        history: [],
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      });

      const { result } = renderHook(() => useDiagnosticsPanel(mockProps));

      act(() => {
        result.current.refreshHistory();
      });

      expect(mockRefetch).toHaveBeenCalled();
    });
  });
});
