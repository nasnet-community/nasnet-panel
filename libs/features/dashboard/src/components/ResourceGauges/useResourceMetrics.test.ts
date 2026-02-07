/**
 * useResourceMetrics Hook Tests
 * Tests for resource metrics subscription and polling fallback
 * Story 5.2: Real-Time Resource Utilization Display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { formatBytes, useResourceMetrics, RESOURCE_METRICS_SUBSCRIPTION, GET_RESOURCE_METRICS } from './useResourceMetrics';

// Mock data
const mockMetricsData = {
  cpu: {
    usage: 45,
    cores: 4,
    perCore: [40, 50, 45, 45],
    frequency: 880,
  },
  memory: {
    used: 134217728, // 128 MB
    total: 268435456, // 256 MB
    percentage: 50,
  },
  storage: {
    used: 4194304, // 4 MB
    total: 16777216, // 16 MB
    percentage: 25,
  },
  temperature: 55,
  timestamp: '2025-01-15T10:00:00Z',
};

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
    expect(formatBytes(1610612736)).toBe('1.50 GB');
  });

  it('handles zero and negative values', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-100)).toBe('-100 B');
  });
});

describe('useResourceMetrics', () => {
  const deviceId = 'router-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses subscription data when available (AC 5.2.2)', async () => {
    const mocks = [
      {
        request: {
          query: RESOURCE_METRICS_SUBSCRIPTION,
          variables: { deviceId },
        },
        result: {
          data: {
            resourceMetrics: mockMetricsData,
          },
        },
      },
    ];

    const { result } = renderHook(() => useResourceMetrics(deviceId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBeNull();

    // Wait for subscription data
    await waitFor(() => {
      expect(result.current.metrics).not.toBeNull();
    });

    // Verify formatted metrics
    expect(result.current.metrics).toMatchObject({
      cpu: {
        usage: 45,
        cores: 4,
        formatted: '45% (4 cores)',
      },
      memory: {
        percentage: 50,
        formatted: '128.0 MB / 256.0 MB',
      },
      storage: {
        percentage: 25,
        formatted: '4.0 MB / 16.0 MB',
      },
      temperature: 55,
      hasTemperature: true,
    });
  });

  it('falls back to polling when subscription unavailable (AC 5.2.2)', async () => {
    const mocks = [
      {
        request: {
          query: GET_RESOURCE_METRICS,
          variables: { deviceId },
        },
        result: {
          data: {
            device: {
              resourceMetrics: mockMetricsData,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useResourceMetrics(deviceId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    // Wait for query data
    await waitFor(() => {
      expect(result.current.metrics).not.toBeNull();
    });

    // Verify data from query fallback
    expect(result.current.metrics?.cpu.usage).toBe(45);
  });

  it('handles temperature as optional field (AC 5.2.5)', async () => {
    const dataWithoutTemp = {
      ...mockMetricsData,
      temperature: null,
    };

    const mocks = [
      {
        request: {
          query: GET_RESOURCE_METRICS,
          variables: { deviceId },
        },
        result: {
          data: {
            device: {
              resourceMetrics: dataWithoutTemp,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useResourceMetrics(deviceId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.metrics).not.toBeNull();
    });

    // AC 5.2.5: Temperature should be marked as unsupported
    expect(result.current.metrics?.hasTemperature).toBe(false);
    expect(result.current.metrics?.temperature).toBeNull();
  });

  it('formats memory correctly', async () => {
    const mocks = [
      {
        request: {
          query: GET_RESOURCE_METRICS,
          variables: { deviceId },
        },
        result: {
          data: {
            device: {
              resourceMetrics: mockMetricsData,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useResourceMetrics(deviceId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.metrics).not.toBeNull();
    });

    expect(result.current.metrics?.memory.formatted).toBe('128.0 MB / 256.0 MB');
  });

  it('formats storage correctly', async () => {
    const mocks = [
      {
        request: {
          query: GET_RESOURCE_METRICS,
          variables: { deviceId },
        },
        result: {
          data: {
            device: {
              resourceMetrics: mockMetricsData,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useResourceMetrics(deviceId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.metrics).not.toBeNull();
    });

    expect(result.current.metrics?.storage.formatted).toBe('4.0 MB / 16.0 MB');
  });

  it('provides raw metrics alongside formatted', async () => {
    const mocks = [
      {
        request: {
          query: GET_RESOURCE_METRICS,
          variables: { deviceId },
        },
        result: {
          data: {
            device: {
              resourceMetrics: mockMetricsData,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useResourceMetrics(deviceId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.raw).not.toBeNull();
    });

    // Raw data should match mock
    expect(result.current.raw).toEqual(mockMetricsData);
  });

  it('handles plural/singular core count correctly', async () => {
    const singleCoreData = {
      ...mockMetricsData,
      cpu: {
        ...mockMetricsData.cpu,
        cores: 1,
      },
    };

    const mocks = [
      {
        request: {
          query: GET_RESOURCE_METRICS,
          variables: { deviceId },
        },
        result: {
          data: {
            device: {
              resourceMetrics: singleCoreData,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useResourceMetrics(deviceId), {
      wrapper: ({ children }) => (
        <MockedProvider mocks={mocks} addTypename={false}>
          {children}
        </MockedProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.metrics).not.toBeNull();
    });

    // Should use singular "core" not "cores"
    expect(result.current.metrics?.cpu.formatted).toBe('45% (1 core)');
  });
});
