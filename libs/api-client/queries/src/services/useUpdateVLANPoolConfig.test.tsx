/**
 * useUpdateVLANPoolConfig Hook Tests
 * Tests for VLAN pool configuration update mutation hook
 */

import { describe, it, expect } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { useUpdateVLANPoolConfig } from './useUpdateVLANPoolConfig';
import { UPDATE_VLAN_POOL_CONFIG, GET_VLAN_POOL_STATUS } from './vlan.graphql';
import type { ReactNode } from 'react';

describe('useUpdateVLANPoolConfig', () => {
  const mockUpdatedPoolStatus = {
    routerID: 'router-123',
    totalVLANs: 100,
    allocatedVLANs: 25,
    availableVLANs: 75,
    utilization: 25.0,
    shouldWarn: false,
    poolStart: 200,
    poolEnd: 299,
  };

  const mocks = [
    {
      request: {
        query: UPDATE_VLAN_POOL_CONFIG,
        variables: { poolStart: 200, poolEnd: 299 },
      },
      result: {
        data: {
          updateVLANPoolConfig: mockUpdatedPoolStatus,
        },
      },
    },
    // Refetch query mock
    {
      request: {
        query: GET_VLAN_POOL_STATUS,
        variables: {},
      },
      result: {
        data: {
          vlanPoolStatus: mockUpdatedPoolStatus,
        },
      },
    },
  ];

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );

  it('should update pool config and return new status', async () => {
    const { result } = renderHook(() => useUpdateVLANPoolConfig(), {
      wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.poolStatus).toBeUndefined();

    // Execute update
    const updatePromise = result.current.updatePoolConfig({
      poolStart: 200,
      poolEnd: 299,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    const poolStatus = await updatePromise;

    expect(poolStatus).toEqual(mockUpdatedPoolStatus);
    expect(poolStatus.poolStart).toBe(200);
    expect(poolStatus.poolEnd).toBe(299);
    expect(poolStatus.totalVLANs).toBe(100);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle validation errors from backend', async () => {
    const errorMocks = [
      {
        request: {
          query: UPDATE_VLAN_POOL_CONFIG,
          variables: { poolStart: 300, poolEnd: 200 },
        },
        error: new Error('poolStart must be <= poolEnd'),
      },
    ];

    const errorWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={errorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useUpdateVLANPoolConfig(), {
      wrapper: errorWrapper,
    });

    let error: Error | undefined;
    try {
      await result.current.updatePoolConfig({ poolStart: 300, poolEnd: 200 });
    } catch (e) {
      error = e as Error;
    }

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(error).toBeDefined();
    expect(result.current.poolStatus).toBeUndefined();
  });

  it('should handle null response gracefully', async () => {
    const nullMocks = [
      {
        request: {
          query: UPDATE_VLAN_POOL_CONFIG,
          variables: { poolStart: 200, poolEnd: 299 },
        },
        result: {
          data: {
            updateVLANPoolConfig: null,
          },
        },
      },
    ];

    const nullWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={nullMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useUpdateVLANPoolConfig(), {
      wrapper: nullWrapper,
    });

    let error: Error | undefined;
    try {
      await result.current.updatePoolConfig({ poolStart: 200, poolEnd: 299 });
    } catch (e) {
      error = e as Error;
    }

    expect(error?.message).toContain('Failed to update VLAN pool configuration');
  });

  it('should validate pool range boundaries', async () => {
    const boundaryMocks = [
      {
        request: {
          query: UPDATE_VLAN_POOL_CONFIG,
          variables: { poolStart: 1, poolEnd: 4094 },
        },
        result: {
          data: {
            updateVLANPoolConfig: {
              ...mockUpdatedPoolStatus,
              poolStart: 1,
              poolEnd: 4094,
              totalVLANs: 4094,
            },
          },
        },
      },
    ];

    const boundaryWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={boundaryMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useUpdateVLANPoolConfig(), {
      wrapper: boundaryWrapper,
    });

    const poolStatus = await result.current.updatePoolConfig({
      poolStart: 1,
      poolEnd: 4094,
    });

    expect(poolStatus.poolStart).toBe(1);
    expect(poolStatus.poolEnd).toBe(4094);
    expect(poolStatus.totalVLANs).toBe(4094);
  });

  it('should handle network errors', async () => {
    const networkErrorMocks = [
      {
        request: {
          query: UPDATE_VLAN_POOL_CONFIG,
          variables: { poolStart: 200, poolEnd: 299 },
        },
        error: new Error('Network error'),
      },
    ];

    const networkErrorWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={networkErrorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useUpdateVLANPoolConfig(), {
      wrapper: networkErrorWrapper,
    });

    let error: Error | undefined;
    try {
      await result.current.updatePoolConfig({ poolStart: 200, poolEnd: 299 });
    } catch (e) {
      error = e as Error;
    }

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(error).toBeDefined();
  });
});
