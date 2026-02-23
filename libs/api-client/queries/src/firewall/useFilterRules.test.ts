/**
 * Unit Tests for useFilterRules Query and Mutation Hooks
 *
 * Tests the RouterOS API integration for filter rules including:
 * - Query hook for fetching rules
 * - Transform functions (API ↔ TypeScript)
 * - Mutation hooks (create, update, delete, move, toggle)
 * - Cache invalidation
 * - Error handling
 *
 * @see NAS-7.1: Implement Firewall Filter Rules
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import * as React from 'react';
import {
  useFilterRules,
  useCreateFilterRule,
  useUpdateFilterRule,
  useDeleteFilterRule,
  useMoveFilterRule,
  useToggleFilterRule,
  firewallKeys,
} from './useFilterRules';
import * as apiCore from '@nasnet/api-client/core';
import type { FilterRule } from '@nasnet/core/types';

// Mock makeRouterOSRequest
vi.mock('@nasnet/api-client/core', () => ({
  makeRouterOSRequest: vi.fn(),
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

  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useFilterRules', () => {
  const ROUTER_ID = 'test-router-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Query Hook', () => {
    it('fetches filter rules successfully', async () => {
      const mockApiResponse = [
        {
          '.id': '*1',
          chain: 'input',
          action: 'accept',
          protocol: 'tcp',
          'dst-port': '22',
          disabled: 'false',
          comment: 'Allow SSH',
        },
        {
          '.id': '*2',
          chain: 'forward',
          action: 'drop',
          protocol: 'udp',
          disabled: 'true',
        },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(ROUTER_ID, 'ip/firewall/filter');
      expect(result.current.data).toHaveLength(2);

      const firstRule = result.current.data![0];
      expect(firstRule.id).toBe('*1');
      expect(firstRule.chain).toBe('input');
      expect(firstRule.action).toBe('accept');
      expect(firstRule.protocol).toBe('tcp');
      expect(firstRule.dstPort).toBe('22');
      expect(firstRule.disabled).toBe(false);
      expect(firstRule.comment).toBe('Allow SSH');
    });

    it('filters rules by chain when specified', async () => {
      const mockApiResponse = [
        { '.id': '*1', chain: 'input', action: 'accept' },
        { '.id': '*2', chain: 'forward', action: 'drop' },
        { '.id': '*3', chain: 'input', action: 'reject' },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(
        () => useFilterRules(ROUTER_ID, { chain: 'input' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Should only return rules with chain='input'
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].chain).toBe('input');
      expect(result.current.data![1].chain).toBe('input');
    });

    it('handles empty rule list', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: [],
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('handles API errors', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: false,
        error: 'Connection timeout',
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Connection timeout');
    });

    it('can be disabled via enabled option', () => {
      const { result } = renderHook(
        () => useFilterRules(ROUTER_ID, { enabled: false }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isFetching).toBe(false);
      expect(mockMakeRouterOSRequest).not.toHaveBeenCalled();
    });

    it('uses correct query key hierarchy', () => {
      const allKey = firewallKeys.all(ROUTER_ID);
      const filterKey = firewallKeys.filter(ROUTER_ID);
      const filterChainKey = firewallKeys.filter(ROUTER_ID, 'input');

      expect(allKey).toEqual(['firewall', ROUTER_ID]);
      expect(filterKey).toEqual(['firewall', ROUTER_ID, 'filter', undefined]);
      expect(filterChainKey).toEqual(['firewall', ROUTER_ID, 'filter', 'input']);
    });
  });

  describe('Transform Functions', () => {
    it('transforms hyphenated API keys to camelCase', async () => {
      const mockApiResponse = [
        {
          '.id': '*1',
          chain: 'input',
          action: 'accept',
          'src-address': '192.168.1.0/24',
          'dst-address': '10.0.0.1',
          'src-port': '1024-65535',
          'dst-port': '80,443',
          'in-interface': 'ether1',
          'out-interface': 'ether2',
          'src-address-list': 'trusted',
          'dst-address-list': 'blocked',
          'in-interface-list': 'WAN',
          'out-interface-list': 'LAN',
          'connection-state': 'established,related',
          'log-prefix': 'FIREWALL: ',
        },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const rule = result.current.data![0];
      expect(rule.srcAddress).toBe('192.168.1.0/24');
      expect(rule.dstAddress).toBe('10.0.0.1');
      expect(rule.srcPort).toBe('1024-65535');
      expect(rule.dstPort).toBe('80,443');
      expect(rule.inInterface).toBe('ether1');
      expect(rule.outInterface).toBe('ether2');
      expect(rule.srcAddressList).toBe('trusted');
      expect(rule.dstAddressList).toBe('blocked');
      expect(rule.inInterfaceList).toBe('WAN');
      expect(rule.outInterfaceList).toBe('LAN');
      expect(rule.logPrefix).toBe('FIREWALL: ');
    });

    it('parses comma-separated connection-state to array', async () => {
      const mockApiResponse = [
        {
          '.id': '*1',
          chain: 'input',
          action: 'accept',
          'connection-state': 'established,related,new',
        },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const rule = result.current.data![0];
      expect(rule.connectionState).toEqual(['established', 'related', 'new']);
    });

    it('converts string booleans to actual booleans', async () => {
      const mockApiResponse = [
        { '.id': '*1', chain: 'input', action: 'accept', disabled: 'true', log: 'yes' },
        { '.id': '*2', chain: 'input', action: 'drop', disabled: 'false', log: 'no' },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data![0].disabled).toBe(true);
      expect(result.current.data![0].log).toBe(true);
      expect(result.current.data![1].disabled).toBe(false);
      expect(result.current.data![1].log).toBe(false);
    });

    it('converts string counters to numbers', async () => {
      const mockApiResponse = [
        {
          '.id': '*1',
          chain: 'input',
          action: 'accept',
          packets: '1234567',
          bytes: '987654321',
        },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const rule = result.current.data![0];
      expect(rule.packets).toBe(1234567);
      expect(rule.bytes).toBe(987654321);
    });

    it('assigns order based on array index', async () => {
      const mockApiResponse = [
        { '.id': '*1', chain: 'input', action: 'accept' },
        { '.id': '*2', chain: 'input', action: 'drop' },
        { '.id': '*3', chain: 'input', action: 'reject' },
      ];

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: mockApiResponse,
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useFilterRules(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data![0].order).toBe(0);
      expect(result.current.data![1].order).toBe(1);
      expect(result.current.data![2].order).toBe(2);
    });
  });

  describe('useCreateFilterRule', () => {
    it('creates a new filter rule', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: { '.id': '*NEW' },
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useCreateFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      const newRule: Partial<FilterRule> = {
        chain: 'input',
        action: 'accept',
        protocol: 'tcp',
        dstPort: '22',
        comment: 'Allow SSH',
      };

      await result.current.mutateAsync(newRule);

      expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
        ROUTER_ID,
        'ip/firewall/filter/add',
        {
          method: 'POST',
          body: expect.objectContaining({
            chain: 'input',
            action: 'accept',
            protocol: 'tcp',
            'dst-port': '22',
            comment: 'Allow SSH',
          }),
        }
      );
    });

    it('transforms TypeScript fields to RouterOS API format', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useCreateFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      const newRule: Partial<FilterRule> = {
        chain: 'forward',
        action: 'drop',
        srcAddress: '192.168.1.0/24',
        dstAddress: '10.0.0.1',
        inInterface: 'ether1',
        outInterface: 'ether2',
        connectionState: ['established', 'related'],
        log: true,
        logPrefix: 'DROP: ',
        disabled: false,
      };

      await result.current.mutateAsync(newRule);

      const callArgs = mockMakeRouterOSRequest.mock.calls[0];
      const body = callArgs[2]?.body as Record<string, string>;

      expect(body['src-address']).toBe('192.168.1.0/24');
      expect(body['dst-address']).toBe('10.0.0.1');
      expect(body['in-interface']).toBe('ether1');
      expect(body['out-interface']).toBe('ether2');
      expect(body['connection-state']).toBe('established,related');
      expect(body.log).toBe('yes');
      expect(body['log-prefix']).toBe('DROP: ');
      expect(body.disabled).toBe('false');
    });

    it('handles creation errors', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: false,
        error: 'Invalid rule configuration',
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useCreateFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ chain: 'input', action: 'accept' })
      ).rejects.toThrow('Invalid rule configuration');
    });

    it('invalidates cache on success', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const wrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

      const { result } = renderHook(() => useCreateFilterRule(ROUTER_ID), { wrapper });

      await result.current.mutateAsync({ chain: 'input', action: 'accept' });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: firewallKeys.all(ROUTER_ID),
        });
      });
    });
  });

  describe('useUpdateFilterRule', () => {
    it('updates an existing filter rule', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useUpdateFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      const updates: Partial<FilterRule> = {
        comment: 'Updated comment',
        disabled: true,
      };

      await result.current.mutateAsync({ ruleId: '*1', updates });

      expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
        ROUTER_ID,
        'ip/firewall/filter/set',
        {
          method: 'POST',
          body: expect.objectContaining({
            '.id': '*1',
            comment: 'Updated comment',
            disabled: 'true',
          }),
        }
      );
    });

    it('handles update errors', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: false,
        error: 'Rule not found',
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useUpdateFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({ ruleId: '*999', updates: { comment: 'test' } })
      ).rejects.toThrow('Rule not found');
    });
  });

  describe('useDeleteFilterRule', () => {
    it('deletes a filter rule', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useDeleteFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync('*1');

      expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
        ROUTER_ID,
        'ip/firewall/filter/remove',
        {
          method: 'POST',
          body: { '.id': '*1' },
        }
      );
    });

    it('handles delete errors', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: false,
        error: 'Cannot delete rule',
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useDeleteFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await expect(result.current.mutateAsync('*1')).rejects.toThrow('Cannot delete rule');
    });
  });

  describe('useMoveFilterRule', () => {
    it('moves a filter rule to new position', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useMoveFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ ruleId: '*3', destination: 0 });

      expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
        ROUTER_ID,
        'ip/firewall/filter/move',
        {
          method: 'POST',
          body: {
            '.id': '*3',
            destination: '0',
          },
        }
      );
    });

    it('converts destination to string', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useMoveFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ ruleId: '*1', destination: 5 });

      const callArgs = mockMakeRouterOSRequest.mock.calls[0];
      const body = callArgs[2]?.body as any;

      expect(body.destination).toBe('5');
      expect(typeof body.destination).toBe('string');
    });
  });

  describe('useToggleFilterRule', () => {
    it('toggles rule disabled state', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useToggleFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ ruleId: '*1', disabled: true });

      expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
        ROUTER_ID,
        'ip/firewall/filter/set',
        {
          method: 'POST',
          body: expect.objectContaining({
            '.id': '*1',
            disabled: 'true',
          }),
        }
      );
    });

    it('can enable a disabled rule', async () => {
      mockMakeRouterOSRequest.mockResolvedValueOnce({
        success: true,
        data: {},
        timestamp: Date.now(),
      });

      const { result } = renderHook(() => useToggleFilterRule(ROUTER_ID), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ ruleId: '*2', disabled: false });

      const callArgs = mockMakeRouterOSRequest.mock.calls[0];
      const body = callArgs[2]?.body as Record<string, string>;

      expect(body.disabled).toBe('false');
    });
  });
});
