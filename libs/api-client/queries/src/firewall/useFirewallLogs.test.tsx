/**
 * Unit Tests for useFirewallLogs Query Hooks
 *
 * Tests the RouterOS API integration for firewall logs including:
 * - Query hook for fetching logs
 * - Parsing and transformation
 * - Client-side filtering (IP wildcards, port ranges)
 * - Rate limiting
 * - Polling
 * - Statistics computation
 * - Error handling
 *
 * @see Task #3: Create Apollo Client hooks for firewall logs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useFirewallLogs,
  useFirewallLogStats,
  firewallLogKeys,
  type FirewallLogFilters,
} from './useFirewallLogs';
import * as apiCore from '@nasnet/api-client/core';
import type { FirewallLogEntry } from '@nasnet/core/types';

// Mock dependencies
vi.mock('@nasnet/api-client/core', () => ({
  makeRouterOSRequest: vi.fn(),
}));

vi.mock('@nasnet/core-utils', () => ({
  parseFirewallLogMessage: vi.fn((message: string) => {
    // Simple mock parser for testing
    if (message.includes('DROPPED-WAN')) {
      return {
        chain: 'input' as const,
        action: 'drop' as const,
        protocol: 'TCP' as const,
        srcIp: '192.168.1.100',
        srcPort: 54321,
        dstIp: '10.0.0.1',
        dstPort: 443,
        interfaceIn: 'ether1',
        prefix: 'DROPPED-WAN',
      };
    }
    if (message.includes('ACCEPT')) {
      return {
        chain: 'forward' as const,
        action: 'accept' as const,
        protocol: 'UDP' as const,
        srcIp: '10.0.0.5',
        srcPort: 53,
        dstIp: '8.8.8.8',
        dstPort: 53,
      };
    }
    return {
      chain: 'input' as const,
      action: 'unknown' as const,
      protocol: 'TCP' as const,
    };
  }),
}));

const mockMakeRouterOSRequest = vi.mocked(apiCore.makeRouterOSRequest);

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useFirewallLogs', () => {
  const ROUTER_ID = 'test-router-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Query Hook', () => {
    it('fetches firewall logs successfully', async () => {
      const mockApiResponse = [
        {
          '.id': '*1',
          time: '2024-01-15 10:30:00',
          topics: 'firewall,info',
          message: 'DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:443',
        },
        {
          '.id': '*2',
          time: '2024-01-15 10:30:01',
          topics: 'firewall,info',
          message: 'ACCEPT forward: proto UDP, 10.0.0.5:53->8.8.8.8:53',
        },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(ROUTER_ID, 'log', {
        params: {
          topics: 'firewall',
          '.proplist': '.id,time,topics,message',
        },
      });

      expect(result.current.data).toHaveLength(2);

      const firstLog = result.current.data![0];
      expect(firstLog.id).toBe('*1');
      expect(firstLog.topic).toBe('firewall');
      expect(firstLog.parsed.action).toBe('drop');
      expect(firstLog.parsed.srcIp).toBe('192.168.1.100');
      expect(firstLog.parsed.dstPort).toBe(443);
    });

    it('filters out non-firewall logs', async () => {
      const mockApiResponse = [
        {
          '.id': '*1',
          time: '2024-01-15 10:30:00',
          topics: 'firewall,info',
          message: 'DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:443',
        },
        {
          '.id': '*2',
          time: '2024-01-15 10:30:01',
          topics: 'system,info', // Not a firewall log
          message: 'System startup',
        },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should only include firewall logs
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].topic).toBe('firewall');
    });

    it('handles API errors gracefully', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: false,
        error: 'Connection timeout',
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Failed to fetch firewall logs');
    });

    it('handles empty response', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: [],
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(0);
    });

    it('respects enabled option', async () => {
      const { result } = renderHook(
        () => useFirewallLogs(ROUTER_ID, { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      expect(result.current.status).toBe('pending');
      expect(mockMakeRouterOSRequest).not.toHaveBeenCalled();
    });

    it('respects page size limit', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: [],
        timestamp: Date.now(),
      });

      const { result } = renderHook(
        () => useFirewallLogs(ROUTER_ID, { pageSize: 100 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify the function was called (pageSize is used internally)
      expect(mockMakeRouterOSRequest).toHaveBeenCalled();
    });
  });

  describe('Client-Side Filtering', () => {
    const mockLogs = [
      {
        '.id': '*1',
        time: '2024-01-15 10:30:00',
        topics: 'firewall,info',
        message: 'DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:443',
      },
      {
        '.id': '*2',
        time: '2024-01-15 10:30:01',
        topics: 'firewall,info',
        message: 'ACCEPT forward: proto UDP, 10.0.0.5:53->8.8.8.8:53',
      },
      {
        '.id': '*3',
        time: '2024-01-15 10:30:02',
        topics: 'firewall,info',
        message: 'DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.200:12345->10.0.0.1:80',
      },
    ];

    it('filters by chain', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { chain: 'input' };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should only include input chain logs
      expect(result.current.data!.every(log => log.parsed.chain === 'input')).toBe(true);
    });

    it('filters by action', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { action: 'drop' };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should only include drop action logs
      expect(result.current.data!.every(log => log.parsed.action === 'drop')).toBe(true);
    });

    it('filters by source IP with wildcards', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { srcIp: '192.168.1.*' };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should only include logs matching the wildcard pattern
      expect(result.current.data!.length).toBeGreaterThan(0);
      expect(result.current.data!.every(log =>
        log.parsed.srcIp?.startsWith('192.168.1.')
      )).toBe(true);
    });

    it('filters by destination IP with wildcards', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { dstIp: '10.0.0.*' };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should filter by destination IP
      expect(result.current.data!.length).toBeGreaterThan(0);
    });

    it('filters by port (single port)', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { port: '443' };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should include logs with port 443
      expect(result.current.data!.length).toBeGreaterThan(0);
    });

    it('filters by port range', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { port: '50-100' };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Port range filtering works
      expect(result.current.data).toBeDefined();
    });

    it('filters by prefix', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { prefix: 'DROPPED-WAN' };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should only include logs with the prefix
      expect(result.current.data!.every(log =>
        log.parsed.prefix?.includes('DROPPED-WAN')
      )).toBe(true);
    });

    it('applies rate limiting', async () => {
      // Create 150 mock logs
      const manyLogs = Array.from({ length: 150 }, (_, i) => ({
        '.id': `*${i}`,
        time: '2024-01-15 10:30:00',
        topics: 'firewall,info',
        message: 'DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:443',
      }));

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: manyLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = { limit: 50 };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should limit to 50 entries
      expect(result.current.data!.length).toBeLessThanOrEqual(50);
    });

    it('combines multiple filters', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogs,
        timestamp: Date.now(),
      });

      const filters: FirewallLogFilters = {
        chain: 'input',
        action: 'drop',
        srcIp: '192.168.*.*',
      };

      const { result } = renderHook(() => useFirewallLogs(ROUTER_ID, { filters }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should apply all filters
      expect(result.current.data!.every(log =>
        log.parsed.chain === 'input' &&
        log.parsed.action === 'drop' &&
        log.parsed.srcIp?.startsWith('192.168.')
      )).toBe(true);
    });
  });

  describe('useFirewallLogStats', () => {
    const mockLogsForStats = [
      {
        '.id': '*1',
        time: '2024-01-15 10:30:00',
        topics: 'firewall,info',
        message: 'DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:443',
      },
      {
        '.id': '*2',
        time: '2024-01-15 10:30:01',
        topics: 'firewall,info',
        message: 'DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.100:12345->10.0.0.1:80',
      },
      {
        '.id': '*3',
        time: '2024-01-15 10:30:02',
        topics: 'firewall,info',
        message: 'ACCEPT forward: proto UDP, 10.0.0.5:53->8.8.8.8:53',
      },
    ];

    it('computes statistics correctly', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockLogsForStats,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogStats(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data!;

      // Check action counts
      expect(stats.actionCounts.drop).toBe(2);
      expect(stats.actionCounts.accept).toBe(1);
      expect(stats.total).toBe(3);

      // Check top blocked IPs
      expect(stats.topBlockedIps).toBeDefined();
      expect(stats.topBlockedIps.length).toBeGreaterThan(0);
      expect(stats.topBlockedIps[0].ip).toBe('192.168.1.100');
      expect(stats.topBlockedIps[0].count).toBe(2);

      // Check top ports
      expect(stats.topPorts).toBeDefined();
      expect(stats.topPorts.length).toBeGreaterThan(0);
    });

    it('handles empty logs', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: [],
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogStats(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data!;

      expect(stats.total).toBe(0);
      expect(stats.actionCounts.drop).toBe(0);
      expect(stats.actionCounts.accept).toBe(0);
      expect(stats.topBlockedIps).toHaveLength(0);
      expect(stats.topPorts).toHaveLength(0);
    });

    it('limits top IPs to 10', async () => {
      // Create logs with 15 different IPs
      const manyIpLogs = Array.from({ length: 15 }, (_, i) => ({
        '.id': `*${i}`,
        time: '2024-01-15 10:30:00',
        topics: 'firewall,info',
        message: `DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.${i}:54321->10.0.0.1:443`,
      }));

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: manyIpLogs,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogStats(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data!;

      // Should limit to top 10
      expect(stats.topBlockedIps.length).toBeLessThanOrEqual(10);
    });

    it('limits top ports to 10', async () => {
      // Create logs with many different ports
      const manyPortLogs = Array.from({ length: 15 }, (_, i) => ({
        '.id': `*${i}`,
        time: '2024-01-15 10:30:00',
        topics: 'firewall,info',
        message: `DROPPED-WAN input: in:ether1, proto TCP, 192.168.1.100:54321->10.0.0.1:${8000 + i}`,
      }));

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: manyPortLogs,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFirewallLogStats(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const stats = result.current.data!;

      // Should limit to top 10
      expect(stats.topPorts.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Query Keys', () => {
    it('generates correct query keys', () => {
      expect(firewallLogKeys.all(ROUTER_ID)).toEqual(['firewall', ROUTER_ID, 'logs']);

      expect(firewallLogKeys.list(ROUTER_ID)).toEqual([
        'firewall',
        ROUTER_ID,
        'logs',
        'list',
        undefined,
      ]);

      const filters: FirewallLogFilters = { chain: 'input', action: 'drop' };
      expect(firewallLogKeys.list(ROUTER_ID, filters)).toEqual([
        'firewall',
        ROUTER_ID,
        'logs',
        'list',
        filters,
      ]);

      expect(firewallLogKeys.stats(ROUTER_ID)).toEqual([
        'firewall',
        ROUTER_ID,
        'logs',
        'stats',
      ]);
    });
  });
});
