/**
 * useConnectedDevices Hook Tests
 * Epic 5 - Story 5.4: DHCP Leases and Active Connections Display
 *
 * Comprehensive test coverage for hook that enriches DHCP lease data with:
 * - Device type detection
 * - New device tracking (30-second window)
 * - Connection duration calculation
 * - Sorting capabilities
 * - DHCP state derivation
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';

import { useConnectedDevices } from './useConnectedDevices';
import type { UseConnectedDevicesOptions } from './useConnectedDevices';
import * as dhcpQueries from '@nasnet/api-client/queries';
import type { DHCPLease, DHCPServer } from '@nasnet/core/types';
import { DeviceType } from '@nasnet/core/types';

// Mock the composed hooks
vi.mock('@nasnet/api-client/queries', () => ({
  useDHCPLeases: vi.fn(),
  useDHCPServers: vi.fn(),
}));

describe('useConnectedDevices', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-05T10:00:00Z'));

    // Default mocks
    vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // Helper to create mock lease
  const createMockLease = (overrides?: Partial<DHCPLease>): DHCPLease => ({
    id: '1',
    address: '192.168.88.105',
    macAddress: 'A4:83:E7:12:34:56',
    hostname: 'Johns-iPhone',
    status: 'bound',
    expiresAfter: '23h15m30s',
    lastSeen: new Date('2026-02-05T08:00:00Z'), // 2 hours ago
    server: 'dhcp1',
    dynamic: true,
    blocked: false,
    ...overrides,
  });

  describe('Data Enrichment (useMemo)', () => {
    it('should transform DHCPLease[] to ConnectedDeviceEnriched[]', () => {
      const lease = createMockLease();
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0]).toMatchObject({
        id: '1',
        ipAddress: '192.168.88.105',
        macAddress: 'A4:83:E7:12:34:56',
        hostname: 'Johns-iPhone',
        deviceType: DeviceType.SMARTPHONE,
      });
    });

    it('should filter to only bound status leases', () => {
      const leases = [
        createMockLease({ id: '1', status: 'bound' }),
        createMockLease({ id: '2', status: 'waiting' }),
        createMockLease({ id: '3', status: 'offered' }),
        createMockLease({ id: '4', status: 'bound' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: leases,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toHaveLength(2);
      expect(result.current.devices.map((d) => d.id)).toEqual(['1', '4']);
    });

    it('should detect device type from hostname', () => {
      const leases = [
        createMockLease({ id: '1', hostname: 'Johns-iPhone' }),
        createMockLease({ id: '2', hostname: 'Marys-MacBook-Pro' }),
        createMockLease({ id: '3', hostname: 'Desktop-PC' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: leases,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].deviceType).toBe(DeviceType.SMARTPHONE);
      expect(result.current.devices[1].deviceType).toBe(DeviceType.LAPTOP);
      expect(result.current.devices[2].deviceType).toBe(DeviceType.DESKTOP);
    });

    it('should format status labels correctly', () => {
      const lease = createMockLease({ status: 'bound' });
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].statusLabel).toBe('Connected');
    });

    it('should format expiration from RouterOS duration', () => {
      const lease = createMockLease({ expiresAfter: '23h15m30s' });
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].expiration).toBe('in 23h15m30s');
    });

    it('should calculate connection duration from lastSeen', () => {
      const lease = createMockLease({
        lastSeen: new Date('2026-02-05T08:00:00Z'), // 2 hours ago
      });

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].connectionDuration).toBe('2h 0m');
    });

    it('should handle missing hostname with fallback to Unknown', () => {
      const lease = createMockLease({ hostname: undefined });
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].hostname).toBe('Unknown');
    });

    it('should handle missing vendor as null', () => {
      const lease = createMockLease();
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].vendor).toBeNull();
    });

    it('should handle missing lastSeen', () => {
      const lease = createMockLease({ lastSeen: undefined });
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].connectionDuration).toBeDefined();
    });

    it('should preserve original _lease data', () => {
      const lease = createMockLease();
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0]._lease).toEqual(lease);
    });

    it('should detect static leases (!dynamic)', () => {
      const lease = createMockLease({ dynamic: false });
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].isStatic).toBe(true);
    });

    it('should return empty array when leases is empty', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toEqual([]);
    });

    it('should return empty array when leases is null', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toEqual([]);
    });

    it('should transform multiple leases correctly', () => {
      const leases = Array.from({ length: 5 }, (_, i) =>
        createMockLease({ id: `${i}`, macAddress: `AA:BB:CC:DD:EE:0${i}` })
      );

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: leases,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toHaveLength(5);
    });

    it('should maintain memoization stability when inputs unchanged', () => {
      const lease = createMockLease();
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      const firstDevices = result.current.devices;
      rerender();
      expect(result.current.devices).toBe(firstDevices); // Same reference
    });
  });

  describe('New Device Tracking (useRef)', () => {
    it('should not mark devices as new on first render', () => {
      const lease = createMockLease();
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].isNew).toBe(false);
    });

    it('should mark new MAC as isNew on subsequent renders', () => {
      const lease1 = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });
      const lease2 = createMockLease({ macAddress: '11:22:33:44:55:66' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [lease1],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [lease1, lease2],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].isNew).toBe(false);

      rerender();
      expect(result.current.devices.find((d) => d.macAddress === '11:22:33:44:55:66')?.isNew).toBe(
        true
      );
    });

    it('should keep existing MAC as not new', () => {
      const lease = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].isNew).toBe(false);
      rerender();
      expect(result.current.devices[0].isNew).toBe(false);
    });

    it('should handle multiple new MACs in same update', () => {
      const lease1 = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });
      const lease2 = createMockLease({ macAddress: '11:22:33:44:55:66' });
      const lease3 = createMockLease({ macAddress: '22:33:44:55:66:77' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [lease1],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [lease1, lease2, lease3],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      rerender();
      const newDevices = result.current.devices.filter((d) => d.isNew);
      expect(newDevices).toHaveLength(2);
    });

    it('should expire isNew after 30 seconds', async () => {
      const lease = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValue({
          data: [lease],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      // Add new device
      rerender();
      expect(result.current.devices[0].isNew).toBe(true);

      // Advance time by 31 seconds
      act(() => {
        vi.advanceTimersByTime(31000);
      });

      // Trigger rerender to clean up expired markers
      rerender();
      expect(result.current.devices[0].isNew).toBe(false);
    });

    it('should clean up expired new markers', () => {
      const lease = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValue({
          data: [lease],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      rerender();
      expect(result.current.devices[0].isNew).toBe(true);

      act(() => {
        vi.advanceTimersByTime(35000);
      });

      rerender();
      expect(result.current.devices[0].isNew).toBe(false);
    });

    it('should handle rapid updates', () => {
      const leases = Array.from({ length: 10 }, (_, i) =>
        createMockLease({ macAddress: `AA:BB:CC:DD:EE:0${i}` })
      );

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: leases,
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      for (let i = 0; i < 5; i++) {
        rerender();
      }

      expect(result.current.devices).toHaveLength(10);
    });

    it('should track MACs in prevMacsRef between renders', () => {
      const lease1 = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });
      const lease2 = createMockLease({ macAddress: '11:22:33:44:55:66' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [lease1],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [lease2],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].macAddress).toBe('AA:BB:CC:DD:EE:FF');
      rerender();
      expect(result.current.devices[0].macAddress).toBe('11:22:33:44:55:66');
      expect(result.current.devices[0].isNew).toBe(true);
    });

    it('should maintain timestamps in newMacsRef', () => {
      const lease = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValue({
          data: [lease],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      rerender();
      expect(result.current.devices[0].isNew).toBe(true);

      act(() => {
        vi.advanceTimersByTime(15000); // 15 seconds
      });

      rerender();
      expect(result.current.devices[0].isNew).toBe(true); // Still new
    });

    it('should not mark device as new if reconnects within 30s', () => {
      const lease = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [lease],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [lease],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].isNew).toBe(false);
      rerender(); // Disconnects
      rerender(); // Reconnects
      expect(result.current.devices[0].isNew).toBe(false);
    });

    it('should mark device as new if reconnects after 30s', () => {
      const lease = createMockLease({ macAddress: 'AA:BB:CC:DD:EE:FF' });

      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [lease],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [lease],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      rerender(); // Disconnects

      act(() => {
        vi.advanceTimersByTime(35000); // 35 seconds
      });

      rerender(); // Reconnects
      expect(result.current.devices[0].isNew).toBe(true);
    });
  });

  describe('Sorting Options', () => {
    const createDevicesForSort = () => [
      createMockLease({
        id: '1',
        hostname: 'Zebra-Phone',
        address: '192.168.88.100',
        lastSeen: new Date('2026-02-05T09:00:00Z'),
      }),
      createMockLease({
        id: '2',
        hostname: 'Alpha-Laptop',
        address: '192.168.88.10',
        lastSeen: new Date('2026-02-05T08:00:00Z'),
      }),
      createMockLease({
        id: '3',
        hostname: 'Beta-Desktop',
        address: '192.168.88.200',
        lastSeen: new Date('2026-02-05T07:00:00Z'),
      }),
    ];

    it('should sort by hostname (ascending alphabetical)', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: createDevicesForSort(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'hostname' }),
        { wrapper }
      );

      expect(result.current.devices.map((d) => d.hostname)).toEqual([
        'Alpha-Laptop',
        'Beta-Desktop',
        'Zebra-Phone',
      ]);
    });

    it('should sort hostname case-insensitively', () => {
      const devices = [
        createMockLease({ id: '1', hostname: 'zebra' }),
        createMockLease({ id: '2', hostname: 'Alpha' }),
        createMockLease({ id: '3', hostname: 'BETA' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: devices,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'hostname' }),
        { wrapper }
      );

      expect(result.current.devices.map((d) => d.hostname)).toEqual(['Alpha', 'BETA', 'zebra']);
    });

    it('should sort by IP address correctly', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: createDevicesForSort(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1', { sortBy: 'ip' }), {
        wrapper,
      });

      expect(result.current.devices.map((d) => d.ipAddress)).toEqual([
        '192.168.88.10',
        '192.168.88.100',
        '192.168.88.200',
      ]);
    });

    it('should handle IP sorting across all octets', () => {
      const devices = [
        createMockLease({ address: '192.168.88.100' }),
        createMockLease({ address: '192.168.88.10' }),
        createMockLease({ address: '192.168.88.200' }),
        createMockLease({ address: '192.168.88.5' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: devices,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1', { sortBy: 'ip' }), {
        wrapper,
      });

      expect(result.current.devices.map((d) => d.ipAddress)).toEqual([
        '192.168.88.5',
        '192.168.88.10',
        '192.168.88.100',
        '192.168.88.200',
      ]);
    });

    it('should sort by recent (newest first)', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: createDevicesForSort(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'recent' }),
        { wrapper }
      );

      expect(result.current.devices.map((d) => d.id)).toEqual(['1', '2', '3']);
    });

    it('should sort by duration (longest connected first)', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: createDevicesForSort(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'duration' }),
        { wrapper }
      );

      expect(result.current.devices.map((d) => d.id)).toEqual(['3', '2', '1']);
    });

    it('should default to duration sort when sortBy is undefined', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: createDevicesForSort(),
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), { wrapper });

      expect(result.current.devices.map((d) => d.id)).toEqual(['3', '2', '1']);
    });

    it('should create new array for sorting (immutability)', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: createDevicesForSort(),
        isLoading: false,
        error: null,
      } as any);

      const { result: result1 } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'hostname' }),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'ip' }),
        { wrapper }
      );

      expect(result1.current.devices).not.toBe(result2.current.devices);
    });

    it('should not crash with empty array sorting', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'hostname' }),
        { wrapper }
      );

      expect(result.current.devices).toEqual([]);
    });

    it('should handle single device array sorting', () => {
      const device = createMockLease();
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [device],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'hostname' }),
        { wrapper }
      );

      expect(result.current.devices).toHaveLength(1);
    });

    it('should handle large array sorting (100+ devices)', () => {
      const devices = Array.from({ length: 150 }, (_, i) =>
        createMockLease({
          id: `${i}`,
          hostname: `Device-${i}`,
          address: `192.168.88.${i % 255}`,
        })
      );

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: devices,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'hostname' }),
        { wrapper }
      );

      expect(result.current.devices).toHaveLength(150);
    });
  });

  describe('DHCP State Derivation', () => {
    it('should set isDhcpEnabled=true when any server not disabled', () => {
      const servers: DHCPServer[] = [
        { id: '1', name: 'dhcp1', disabled: false, interface: 'bridge' },
        { id: '2', name: 'dhcp2', disabled: true, interface: 'ether1' },
      ];

      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: servers,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isDhcpEnabled).toBe(true);
    });

    it('should set isDhcpEnabled=false when all servers disabled', () => {
      const servers: DHCPServer[] = [
        { id: '1', name: 'dhcp1', disabled: true, interface: 'bridge' },
        { id: '2', name: 'dhcp2', disabled: true, interface: 'ether1' },
      ];

      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: servers,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isDhcpEnabled).toBe(false);
    });

    it('should set isDhcpEnabled=false when no servers', () => {
      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isDhcpEnabled).toBe(false);
    });

    it('should set isDhcpEnabled=false when servers is null', () => {
      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isDhcpEnabled).toBe(false);
    });

    it('should set isEmpty=true when not loading and no devices', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isEmpty).toBe(true);
    });

    it('should set isEmpty=false when loading', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isEmpty).toBe(false);
    });

    it('should set isEmpty=false when devices present', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [createMockLease()],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isEmpty).toBe(false);
    });

    it('should set totalCount matching devices.length', () => {
      const devices = Array.from({ length: 12 }, (_, i) => createMockLease({ id: `${i}` }));

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: devices,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.totalCount).toBe(12);
      expect(result.current.totalCount).toBe(result.current.devices.length);
    });
  });

  describe('Error Handling', () => {
    it('should propagate useDHCPLeases error', () => {
      const error = new Error('Connection timeout');
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.error).toBe(error);
    });

    it('should not crash when useDHCPServers errors', () => {
      const error = new Error('Server error');
      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isDhcpEnabled).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return empty devices on error', () => {
      const error = new Error('Network error');
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: undefined,
        isLoading: false,
        error,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });

    it('should calculate isDhcpEnabled even when leases error', () => {
      const servers: DHCPServer[] = [
        { id: '1', name: 'dhcp1', disabled: false, interface: 'bridge' },
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Lease error'),
      } as any);

      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: servers,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isDhcpEnabled).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should set isLoading=true during initial load', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading=false when data loaded', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [createMockLease()],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('lastUpdated Timestamp', () => {
    it('should return current Date when data available', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [createMockLease()],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.lastUpdated).toBeInstanceOf(Date);
      expect(result.current.lastUpdated?.getTime()).toBeCloseTo(
        new Date('2026-02-05T10:00:00Z').getTime(),
        -3
      );
    });

    it('should return null when no data', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle device with all null fields', () => {
      const lease = createMockLease({
        hostname: undefined,
        expiresAfter: undefined,
        lastSeen: undefined,
      });

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].hostname).toBe('Unknown');
      expect(result.current.devices[0].expiration).toBe('Never');
      expect(result.current.devices[0].connectionDuration).toBeDefined();
    });

    it('should handle extremely long hostname', () => {
      const longHostname = 'A'.repeat(200);
      const lease = createMockLease({ hostname: longHostname });

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].hostname).toBe(longHostname);
    });

    it('should handle unicode characters in hostname', () => {
      const lease = createMockLease({ hostname: 'iPhone-✨🎉' });

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: [lease],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].hostname).toBe('iPhone-✨🎉');
    });

    it('should handle duplicate MACs in lease list', () => {
      const leases = [
        createMockLease({ id: '1', macAddress: 'AA:BB:CC:DD:EE:FF' }),
        createMockLease({ id: '2', macAddress: 'AA:BB:CC:DD:EE:FF' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: leases,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toHaveLength(2);
    });

    it('should handle mixed status leases and filter correctly', () => {
      const leases = [
        createMockLease({ id: '1', status: 'bound' }),
        createMockLease({ id: '2', status: 'waiting' }),
        createMockLease({ id: '3', status: 'offered' }),
        createMockLease({ id: '4', status: 'busy' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: leases,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0].id).toBe('1');
    });
  });

  describe('Integration with Composed Hooks', () => {
    it('should call useDHCPLeases with correct routerIp', () => {
      const spy = vi.mocked(dhcpQueries.useDHCPLeases);

      renderHook(() => useConnectedDevices('192.168.88.1'), { wrapper });

      expect(spy).toHaveBeenCalledWith('192.168.88.1');
    });

    it('should call useDHCPServers with correct routerIp', () => {
      const spy = vi.mocked(dhcpQueries.useDHCPServers);

      renderHook(() => useConnectedDevices('192.168.88.1'), { wrapper });

      expect(spy).toHaveBeenCalledWith('192.168.88.1');
    });

    it('should react to useDHCPLeases data changes', () => {
      vi.mocked(dhcpQueries.useDHCPLeases)
        .mockReturnValueOnce({
          data: [createMockLease({ id: '1' })],
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: [createMockLease({ id: '2' })],
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.devices[0].id).toBe('1');
      rerender();
      expect(result.current.devices[0].id).toBe('2');
    });

    it('should react to useDHCPServers data changes', () => {
      const servers1: DHCPServer[] = [
        { id: '1', name: 'dhcp1', disabled: true, interface: 'bridge' },
      ];
      const servers2: DHCPServer[] = [
        { id: '1', name: 'dhcp1', disabled: false, interface: 'bridge' },
      ];

      vi.mocked(dhcpQueries.useDHCPServers)
        .mockReturnValueOnce({
          data: servers1,
          isLoading: false,
          error: null,
        } as any)
        .mockReturnValueOnce({
          data: servers2,
          isLoading: false,
          error: null,
        } as any);

      const { result, rerender } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isDhcpEnabled).toBe(false);
      rerender();
      expect(result.current.isDhcpEnabled).toBe(true);
    });

    it('should handle both hooks loading simultaneously', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle one hook erroring, other succeeding', () => {
      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Lease error'),
      } as any);

      vi.mocked(dhcpQueries.useDHCPServers).mockReturnValue({
        data: [{ id: '1', name: 'dhcp1', disabled: false, interface: 'bridge' }],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useConnectedDevices('192.168.88.1'), {
        wrapper,
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.isDhcpEnabled).toBe(true);
    });

    it('should pass sortBy option correctly', () => {
      const devices = [
        createMockLease({ hostname: 'Zebra' }),
        createMockLease({ hostname: 'Alpha' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: devices,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(
        () => useConnectedDevices('192.168.88.1', { sortBy: 'hostname' }),
        { wrapper }
      );

      expect(result.current.devices[0].hostname).toBe('Alpha');
    });

    it('should trigger re-sort when sortBy option changes', () => {
      const devices = [
        createMockLease({ hostname: 'Zebra', address: '192.168.88.10' }),
        createMockLease({ hostname: 'Alpha', address: '192.168.88.100' }),
      ];

      vi.mocked(dhcpQueries.useDHCPLeases).mockReturnValue({
        data: devices,
        isLoading: false,
        error: null,
      } as any);

      const { result, rerender } = renderHook(
        ({ sortBy }: UseConnectedDevicesOptions) => useConnectedDevices('192.168.88.1', { sortBy }),
        { wrapper, initialProps: { sortBy: 'hostname' as const } }
      );

      expect(result.current.devices[0].hostname).toBe('Alpha');

      rerender({ sortBy: 'ip' as const });
      expect(result.current.devices[0].ipAddress).toBe('192.168.88.10');
    });
  });
});
