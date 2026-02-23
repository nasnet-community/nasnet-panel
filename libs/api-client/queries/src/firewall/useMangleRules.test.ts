/**
 * Firewall Mangle Rules Query and Mutation Hooks Tests
 *
 * Tests for useMangleRules hooks including:
 * - Query hooks with data fetching and caching
 * - Mutation hooks with optimistic updates
 * - Cache invalidation strategies
 * - Error handling
 *
 * @see useMangleRules.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, createElement } from 'react';
import {
  useMangleRules,
  useCreateMangleRule,
  useUpdateMangleRule,
  useDeleteMangleRule,
  useMoveMangleRule,
  useToggleMangleRule,
  mangleRulesKeys,
} from './useMangleRules';
import * as apiClient from '@nasnet/api-client/core';
import type { MangleRule } from '@nasnet/core/types';

// Mock the API client
vi.mock('@nasnet/api-client/core', () => ({
  makeRouterOSRequest: vi.fn(),
}));

const mockMakeRouterOSRequest = vi.mocked(apiClient.makeRouterOSRequest);

// Test utilities
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// Mock data
const mockRawRule = {
  '.id': '*1',
  chain: 'prerouting',
  action: 'mark-connection',
  protocol: 'tcp',
  'dst-port': '80,443',
  'connection-state': 'new',
  'new-connection-mark': 'web_traffic',
  passthrough: 'yes',
  comment: 'Mark web traffic',
  disabled: 'false',
  packets: '1234',
  bytes: '567890',
};

const mockMangleRule: MangleRule = {
  id: '*1',
  chain: 'prerouting',
  action: 'mark-connection',
  position: 0,
  protocol: 'tcp',
  dstPort: '80,443',
  connectionState: ['new'],
  newConnectionMark: 'web_traffic',
  passthrough: true,
  comment: 'Mark web traffic',
  disabled: false,
  log: false,
  packets: 1234,
  bytes: 567890,
};

describe('mangleRulesKeys', () => {
  it('generates correct query key hierarchy', () => {
    const routerId = 'router-123';
    const allKey = mangleRulesKeys.all(routerId);
    const chainKey = mangleRulesKeys.byChain(routerId, 'prerouting');

    expect(allKey).toEqual(['mangle', routerId]);
    expect(chainKey).toEqual(['mangle', routerId, 'prerouting']);
  });
});

describe('useMangleRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('fetches mangle rules successfully', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: [mockRawRule],
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMangleRules('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe('*1');
    expect(result.current.data![0].chain).toBe('prerouting');
    expect(result.current.data![0].newConnectionMark).toBe('web_traffic');
    expect(mockMakeRouterOSRequest).toHaveBeenCalledWith('router-123', 'ip/firewall/mangle');
  });

  it('filters rules by chain', async () => {
    const forwardRule = { ...mockRawRule, '.id': '*2', chain: 'forward' };

    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: [mockRawRule, forwardRule],
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMangleRules('router-123', { chain: 'prerouting' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].chain).toBe('prerouting');
  });

  it('handles empty response', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: [],
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMangleRules('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('handles API error', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: false,
      error: 'Connection failed',
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMangleRules('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toContain('Connection failed');
  });

  it('can be disabled via enabled option', () => {
    const { result } = renderHook(() => useMangleRules('router-123', { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockMakeRouterOSRequest).not.toHaveBeenCalled();
  });

  it('transforms raw API data correctly', async () => {
    const rawRuleWithAllFields = {
      '.id': '*1',
      chain: 'prerouting',
      action: 'mark-packet',
      protocol: 'udp',
      'src-address': '192.168.1.0/24',
      'dst-address': '10.0.0.1',
      'src-port': '1024-65535',
      'dst-port': '53',
      'connection-state': 'established,related',
      'connection-mark': 'existing_mark',
      'new-packet-mark': 'dns_traffic',
      passthrough: 'no',
      disabled: 'true',
      log: 'yes',
      'log-prefix': 'DNS: ',
    };

    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: [rawRuleWithAllFields],
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMangleRules('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const rule = result.current.data![0];
    expect(rule.srcAddress).toBe('192.168.1.0/24');
    expect(rule.dstAddress).toBe('10.0.0.1');
    expect(rule.srcPort).toBe('1024-65535');
    expect(rule.dstPort).toBe('53');
    expect(rule.connectionState).toEqual(['established', 'related']);
    expect(rule.connectionMark).toBe('existing_mark');
    expect(rule.newPacketMark).toBe('dns_traffic');
    expect(rule.passthrough).toBe(false);
    expect(rule.disabled).toBe(true);
    expect(rule.log).toBe(true);
    expect(rule.logPrefix).toBe('DNS: ');
  });

  it('defaults passthrough to true when undefined', async () => {
    const ruleWithoutPassthrough = { ...mockRawRule };
    delete (ruleWithoutPassthrough as any).passthrough;

    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: [ruleWithoutPassthrough],
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMangleRules('router-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].passthrough).toBe(true);
  });
});

describe('useCreateMangleRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates mangle rule successfully', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: { ret: '*2' },
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useCreateMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    const newRule: Partial<MangleRule> = {
      chain: 'forward',
      action: 'mark-packet',
      newPacketMark: 'test_mark',
      passthrough: true,
    };

    await result.current.mutateAsync(newRule);

    expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
      'router-123',
      'ip/firewall/mangle/add',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          chain: 'forward',
          action: 'mark-packet',
          'new-packet-mark': 'test_mark',
          passthrough: 'yes',
        }),
      })
    );
  });

  it('transforms camelCase to hyphenated keys', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useCreateMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    const rule: Partial<MangleRule> = {
      chain: 'prerouting',
      action: 'mark-connection',
      srcAddress: '192.168.1.0/24',
      dstPort: '80',
      newConnectionMark: 'web',
      connectionState: ['new'],
    };

    await result.current.mutateAsync(rule);

    const callArgs = mockMakeRouterOSRequest.mock.calls[0];
    const body = callArgs[2]?.body as Record<string, string>;

    expect(body['src-address']).toBe('192.168.1.0/24');
    expect(body['dst-port']).toBe('80');
    expect(body['new-connection-mark']).toBe('web');
    expect(body['connection-state']).toBe('new');
  });

  it('handles creation error', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: false,
      error: 'Invalid chain',
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useCreateMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        chain: 'invalid' as any,
        action: 'accept',
      })
    ).rejects.toThrow('Invalid chain');
  });

  it('invalidates query cache on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useCreateMangleRule('router-123'), { wrapper });

    await result.current.mutateAsync({
      chain: 'prerouting',
      action: 'accept',
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mangleRulesKeys.all('router-123'),
    });
  });
});

describe('useUpdateMangleRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates mangle rule successfully', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useUpdateMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      ruleId: '*1',
      updates: {
        disabled: true,
        comment: 'Updated comment',
      },
    });

    expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
      'router-123',
      'ip/firewall/mangle/set',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          '.id': '*1',
          disabled: 'true',
          comment: 'Updated comment',
        }),
      })
    );
  });

  it('handles update error', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: false,
      error: 'Rule not found',
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useUpdateMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        ruleId: '*999',
        updates: { disabled: true },
      })
    ).rejects.toThrow('Rule not found');
  });

  it('invalidates query cache on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useUpdateMangleRule('router-123'), { wrapper });

    await result.current.mutateAsync({
      ruleId: '*1',
      updates: { disabled: true },
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mangleRulesKeys.all('router-123'),
    });
  });
});

describe('useDeleteMangleRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes mangle rule successfully', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useDeleteMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync('*1');

    expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
      'router-123',
      'ip/firewall/mangle/remove',
      expect.objectContaining({
        method: 'POST',
        body: { '.id': '*1' },
      })
    );
  });

  it('handles delete error', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: false,
      error: 'Cannot delete rule',
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useDeleteMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync('*1')).rejects.toThrow('Cannot delete rule');
  });

  it('invalidates query cache on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useDeleteMangleRule('router-123'), { wrapper });

    await result.current.mutateAsync('*1');

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mangleRulesKeys.all('router-123'),
    });
  });
});

describe('useMoveMangleRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves mangle rule successfully', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMoveMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      ruleId: '*1',
      destination: 3,
    });

    expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
      'router-123',
      'ip/firewall/mangle/move',
      expect.objectContaining({
        method: 'POST',
        body: {
          '.id': '*1',
          destination: '3',
        },
      })
    );
  });

  it('handles move error', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: false,
      error: 'Invalid destination',
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useMoveMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        ruleId: '*1',
        destination: 999,
      })
    ).rejects.toThrow('Invalid destination');
  });

  it('invalidates query cache on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    const { result } = renderHook(() => useMoveMangleRule('router-123'), { wrapper });

    await result.current.mutateAsync({
      ruleId: '*1',
      destination: 2,
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: mangleRulesKeys.all('router-123'),
    });
  });
});

describe('useToggleMangleRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles rule disabled state', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useToggleMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      ruleId: '*1',
      disabled: true,
    });

    expect(mockMakeRouterOSRequest).toHaveBeenCalledWith(
      'router-123',
      'ip/firewall/mangle/set',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          '.id': '*1',
          disabled: 'true',
        }),
      })
    );
  });

  it('is a convenience wrapper around useUpdateMangleRule', async () => {
    mockMakeRouterOSRequest.mockResolvedValue({
      success: true,
      data: {},
      timestamp: Date.now(),
    });

    const { result } = renderHook(() => useToggleMangleRule('router-123'), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync({
      ruleId: '*1',
      disabled: false,
    });

    const callArgs = mockMakeRouterOSRequest.mock.calls[0];
    const body = callArgs[2]?.body as Record<string, string>;

    expect(body['.id']).toBe('*1');
    expect(body.disabled).toBe('false');
  });
});
