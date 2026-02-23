/**
 * useCleanupOrphanedVLANs Hook Tests
 * Tests for orphaned VLAN cleanup mutation hook
 */

import { describe, it, expect } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { useCleanupOrphanedVLANs } from './useCleanupOrphanedVLANs';
import {
  CLEANUP_ORPHANED_VLANS,
  GET_VLAN_ALLOCATIONS,
  GET_VLAN_POOL_STATUS,
} from './vlan.graphql';
import type { ReactNode } from 'react';
import * as React from 'react';

describe('useCleanupOrphanedVLANs', () => {
  const mocks = [
    {
      request: {
        query: CLEANUP_ORPHANED_VLANS,
        variables: { routerID: 'router-123' },
      },
      result: {
        data: {
          cleanupOrphanedVLANs: 3,
        },
      },
    },
    // Refetch queries mocks
    {
      request: {
        query: GET_VLAN_ALLOCATIONS,
        variables: {},
      },
      result: {
        data: {
          vlanAllocations: [],
        },
      },
    },
    {
      request: {
        query: GET_VLAN_POOL_STATUS,
        variables: {},
      },
      result: {
        data: {
          vlanPoolStatus: {
            routerID: 'router-123',
            totalVLANs: 100,
            allocatedVLANs: 22,
            availableVLANs: 78,
            utilization: 22.0,
            shouldWarn: false,
            poolStart: 100,
            poolEnd: 199,
          },
        },
      },
    },
  ];

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(MockedProvider, { mocks, addTypename: false }, children);

  it('should execute cleanup mutation and return count', async () => {
    const { result } = renderHook(() => useCleanupOrphanedVLANs(), {
      wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.cleanupCount).toBeUndefined();

    // Execute cleanup
    const cleanupPromise = result.current.cleanupOrphanedVLANs('router-123');

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    const count = await cleanupPromise;

    expect(count).toBe(3);
    expect(result.current.cleanupCount).toBe(3);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle zero orphans gracefully', async () => {
    const zeroMocks = [
      {
        request: {
          query: CLEANUP_ORPHANED_VLANS,
          variables: { routerID: 'router-123' },
        },
        result: {
          data: {
            cleanupOrphanedVLANs: 0,
          },
        },
      },
    ];

    const zeroWrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(MockedProvider, { mocks: zeroMocks, addTypename: false }, children);

    const { result } = renderHook(() => useCleanupOrphanedVLANs(), {
      wrapper: zeroWrapper,
    });

    const count = await result.current.cleanupOrphanedVLANs('router-123');

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(count).toBe(0);
    expect(result.current.cleanupCount).toBe(0);
  });

  it('should handle mutation errors', async () => {
    const errorMocks = [
      {
        request: {
          query: CLEANUP_ORPHANED_VLANS,
          variables: { routerID: 'router-123' },
        },
        error: new Error('Cleanup failed'),
      },
    ];

    const errorWrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(MockedProvider, { mocks: errorMocks, addTypename: false }, children);

    const { result } = renderHook(() => useCleanupOrphanedVLANs(), {
      wrapper: errorWrapper,
    });

    let error: Error | undefined;
    try {
      await result.current.cleanupOrphanedVLANs('router-123');
    } catch (e) {
      error = e as Error;
    }

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(error).toBeDefined();
    expect(result.current.cleanupCount).toBeUndefined();
  });

  it('should return 0 if mutation returns null', async () => {
    const nullMocks = [
      {
        request: {
          query: CLEANUP_ORPHANED_VLANS,
          variables: { routerID: 'router-123' },
        },
        result: {
          data: {
            cleanupOrphanedVLANs: null,
          },
        },
      },
    ];

    const nullWrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(MockedProvider, { mocks: nullMocks, addTypename: false }, children);

    const { result } = renderHook(() => useCleanupOrphanedVLANs(), {
      wrapper: nullWrapper,
    });

    const count = await result.current.cleanupOrphanedVLANs('router-123');

    expect(count).toBe(0);
  });
});
