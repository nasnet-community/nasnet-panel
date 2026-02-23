/**
 * Tests for Kill Switch API Client Hooks (NAS-8.14)
 */

import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  useKillSwitchStatus,
  useSetKillSwitch,
  useKillSwitchSubscription,
} from './useKillSwitch';
import {
  GET_KILL_SWITCH_STATUS,
  SET_KILL_SWITCH,
  SUBSCRIBE_KILL_SWITCH_CHANGES,
} from './kill-switch.graphql';
import type { KillSwitchStatus, DeviceRouting } from '@nasnet/api-client/generated/types';

describe('useKillSwitchStatus', () => {
  it('should fetch kill switch status successfully', async () => {
    const mockStatus: KillSwitchStatus = {
      enabled: true,
      mode: 'BLOCK_ALL',
      active: false,
      fallbackInterfaceID: null,
      lastActivatedAt: null,
      lastDeactivatedAt: null,
      lastActivationReason: null,
      activationCount: 0,
    };

    const mocks = [
      {
        request: {
          query: GET_KILL_SWITCH_STATUS,
          variables: {
            routerID: 'router-1',
            deviceID: 'device-123',
          },
        },
        result: {
          data: {
            killSwitchStatus: mockStatus,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(
      () => useKillSwitchStatus('router-1', 'device-123'),
      { wrapper }
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toEqual(mockStatus);
    expect(result.current.error).toBeUndefined();
  });

  it('should skip query when routerId or deviceId is missing', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={[]} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useKillSwitchStatus('', ''), {
      wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    const mocks = [
      {
        request: {
          query: GET_KILL_SWITCH_STATUS,
          variables: {
            routerID: 'router-1',
            deviceID: 'device-123',
          },
        },
        error: new Error('Network error'),
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(
      () => useKillSwitchStatus('router-1', 'device-123'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.status).toBeUndefined();
  });
});

describe('useSetKillSwitch', () => {
  it('should enable kill switch with BLOCK_ALL mode', async () => {
    const mockRouting: DeviceRouting = {
      id: 'routing-1',
      deviceID: 'device-123',
      macAddress: '00:1A:2B:3C:4D:5E',
      deviceIP: '192.168.1.100',
      deviceName: 'iPhone',
      instanceID: 'instance-tor',
      interfaceID: 'vif-tor',
      routingMode: 'MAC',
      routingMark: 'tor-exit',
      mangleRuleID: 'mangle-1',
      active: true,
      killSwitchEnabled: true,
      killSwitchMode: 'BLOCK_ALL',
      killSwitchActive: false,
      killSwitchActivatedAt: null,
      killSwitchFallbackInterfaceID: null,
      killSwitchRuleID: 'filter-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      hasSchedules: false,
      schedules: [],
    };

    const mocks = [
      {
        request: {
          query: SET_KILL_SWITCH,
          variables: {
            input: {
              routerID: 'router-1',
              deviceID: 'device-123',
              enabled: true,
              mode: 'BLOCK_ALL',
            },
          },
        },
        result: {
          data: {
            setKillSwitch: mockRouting,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useSetKillSwitch(), { wrapper });

    const [setKillSwitch] = result.current;

    const routing = await setKillSwitch({
      routerID: 'router-1',
      deviceID: 'device-123',
      enabled: true,
      mode: 'BLOCK_ALL',
    });

    await waitFor(() => {
      expect(routing).toEqual(mockRouting);
    });
  });

  it('should enable kill switch with FALLBACK_SERVICE mode', async () => {
    const mockRouting: DeviceRouting = {
      id: 'routing-1',
      deviceID: 'device-123',
      macAddress: '00:1A:2B:3C:4D:5E',
      deviceIP: '192.168.1.100',
      deviceName: 'iPhone',
      instanceID: 'instance-tor',
      interfaceID: 'vif-tor',
      routingMode: 'MAC',
      routingMark: 'tor-exit',
      mangleRuleID: 'mangle-1',
      active: true,
      killSwitchEnabled: true,
      killSwitchMode: 'FALLBACK_SERVICE',
      killSwitchActive: false,
      killSwitchActivatedAt: null,
      killSwitchFallbackInterfaceID: 'vif-backup',
      killSwitchRuleID: 'filter-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      hasSchedules: false,
      schedules: [],
    };

    const mocks = [
      {
        request: {
          query: SET_KILL_SWITCH,
          variables: {
            input: {
              routerID: 'router-1',
              deviceID: 'device-123',
              enabled: true,
              mode: 'FALLBACK_SERVICE',
              fallbackInterfaceID: 'vif-backup',
            },
          },
        },
        result: {
          data: {
            setKillSwitch: mockRouting,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useSetKillSwitch(), { wrapper });

    const [setKillSwitch] = result.current;

    const routing = await setKillSwitch({
      routerID: 'router-1',
      deviceID: 'device-123',
      enabled: true,
      mode: 'FALLBACK_SERVICE',
      fallbackInterfaceID: 'vif-backup',
    });

    await waitFor(() => {
      expect(routing).toEqual(mockRouting);
    });
  });

  it('should disable kill switch', async () => {
    const mockRouting: DeviceRouting = {
      id: 'routing-1',
      deviceID: 'device-123',
      macAddress: '00:1A:2B:3C:4D:5E',
      deviceIP: '192.168.1.100',
      deviceName: 'iPhone',
      instanceID: 'instance-tor',
      interfaceID: 'vif-tor',
      routingMode: 'MAC',
      routingMark: 'tor-exit',
      mangleRuleID: 'mangle-1',
      active: true,
      killSwitchEnabled: false,
      killSwitchMode: 'BLOCK_ALL',
      killSwitchActive: false,
      killSwitchActivatedAt: null,
      killSwitchFallbackInterfaceID: null,
      killSwitchRuleID: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      hasSchedules: false,
      schedules: [],
    };

    const mocks = [
      {
        request: {
          query: SET_KILL_SWITCH,
          variables: {
            input: {
              routerID: 'router-1',
              deviceID: 'device-123',
              enabled: false,
              mode: 'BLOCK_ALL',
            },
          },
        },
        result: {
          data: {
            setKillSwitch: mockRouting,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useSetKillSwitch(), { wrapper });

    const [setKillSwitch] = result.current;

    const routing = await setKillSwitch({
      routerID: 'router-1',
      deviceID: 'device-123',
      enabled: false,
      mode: 'BLOCK_ALL',
    });

    await waitFor(() => {
      expect(routing).toEqual(mockRouting);
    });
  });

  it('should handle mutation errors', async () => {
    const mocks = [
      {
        request: {
          query: SET_KILL_SWITCH,
          variables: {
            input: {
              routerID: 'router-1',
              deviceID: 'device-123',
              enabled: true,
              mode: 'BLOCK_ALL',
            },
          },
        },
        error: new Error('Failed to set kill switch'),
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useSetKillSwitch(), { wrapper });

    const [setKillSwitch] = result.current;

    await expect(
      setKillSwitch({
        routerID: 'router-1',
        deviceID: 'device-123',
        enabled: true,
        mode: 'BLOCK_ALL',
      })
    ).rejects.toThrow();
  });
});

describe('useKillSwitchSubscription', () => {
  it('should skip subscription when routerId is missing', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={[]} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useKillSwitchSubscription(''), {
      wrapper,
    });

    expect(result.current.event).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  // Note: Full subscription testing requires a more complex setup
  // with WebSocket mocking. For now, we test the basic hook behavior.
});
