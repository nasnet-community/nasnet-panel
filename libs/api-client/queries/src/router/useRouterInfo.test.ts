/**
 * useRouterInfo Hook Tests
 * Tests for router information query hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouterInfo, useRouterResource, routerKeys } from './useRouterInfo';
import { apiClient } from '@nasnet/api-client/core';
import type { SystemResource } from '@nasnet/core/types/router';
import * as React from 'react';

// Mock the API client
vi.mock('@nasnet/api-client/core', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('useRouterInfo', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('Query Keys', () => {
    it('should have correct query key structure', () => {
      const testIp = '192.168.1.1';
      expect(routerKeys.all).toEqual(['router']);
      expect(routerKeys.resource(testIp)).toEqual(['router', 'resource', testIp]);
      expect(routerKeys.info(testIp)).toEqual(['router', 'info', testIp]);
      expect(routerKeys.routerboard(testIp)).toEqual(['router', 'routerboard', testIp]);
    });
  });

  describe('useRouterInfo Hook', () => {
    const testRouterIp = '192.168.1.1';

    it('should fetch and combine system resource and identity data', async () => {
      const mockResource = {
        uptime: '3d4h25m12s',
        cpuLoad: 25,
        freeMemory: 536870912,
        totalMemory: 1073741824,
        freeHddSpace: 10737418240,
        totalHddSpace: 21474836480,
        architecture: 'arm64',
        boardName: 'RB4011iGS+5HacQ2HnD',
        version: '7.14.2',
        platform: 'MikroTik',
      };

      const mockIdentity = {
        name: 'MainRouter',
      };

      // Mock both API calls
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockResource })
        .mockResolvedValueOnce({ data: mockIdentity });

      const { result } = renderHook(() => useRouterInfo(testRouterIp), { wrapper });

      // Wait for the query to settle
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the combined data structure
      expect(result.current.data).toEqual({
        identity: 'MainRouter',
        model: 'RB4011iGS+5HacQ2HnD',
        routerOsVersion: '7.14.2',
        cpuArchitecture: 'arm64',
        uptime: '3d4h25m12s',
      });
    });

    it('should handle API errors correctly', async () => {
      const mockError = new Error('Network error');

      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useRouterInfo(testRouterIp), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });

    it('should use correct query key', () => {
      renderHook(() => useRouterInfo(testRouterIp), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      const infoQuery = queries.find((q) => JSON.stringify(q.queryKey) === JSON.stringify(routerKeys.info(testRouterIp)));

      expect(infoQuery).toBeDefined();
    });

    it('should have correct staleTime configuration (60000ms)', () => {
      const { result } = renderHook(() => useRouterInfo(testRouterIp), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      const infoQuery = queries.find((q) => JSON.stringify(q.queryKey) === JSON.stringify(routerKeys.info(testRouterIp)));

      expect((infoQuery?.options as any)?.staleTime).toBe(60000);
    });
  });

  describe('useRouterResource Hook', () => {
    const testRouterIp = '192.168.1.1';

    it('should fetch system resource data', async () => {
      const mockResource: SystemResource = {
        uptime: '5d2h15m30s',
        cpuLoad: 45,
        freeMemory: 268435456,
        totalMemory: 536870912,
        freeHddSpace: 5368709120,
        totalHddSpace: 10737418240,
        architecture: 'arm',
        boardName: 'hAP ac2',
        version: '7.15.0',
        platform: 'MikroTik',
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResource });

      const { result } = renderHook(() => useRouterResource(testRouterIp), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResource);
    });

    it('should have polling configuration (5000ms refetch interval)', () => {
      const { result } = renderHook(() => useRouterResource(testRouterIp), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      const resourceQuery = queries.find((q) =>
        JSON.stringify(q.queryKey) === JSON.stringify(routerKeys.resource(testRouterIp))
      );

      expect((resourceQuery?.options as any)?.refetchInterval).toBe(5000);
    });

    it('should not refetch in background when tab is hidden', () => {
      const { result } = renderHook(() => useRouterResource(testRouterIp), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      const resourceQuery = queries.find((q) =>
        JSON.stringify(q.queryKey) === JSON.stringify(routerKeys.resource(testRouterIp))
      );

      expect((resourceQuery?.options as any)?.refetchIntervalInBackground).toBe(false);
    });

    it('should have correct staleTime (5000ms)', () => {
      const { result } = renderHook(() => useRouterResource(testRouterIp), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      const resourceQuery = queries.find((q) =>
        JSON.stringify(q.queryKey) === JSON.stringify(routerKeys.resource(testRouterIp))
      );

      expect((resourceQuery?.options as any)?.staleTime).toBe(5000);
    });
  });
});
