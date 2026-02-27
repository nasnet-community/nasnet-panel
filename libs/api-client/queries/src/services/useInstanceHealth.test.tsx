import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { describe, it, expect } from 'vitest';
import { ReactNode } from 'react';
import { useInstanceHealth, INSTANCE_HEALTH_QUERY } from './useInstanceHealth';

// Wrapper component for Apollo MockedProvider
function createWrapper(mocks: any[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );
  };
}

describe('useInstanceHealth', () => {
  const routerID = 'test-router-123';
  const instanceID = 'test-instance-456';

  it('should fetch instance health successfully', async () => {
    const mocks = [
      {
        request: {
          query: INSTANCE_HEALTH_QUERY,
          variables: { routerID, instanceID },
        },
        result: {
          data: {
            instanceHealth: {
              status: 'HEALTHY',
              processAlive: true,
              connectionStatus: 'CONNECTED',
              latencyMs: 42,
              lastHealthy: '2024-01-15T10:30:00Z',
              consecutiveFails: 0,
              uptimeSeconds: 3600,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useInstanceHealth(routerID, instanceID), {
      wrapper: createWrapper(mocks),
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify data
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.instanceHealth!.status).toBe('HEALTHY');
    expect(result.current.data?.instanceHealth!.processAlive).toBe(true);
    expect(result.current.data?.instanceHealth!.connectionStatus).toBe('CONNECTED');
    expect(result.current.data?.instanceHealth!.latencyMs).toBe(42);
    expect(result.current.data?.instanceHealth!.consecutiveFails).toBe(0);
  });

  it('should handle unhealthy status', async () => {
    const mocks = [
      {
        request: {
          query: INSTANCE_HEALTH_QUERY,
          variables: { routerID, instanceID },
        },
        result: {
          data: {
            instanceHealth: {
              status: 'UNHEALTHY',
              processAlive: false,
              connectionStatus: 'FAILED',
              latencyMs: null,
              lastHealthy: '2024-01-15T09:00:00Z',
              consecutiveFails: 5,
              uptimeSeconds: 0,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useInstanceHealth(routerID, instanceID), {
      wrapper: createWrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.instanceHealth!.status).toBe('UNHEALTHY');
    expect(result.current.data?.instanceHealth!.processAlive).toBe(false);
    expect(result.current.data?.instanceHealth!.connectionStatus).toBe('FAILED');
    expect(result.current.data?.instanceHealth!.consecutiveFails).toBe(5);
  });

  it('should handle query errors', async () => {
    const mocks = [
      {
        request: {
          query: INSTANCE_HEALTH_QUERY,
          variables: { routerID, instanceID },
        },
        error: new Error('Network error'),
      },
    ];

    const { result } = renderHook(() => useInstanceHealth(routerID, instanceID), {
      wrapper: createWrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(result.current.data).toBeUndefined();
  });

  it('should skip query when skip option is true', async () => {
    const { result } = renderHook(() => useInstanceHealth(routerID, instanceID, { skip: true }), {
      wrapper: createWrapper([]),
    });

    // Should not be loading when skipped
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should use custom poll interval when provided', async () => {
    const mocks = [
      {
        request: {
          query: INSTANCE_HEALTH_QUERY,
          variables: { routerID, instanceID },
        },
        result: {
          data: {
            instanceHealth: {
              status: 'HEALTHY',
              processAlive: true,
              connectionStatus: 'CONNECTED',
              latencyMs: 30,
              lastHealthy: '2024-01-15T10:30:00Z',
              consecutiveFails: 0,
              uptimeSeconds: 7200,
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useInstanceHealth(routerID, instanceID, { pollInterval: 10000 }),
      {
        wrapper: createWrapper(mocks),
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});
