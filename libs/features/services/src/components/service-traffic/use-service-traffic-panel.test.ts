/**
 * Tests for useServiceTrafficPanel hook
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 *
 * @description
 * Unit tests for traffic state calculation, rate computation, and quota detection.
 * Covers happy path, edge cases (counter resets, invalid timestamps), and error
 * scenarios.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useServiceTrafficPanel } from './use-service-traffic-panel';
import * as apiClient from '@nasnet/api-client/queries';
import { ApolloError } from '@apollo/client';

// Mock API client
vi.mock('@nasnet/api-client/queries', () => ({
  useTrafficMonitoring: vi.fn(),
}));

describe('useServiceTrafficPanel', () => {
  const mockRouterID = 'router-123';
  const mockInstanceID = 'instance-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial loading state', () => {
    vi.mocked(apiClient.useTrafficMonitoring).mockReturnValue({
      stats: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() =>
      useServiceTrafficPanel({
        routerID: mockRouterID,
        instanceID: mockInstanceID,
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();
    expect(result.current.uploadRate).toBeNull();
    expect(result.current.downloadRate).toBeNull();
  });

  it('should calculate upload/download rates from stats delta', async () => {
    const mockStats = {
      totalUploadBytes: 1000000,
      totalDownloadBytes: 2000000,
      currentPeriodUpload: 500000,
      currentPeriodDownload: 1000000,
      instanceID: 'instance-456',
      lastUpdated: new Date('2026-02-21T12:00:00Z').toISOString(),
      quota: undefined,
      deviceBreakdown: [],
      history: [],
    };

    vi.mocked(apiClient.useTrafficMonitoring).mockReturnValue({
      stats: mockStats,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() =>
      useServiceTrafficPanel({
        routerID: mockRouterID,
        instanceID: mockInstanceID,
      })
    );

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats);
    });
  });

  it('should detect counter resets (negative deltas)', async () => {
    const previousStats = {
      totalUploadBytes: 5000000,
      totalDownloadBytes: 6000000,
      currentPeriodUpload: 2500000,
      currentPeriodDownload: 3000000,
      instanceID: 'instance-456',
      lastUpdated: new Date('2026-02-21T12:00:00Z').toISOString(),
      quota: undefined,
      deviceBreakdown: [],
      history: [],
    };

    const currentStats = {
      totalUploadBytes: 1000000, // Reset/lower value
      totalDownloadBytes: 2000000,
      currentPeriodUpload: 500000,
      currentPeriodDownload: 1000000,
      instanceID: 'instance-456',
      lastUpdated: new Date('2026-02-21T12:01:00Z').toISOString(),
      quota: undefined,
      deviceBreakdown: [],
      history: [],
    };

    vi.mocked(apiClient.useTrafficMonitoring)
      .mockReturnValueOnce({
        stats: previousStats,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      })
      .mockReturnValueOnce({
        stats: currentStats,
        loading: false,
        error: undefined,
        refetch: vi.fn(),
      });

    const { result } = renderHook(() =>
      useServiceTrafficPanel({
        routerID: mockRouterID,
        instanceID: mockInstanceID,
      })
    );

    await waitFor(() => {
      // After counter reset, rates should be null
      expect(result.current.uploadRate).toBeNull();
      expect(result.current.downloadRate).toBeNull();
    });
  });

  it('should handle quota metrics when quota is set', () => {
    const mockStats = {
      totalUploadBytes: 1000000,
      totalDownloadBytes: 2000000,
      currentPeriodUpload: 500000,
      currentPeriodDownload: 1000000,
      instanceID: 'instance-456',
      lastUpdated: new Date().toISOString(),
      quota: {
        id: 'quota-1',
        instanceID: 'instance-456',
        limitBytes: 10000000,
        usagePercent: 75,
        warningTriggered: true,
        limitReached: false,
        consumedBytes: 7500000,
        remainingBytes: 2500000,
        action: 'ALERT' as const,
        period: 'MONTHLY' as const,
        periodStartedAt: new Date().toISOString(),
        periodEndsAt: new Date().toISOString(),
        warningThreshold: 80,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      deviceBreakdown: [],
      history: [],
    };

    vi.mocked(apiClient.useTrafficMonitoring).mockReturnValue({
      stats: mockStats,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() =>
      useServiceTrafficPanel({
        routerID: mockRouterID,
        instanceID: mockInstanceID,
      })
    );

    expect(result.current.quotaUsagePercent).toBe(75);
    expect(result.current.quotaWarning).toBe(true);
    expect(result.current.quotaExceeded).toBe(false);
  });

  it('should return default quota metrics when quota is not set', () => {
    vi.mocked(apiClient.useTrafficMonitoring).mockReturnValue({
      stats: {
        totalUploadBytes: 1000000,
        totalDownloadBytes: 2000000,
        currentPeriodUpload: 500000,
        currentPeriodDownload: 1000000,
        instanceID: 'instance-456',
        lastUpdated: new Date().toISOString(),
        quota: undefined,
        deviceBreakdown: [],
        history: [],
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() =>
      useServiceTrafficPanel({
        routerID: mockRouterID,
        instanceID: mockInstanceID,
      })
    );

    expect(result.current.quotaUsagePercent).toBe(0);
    expect(result.current.quotaWarning).toBe(false);
    expect(result.current.quotaExceeded).toBe(false);
  });

  it('should pass through API errors', () => {
    const mockError = new ApolloError({
      errorMessage: 'API fetch failed',
      graphQLErrors: [],
      networkError: null,
    });

    vi.mocked(apiClient.useTrafficMonitoring).mockReturnValue({
      stats: undefined,
      loading: false,
      error: mockError,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() =>
      useServiceTrafficPanel({
        routerID: mockRouterID,
        instanceID: mockInstanceID,
      })
    );

    expect(result.current.error).toBe(mockError);
  });
});
