/**
 * useVLANAllocations Hook Tests
 * Tests for VLAN allocations query hook
 */

import { describe, it, expect } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { useVLANAllocations } from './useVLANAllocations';
import { GET_VLAN_ALLOCATIONS } from './vlan.graphql';
import type { ReactNode } from 'react';

describe('useVLANAllocations', () => {
  const mockAllocations = [
    {
      id: 'vlan-alloc-1',
      routerID: 'router-123',
      vlanID: 100,
      instanceID: 'instance-1',
      serviceType: 'tor',
      subnet: '10.99.100.0/24',
      status: 'ALLOCATED',
      allocatedAt: '2026-02-13T10:00:00Z',
      releasedAt: null,
      router: {
        id: 'router-123',
        address: '192.168.88.1',
        name: 'Main Router',
      },
      serviceInstance: {
        id: 'instance-1',
        featureID: 'tor',
        instanceName: 'Tor Exit Node',
        status: 'RUNNING',
      },
    },
    {
      id: 'vlan-alloc-2',
      routerID: 'router-123',
      vlanID: 101,
      instanceID: 'instance-2',
      serviceType: 'xray',
      subnet: '10.99.101.0/24',
      status: 'ALLOCATED',
      allocatedAt: '2026-02-13T11:00:00Z',
      releasedAt: null,
      router: {
        id: 'router-123',
        address: '192.168.88.1',
        name: 'Main Router',
      },
      serviceInstance: {
        id: 'instance-2',
        featureID: 'xray',
        instanceName: 'Xray Instance',
        status: 'RUNNING',
      },
    },
  ];

  const mocks = [
    {
      request: {
        query: GET_VLAN_ALLOCATIONS,
        variables: { routerID: 'router-123', status: undefined },
      },
      result: {
        data: {
          vlanAllocations: mockAllocations,
        },
      },
    },
    {
      request: {
        query: GET_VLAN_ALLOCATIONS,
        variables: { routerID: 'router-123', status: 'ALLOCATED' },
      },
      result: {
        data: {
          vlanAllocations: [mockAllocations[0]],
        },
      },
    },
  ];

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );

  it('should fetch all allocations for a router', async () => {
    const { result } = renderHook(
      () => useVLANAllocations('router-123'),
      { wrapper }
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.allocations).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allocations).toHaveLength(2);
    expect(result.current.allocations[0].vlanID).toBe(100);
    expect(result.current.allocations[0].serviceType).toBe('tor');
  });

  it('should filter allocations by status', async () => {
    const { result } = renderHook(
      () => useVLANAllocations('router-123', 'ALLOCATED'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.allocations).toHaveLength(1);
    expect(result.current.allocations[0].status).toBe('ALLOCATED');
  });

  it('should return empty array when no data', () => {
    const emptyMocks = [
      {
        request: {
          query: GET_VLAN_ALLOCATIONS,
          variables: { routerID: undefined, status: undefined },
        },
        result: {
          data: {
            vlanAllocations: [],
          },
        },
      },
    ];

    const emptyWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useVLANAllocations(), {
      wrapper: emptyWrapper,
    });

    expect(result.current.allocations).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_VLAN_ALLOCATIONS,
          variables: { routerID: 'router-123', status: undefined },
        },
        error: new Error('Network error'),
      },
    ];

    const errorWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={errorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(
      () => useVLANAllocations('router-123'),
      { wrapper: errorWrapper }
    );

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.allocations).toEqual([]);
  });
});
