/**
 * Unit Tests for useVlanList Hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import * as React from 'react';
import { useVlanList } from './use-vlan-list';
import { GET_VLANS } from '@nasnet/api-client/queries';
import { ReactNode } from 'react';
import type { FC } from 'react';

// VLAN type for testing
interface VlanType {
  id: string;
  name: string;
  vlanId: number;
  interface: { id: string; name: string; type: string };
  mtu: number | null;
  comment: string | null;
  disabled: boolean;
  running: boolean;
}

// Mock data
const mockVlans = [
  {
    id: 'vlan-1',
    name: 'vlan-guest',
    vlanId: 10,
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    mtu: 1500,
    comment: 'Guest network',
    disabled: false,
    running: true,
  },
  {
    id: 'vlan-2',
    name: 'vlan-iot',
    vlanId: 20,
    interface: { id: 'bridge1', name: 'bridge1', type: 'bridge' },
    mtu: 1500,
    comment: 'IoT devices',
    disabled: false,
    running: true,
  },
  {
    id: 'vlan-3',
    name: 'vlan-management',
    vlanId: 99,
    interface: { id: 'ether1', name: 'ether1', type: 'ethernet' },
    mtu: null,
    comment: null,
    disabled: true,
    running: false,
  },
];

const mocks = [
  {
    request: {
      query: GET_VLANS,
      variables: { routerId: 'router-1', filter: undefined },
    },
    result: {
      data: {
        vlans: mockVlans,
      },
    },
  },
];

const wrapper: FC<{ children: ReactNode }> = ({ children }) =>
  React.createElement(MockedProvider, { mocks, addTypename: false }, children);

describe('useVlanList', () => {
  it('should fetch and return VLANs', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.vlans).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.vlans).toHaveLength(3);
    expect(result.current.vlans[0].name).toBe('vlan-guest');
  });

  it('should filter VLANs by search query', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Apply search filter
    act(() => {
      result.current.setSearchQuery('guest');
    });

    expect(result.current.vlans).toHaveLength(1);
    expect(result.current.vlans[0].name).toBe('vlan-guest');
  });

  it('should filter VLANs by parent interface', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Filter by bridge1
    act(() => {
      result.current.setParentInterfaceFilter('bridge1');
    });

    expect(result.current.vlans).toHaveLength(2);
    expect(result.current.vlans.every((v: VlanType) => v.interface.id === 'bridge1')).toBe(true);
  });

  it('should filter VLANs by VLAN ID range', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Filter VLAN ID 10-20
    act(() => {
      result.current.setVlanIdRangeFilter({ min: 10, max: 20 });
    });

    expect(result.current.vlans).toHaveLength(2);
    expect(result.current.vlans.every((v: VlanType) => v.vlanId >= 10 && v.vlanId <= 20)).toBe(true);
  });

  it('should handle selection toggling', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Select first VLAN
    act(() => {
      result.current.toggleSelection('vlan-1');
    });

    expect(result.current.selectedIds.has('vlan-1')).toBe(true);

    // Deselect
    act(() => {
      result.current.toggleSelection('vlan-1');
    });

    expect(result.current.selectedIds.has('vlan-1')).toBe(false);
  });

  it('should select all VLANs', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.selectAll();
    });

    expect(result.current.selectedIds.size).toBe(3);
  });

  it('should clear selection', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.selectAll();
      result.current.clearSelection();
    });

    expect(result.current.selectedIds.size).toBe(0);
  });

  it('should clear all filters', async () => {
    const { result } = renderHook(() => useVlanList('router-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Apply filters
    act(() => {
      result.current.setSearchQuery('guest');
      result.current.setParentInterfaceFilter('bridge1');
      result.current.setVlanIdRangeFilter({ min: 10, max: 20 });
    });

    // Clear all filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.parentInterfaceFilter).toBeNull();
    expect(result.current.vlanIdRangeFilter).toBeNull();
    expect(result.current.vlans).toHaveLength(3); // All VLANs visible
  });
});
