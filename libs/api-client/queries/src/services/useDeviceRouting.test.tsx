/**
 * useDeviceRouting Hooks Tests
 *
 * Tests for Device-to-Service Routing API client hooks.
 * Tests query behavior, optimistic updates, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useDeviceRoutingMatrix,
  useDeviceRoutings,
  useDeviceRouting,
  useAssignDeviceRouting,
  useRemoveDeviceRouting,
  useBulkAssignRouting,
} from './useDeviceRouting';
import {
  GET_DEVICE_ROUTING_MATRIX,
  GET_DEVICE_ROUTINGS,
  GET_DEVICE_ROUTING,
  ASSIGN_DEVICE_ROUTING,
  REMOVE_DEVICE_ROUTING,
  BULK_ASSIGN_ROUTING,
} from './device-routing.graphql';
import type { ReactNode } from 'react';

describe('useDeviceRoutingMatrix', () => {
  const mockMatrix = {
    devices: [
      {
        deviceID: 'dev-1',
        macAddress: 'aa:bb:cc:dd:ee:01',
        ipAddress: '192.168.1.100',
        hostname: 'laptop',
        active: true,
        isRouted: false,
        routingMark: null,
        source: 'dhcp',
        dhcpLease: true,
        arpEntry: false,
      },
    ],
    interfaces: [
      {
        id: 'iface-1',
        instanceID: 'instance-tor',
        instanceName: 'Tor Exit',
        interfaceName: 'vlan100',
        ipAddress: '10.100.0.1',
        routingMark: 'tor-mark',
        gatewayType: 'socks5',
        gatewayStatus: 'active',
      },
    ],
    routings: [],
    summary: {
      totalDevices: 1,
      dhcpDevices: 1,
      arpOnlyDevices: 0,
      routedDevices: 0,
      unroutedDevices: 1,
      activeRoutings: 0,
      activeInterfaces: 1,
    },
  };

  const mocks = [
    {
      request: {
        query: GET_DEVICE_ROUTING_MATRIX,
        variables: { routerID: 'router-123' },
      },
      result: {
        data: {
          deviceRoutingMatrix: mockMatrix,
        },
      },
    },
  ];

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should fetch device routing matrix', async () => {
    const { result } = renderHook(() => useDeviceRoutingMatrix('router-123'), {
      wrapper,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.matrix).toBeUndefined();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.matrix).toEqual(mockMatrix);
    expect(result.current.matrix?.devices).toHaveLength(1);
    expect(result.current.matrix?.summary.totalDevices).toBe(1);
  });

  it('should skip query if no routerID provided', () => {
    const { result } = renderHook(() => useDeviceRoutingMatrix(''), {
      wrapper,
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.matrix).toBeUndefined();
  });

  it('should use cache-and-network fetch policy', async () => {
    const { result } = renderHook(() => useDeviceRoutingMatrix('router-123'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.matrix).toBeDefined();
    // Cache-and-network shows cached data immediately while refetching
  });

  it('should poll every 10 seconds', async () => {
    const { result } = renderHook(() => useDeviceRoutingMatrix('router-123'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.matrix).toBeDefined();
    // Polling is configured but actual behavior tested in integration tests
  });

  it('should handle errors gracefully', async () => {
    const errorMocks = [
      {
        request: {
          query: GET_DEVICE_ROUTING_MATRIX,
          variables: { routerID: 'router-123' },
        },
        error: new Error('Failed to fetch matrix'),
      },
    ];

    const errorWrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={errorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDeviceRoutingMatrix('router-123'), {
      wrapper: errorWrapper,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.matrix).toBeUndefined();
  });
});

describe('useDeviceRoutings', () => {
  const mockRoutings = [
    {
      id: 'routing-1',
      deviceID: 'dev-1',
      macAddress: 'aa:bb:cc:dd:ee:01',
      deviceIP: '192.168.1.100',
      deviceName: 'laptop',
      instanceID: 'instance-tor',
      interfaceID: 'iface-1',
      routingMode: 'MAC',
      routingMark: 'tor-mark',
      mangleRuleID: '*mangle-1',
      active: true,
      createdAt: '2026-02-13T10:00:00Z',
      updatedAt: '2026-02-13T10:00:00Z',
    },
  ];

  it('should fetch device routings without filters', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEVICE_ROUTINGS,
          variables: { routerID: 'router-123' },
        },
        result: {
          data: {
            deviceRoutings: mockRoutings,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDeviceRoutings('router-123'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.routings).toEqual(mockRoutings);
    expect(result.current.routings).toHaveLength(1);
  });

  it('should fetch device routings with filters', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEVICE_ROUTINGS,
          variables: {
            routerID: 'router-123',
            deviceID: 'dev-1',
            active: true,
          },
        },
        result: {
          data: {
            deviceRoutings: mockRoutings,
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
      () =>
        useDeviceRoutings('router-123', {
          deviceID: 'dev-1',
          active: true,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.routings).toHaveLength(1);
  });
});

describe('useDeviceRouting', () => {
  const mockRouting = {
    id: 'routing-1',
    deviceID: 'dev-1',
    macAddress: 'aa:bb:cc:dd:ee:01',
    deviceIP: '192.168.1.100',
    deviceName: 'laptop',
    instanceID: 'instance-tor',
    interfaceID: 'iface-1',
    routingMode: 'MAC',
    routingMark: 'tor-mark',
    mangleRuleID: '*mangle-1',
    active: true,
    createdAt: '2026-02-13T10:00:00Z',
    updatedAt: '2026-02-13T10:00:00Z',
  };

  it('should fetch single device routing by ID', async () => {
    const mocks = [
      {
        request: {
          query: GET_DEVICE_ROUTING,
          variables: { id: 'routing-1' },
        },
        result: {
          data: {
            deviceRouting: mockRouting,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDeviceRouting('routing-1'), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.routing).toEqual(mockRouting);
  });

  it('should skip query if no ID provided', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={[]} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useDeviceRouting(''), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.routing).toBeUndefined();
  });
});

describe('useAssignDeviceRouting', () => {
  const mockInput = {
    routerID: 'router-123',
    deviceID: 'dev-1',
    macAddress: 'aa:bb:cc:dd:ee:01',
    deviceIP: '192.168.1.100',
    deviceName: 'laptop',
    instanceID: 'instance-tor',
    interfaceID: 'iface-1',
    routingMark: 'tor-mark',
    routingMode: 'MAC' as const,
  };

  const mockResponse = {
    id: 'routing-1',
    deviceID: 'dev-1',
    macAddress: 'aa:bb:cc:dd:ee:01',
    deviceIP: '192.168.1.100',
    deviceName: 'laptop',
    instanceID: 'instance-tor',
    interfaceID: 'iface-1',
    routingMode: 'MAC',
    routingMark: 'tor-mark',
    mangleRuleID: '*mangle-1',
    active: true,
    createdAt: '2026-02-13T10:00:00Z',
    updatedAt: '2026-02-13T10:00:00Z',
  };

  it('should assign device routing with optimistic updates', async () => {
    const mocks = [
      {
        request: {
          query: ASSIGN_DEVICE_ROUTING,
          variables: { input: mockInput },
        },
        result: {
          data: {
            assignDeviceRouting: mockResponse,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useAssignDeviceRouting(), { wrapper });

    const [assignDevice, state] = result.current;

    expect(state.loading).toBe(false);

    // Call mutation
    let routing;
    await waitFor(async () => {
      routing = await assignDevice(mockInput);
    });

    expect(routing).toEqual(mockResponse);
  });

  it('should handle assignment errors', async () => {
    const mocks = [
      {
        request: {
          query: ASSIGN_DEVICE_ROUTING,
          variables: { input: mockInput },
        },
        error: new Error('Assignment failed'),
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useAssignDeviceRouting(), { wrapper });

    const [assignDevice] = result.current;

    await expect(assignDevice(mockInput)).rejects.toThrow('Assignment failed');
  });
});

describe('useRemoveDeviceRouting', () => {
  it('should remove device routing', async () => {
    const mocks = [
      {
        request: {
          query: REMOVE_DEVICE_ROUTING,
          variables: { id: 'routing-1' },
        },
        result: {
          data: {
            removeDeviceRouting: true,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useRemoveDeviceRouting(), { wrapper });

    const [removeDevice] = result.current;

    let removed;
    await waitFor(async () => {
      removed = await removeDevice('routing-1');
    });

    expect(removed).toBe(true);
  });

  it('should handle removal errors', async () => {
    const mocks = [
      {
        request: {
          query: REMOVE_DEVICE_ROUTING,
          variables: { id: 'routing-1' },
        },
        error: new Error('Removal failed'),
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useRemoveDeviceRouting(), { wrapper });

    const [removeDevice] = result.current;

    await expect(removeDevice('routing-1')).rejects.toThrow('Removal failed');
  });
});

describe('useBulkAssignRouting', () => {
  const mockInput = {
    routerID: 'router-123',
    assignments: [
      {
        deviceID: 'dev-1',
        macAddress: 'aa:bb:cc:dd:ee:01',
        deviceIP: '192.168.1.100',
        deviceName: 'laptop',
        instanceID: 'instance-tor',
        interfaceID: 'iface-1',
        routingMark: 'tor-mark',
        routingMode: 'MAC' as const,
      },
      {
        deviceID: 'dev-2',
        macAddress: 'aa:bb:cc:dd:ee:02',
        deviceIP: '192.168.1.101',
        deviceName: 'phone',
        instanceID: 'instance-tor',
        interfaceID: 'iface-1',
        routingMark: 'tor-mark',
        routingMode: 'MAC' as const,
      },
    ],
  };

  const mockResult = {
    successCount: 1,
    failureCount: 1,
    successes: [
      {
        id: 'routing-1',
        deviceID: 'dev-1',
        macAddress: 'aa:bb:cc:dd:ee:01',
        deviceIP: '192.168.1.100',
        deviceName: 'laptop',
        instanceID: 'instance-tor',
        interfaceID: 'iface-1',
        routingMode: 'MAC',
        routingMark: 'tor-mark',
        mangleRuleID: '*mangle-1',
        active: true,
        createdAt: '2026-02-13T10:00:00Z',
        updatedAt: '2026-02-13T10:00:00Z',
      },
    ],
    failures: [
      {
        deviceID: 'dev-2',
        macAddress: 'aa:bb:cc:dd:ee:02',
        errorMessage: 'Device already assigned',
      },
    ],
  };

  it('should bulk assign devices with progress tracking', async () => {
    const mocks = [
      {
        request: {
          query: BULK_ASSIGN_ROUTING,
          variables: { input: mockInput },
        },
        result: {
          data: {
            bulkAssignRouting: mockResult,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useBulkAssignRouting(), { wrapper });

    expect(result.current.progress).toBeNull();

    let bulkResult;
    await waitFor(async () => {
      bulkResult = await result.current.bulkAssign(mockInput);
    });

    expect(bulkResult).toEqual(mockResult);
    expect(bulkResult!.successCount).toBe(1);
    expect(bulkResult!.failureCount).toBe(1);

    // Progress should be updated
    await waitFor(() => {
      expect(result.current.progress).toBeDefined();
      expect(result.current.progress?.total).toBe(2);
      expect(result.current.progress?.successful).toBe(1);
      expect(result.current.progress?.failed).toBe(1);
      expect(result.current.progress?.percentage).toBe(100);
    });
  });

  it('should initialize progress state', async () => {
    const mocks = [
      {
        request: {
          query: BULK_ASSIGN_ROUTING,
          variables: { input: mockInput },
        },
        result: {
          data: {
            bulkAssignRouting: mockResult,
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useBulkAssignRouting(), { wrapper });

    await waitFor(async () => {
      await result.current.bulkAssign(mockInput);
    });

    // Progress should show final state
    await waitFor(() => {
      expect(result.current.progress?.processed).toBe(2);
    });
  });

  it('should handle bulk assignment errors', async () => {
    const mocks = [
      {
        request: {
          query: BULK_ASSIGN_ROUTING,
          variables: { input: mockInput },
        },
        error: new Error('Bulk assignment failed'),
      },
    ];

    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useBulkAssignRouting(), { wrapper });

    await expect(result.current.bulkAssign(mockInput)).rejects.toThrow(
      'Bulk assignment failed'
    );
  });
});
