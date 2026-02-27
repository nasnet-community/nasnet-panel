/**
 * useInterfaces Hook Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import type { ReactNode } from 'react';
import { useInterfaces } from './useInterfaces';
import { GET_INTERFACES, INTERFACE_STATUS_SUBSCRIPTION } from './queries';
import type { InterfaceGridData } from './types';

const mockInterface: InterfaceGridData = {
  id: '1',
  name: 'ether1',
  type: 'ethernet',
  status: 'up',
  ip: '192.168.1.1',
  mac: 'AA:BB:CC:DD:EE:FF',
  mtu: 1500,
  running: true,
  txRate: 1000000,
  rxRate: 5000000,
  linkSpeed: '1Gbps',
  comment: 'WAN',
  usedBy: [],
};

const mockInterface2: InterfaceGridData = {
  id: '2',
  name: 'wlan1',
  type: 'wireless',
  status: 'up',
  ip: '10.0.0.1',
  mac: '11:22:33:44:55:66',
  mtu: 1500,
  running: true,
  txRate: 500000,
  rxRate: 2000000,
  usedBy: [],
};

describe('useInterfaces', () => {
  it('returns loading state initially', async () => {
    const mocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            device: {
              id: 'device-1',
              interfaces: [],
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useInterfaces({ deviceId: 'device-1' }), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.interfaces).toEqual([]);
  });

  it('returns interfaces from query when no subscription', async () => {
    const mocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            device: {
              id: 'device-1',
              interfaces: [mockInterface],
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useInterfaces({ deviceId: 'device-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.interfaces).toHaveLength(1);
    expect(result.current.interfaces[0].name).toBe('ether1');
  });

  it('returns interfaces from subscription when available', async () => {
    const mocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            device: {
              id: 'device-1',
              interfaces: [],
            },
          },
        },
      },
      {
        request: {
          query: INTERFACE_STATUS_SUBSCRIPTION,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            interfaceStatusChanged: [mockInterface, mockInterface2],
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useInterfaces({ deviceId: 'device-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.interfaces).toHaveLength(2);
    });

    expect(result.current.interfaces[0].name).toBe('ether1');
    expect(result.current.interfaces[1].name).toBe('wlan1');
  });

  it('sorts interfaces by type priority', async () => {
    const vpnInterface: InterfaceGridData = {
      ...mockInterface,
      id: '3',
      name: 'wg1',
      type: 'vpn',
    };

    const mocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            device: {
              id: 'device-1',
              interfaces: [vpnInterface, mockInterface2, mockInterface],
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useInterfaces({ deviceId: 'device-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.interfaces).toHaveLength(3);
    });

    // ethernet (priority 1), wireless (priority 3), vpn (priority 4)
    expect(result.current.interfaces[0].type).toBe('ethernet');
    expect(result.current.interfaces[1].type).toBe('wireless');
    expect(result.current.interfaces[2].type).toBe('vpn');
  });

  it('returns error state on query failure', async () => {
    const errorMessage = 'Network error';
    const mocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        error: new Error(errorMessage),
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useInterfaces({ deviceId: 'device-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toContain(errorMessage);
  });

  it('provides refetch function', async () => {
    const mocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            device: {
              id: 'device-1',
              interfaces: [mockInterface],
            },
          },
        },
      },
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            device: {
              id: 'device-1',
              interfaces: [mockInterface, mockInterface2],
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useInterfaces({ deviceId: 'device-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.interfaces).toHaveLength(1);
    });

    // Trigger refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.interfaces).toHaveLength(2);
    });
  });

  it('handles empty interface list', async () => {
    const mocks = [
      {
        request: {
          query: GET_INTERFACES,
          variables: { deviceId: 'device-1' },
        },
        result: {
          data: {
            device: {
              id: 'device-1',
              interfaces: [],
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useInterfaces({ deviceId: 'device-1' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.interfaces).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
