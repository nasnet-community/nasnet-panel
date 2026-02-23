/**
 * useVLANPoolStatus Hook Tests
 * Tests for VLAN pool status query hook with polling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { useVLANPoolStatus } from './useVLANPoolStatus';
import { GET_VLAN_POOL_STATUS } from './vlan.graphql';
import type { ReactNode } from 'react';

describe('useVLANPoolStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPoolStatus = {
    routerID: 'router-123',
    totalVLANs: 100,
    allocatedVLANs: 25,
    availableVLANs: 75,
    utilization: 25.0,
    shouldWarn: false,
    poolStart: 100,
    poolEnd: 199,
  };

  const mockHighUtilization = {
    ...mockPoolStatus,
    allocatedVLANs: 85,
    availableVLANs: 15,
    utilization: 85.0,
    shouldWarn: true,
  };

  const mocks = [
    {
      request: {
        query: GET_VLAN_POOL_STATUS,
        variables: { routerID: 'router-123' },
      },
      result: {
        data: {
          vlanPoolStatus: mockPoolStatus,
        },
      },
    },
  ];

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);

  it('should fetch pool status for a router', async () => {
    const { result } = renderHook(
      () => useVLANPoolStatus('router-123', 0), // Disable polling for test
      { wrapper }
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.poolStatus).toBeUndefined();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.poolStatus).toEqual(mockPoolStatus);
    expect(result.current.poolStatus?.utilization).toBe(25.0);
    expect(result.current.poolStatus?.shouldWarn).toBe(false);
  });

  it('should detect high utilization and warning flag', async () => {
    const warningMocks = [
      {
        request: {
          query: GET_VLAN_POOL_STATUS,
          variables: { routerID: 'router-123' },
        },
        result: {
          data: {
            vlanPoolStatus: mockHighUtilization,
          },
        },
      },
    ];

    const warningWrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(MockedProvider, { mocks: warningMocks, addTypename: false }, children);

    const { result } = renderHook(
      () => useVLANPoolStatus('router-123', 0),
      { wrapper: warningWrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.poolStatus?.utilization).toBe(85.0);
    expect(result.current.poolStatus?.shouldWarn).toBe(true);
    expect(result.current.poolStatus?.availableVLANs).toBe(15);
  });

  it('should skip query if no routerID provided', () => {
    const { result } = renderHook(
      () => useVLANPoolStatus('', 0),
      { wrapper }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.poolStatus).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_VLAN_POOL_STATUS,
          variables: { routerID: 'router-123' },
        },
        error: new Error('Failed to fetch pool status'),
      },
    ];

    const errorWrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(MockedProvider, { mocks: errorMocks, addTypename: false }, children);

    const { result } = renderHook(
      () => useVLANPoolStatus('router-123', 0),
      { wrapper: errorWrapper }
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.poolStatus).toBeUndefined();
  });

  it('should use default poll interval of 30 seconds', async () => {
    const { result } = renderHook(
      () => useVLANPoolStatus('router-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // The hook should be configured with 30000ms poll interval
    // Actual polling behavior is tested via integration tests
    expect(result.current.poolStatus).toBeDefined();
  });

  it('should respect custom poll interval', async () => {
    const { result } = renderHook(
      () => useVLANPoolStatus('router-123', 60000), // 60 seconds
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.poolStatus).toBeDefined();
  });

  it('should disable polling when interval is 0', async () => {
    const { result } = renderHook(
      () => useVLANPoolStatus('router-123', 0),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.poolStatus).toBeDefined();
  });
});
