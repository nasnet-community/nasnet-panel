/**
 * useInterfaces Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInterfaces } from '../useInterfaces';
import { apiClient } from '@nasnet/api-client/core';

vi.mock('@nasnet/api-client/core', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('useInterfaces', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch and transform interface data', async () => {
    const mockResponse = {
      data: [
        {
          '.id': '*1',
          name: 'ether1',
          type: 'ether',
          'mac-address': 'AA:BB:CC:DD:EE:FF',
          running: true,
          disabled: false,
          mtu: 1500,
        },
      ],
    };

    mockApiClient.get.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useInterfaces(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: '*1',
        name: 'ether1',
        type: 'ether',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        status: 'running',
        linkStatus: 'up',
        mtu: 1500,
        comment: undefined,
      },
    ]);
  });

  it('should handle disabled interfaces', async () => {
    const mockResponse = {
      data: [
        {
          '.id': '*2',
          name: 'ether2',
          type: 'ether',
          'mac-address': '11:22:33:44:55:66',
          running: false,
          disabled: true,
        },
      ],
    };

    mockApiClient.get.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useInterfaces(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].status).toBe('disabled');
    expect(result.current.data?.[0].linkStatus).toBe('down');
  });

  it('should normalize interface types correctly', async () => {
    const mockResponse = {
      data: [
        { '.id': '*1', name: 'br0', type: 'bridge', 'mac-address': 'AA:BB:CC:DD:EE:FF', running: true },
        { '.id': '*2', name: 'vlan10', type: 'vlan', 'mac-address': '11:22:33:44:55:66', running: true },
        { '.id': '*3', name: 'wlan1', type: 'wlan', 'mac-address': '22:33:44:55:66:77', running: true },
      ],
    };

    mockApiClient.get.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useInterfaces(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].type).toBe('bridge');
    expect(result.current.data?.[1].type).toBe('vlan');
    expect(result.current.data?.[2].type).toBe('wireless');
  });

  it('should handle API errors', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useInterfaces(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network error');
  });
});
