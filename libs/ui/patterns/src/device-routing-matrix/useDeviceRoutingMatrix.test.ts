/**
 * useDeviceRoutingMatrix Hook Tests
 *
 * Unit tests for the headless DeviceRoutingMatrix hook.
 * Tests selection state, filtering, and action handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeviceRoutingMatrix } from './useDeviceRoutingMatrix';
import type {
  DeviceRoutingMatrixData,
  DeviceRoutingActions,
  NetworkDevice,
  VirtualInterfaceInfo,
  DeviceRouting,
} from './types';

// Mock data fixtures
const mockDevices: NetworkDevice[] = [
  {
    deviceID: 'dev-1',
    macAddress: 'aa:bb:cc:dd:ee:01',
    ipAddress: '192.168.1.100',
    hostname: 'laptop',
    active: true,
    isRouted: false,
    source: 'dhcp',
    dhcpLease: true,
    arpEntry: false,
  },
  {
    deviceID: 'dev-2',
    macAddress: 'aa:bb:cc:dd:ee:02',
    ipAddress: '192.168.1.101',
    hostname: 'phone',
    active: true,
    isRouted: true,
    routingMark: 'tor-mark',
    source: 'both',
    dhcpLease: true,
    arpEntry: true,
  },
  {
    deviceID: 'dev-3',
    macAddress: 'aa:bb:cc:dd:ee:03',
    ipAddress: '192.168.1.102',
    hostname: 'tablet',
    active: true,
    isRouted: false,
    source: 'arp',
    dhcpLease: false,
    arpEntry: true,
  },
];

const mockInterfaces: VirtualInterfaceInfo[] = [
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
  {
    id: 'iface-2',
    instanceID: 'instance-xray',
    instanceName: 'Xray',
    interfaceName: 'vlan101',
    ipAddress: '10.101.0.1',
    routingMark: 'xray-mark',
    gatewayType: 'socks5',
    gatewayStatus: 'up',
  },
  {
    id: 'iface-3',
    instanceID: 'instance-singbox',
    instanceName: 'Sing-box',
    interfaceName: 'vlan102',
    ipAddress: '10.102.0.1',
    routingMark: 'singbox-mark',
    gatewayType: 'socks5',
    gatewayStatus: 'down',
  },
];

const mockRoutings: DeviceRouting[] = [
  {
    id: 'routing-1',
    deviceID: 'dev-2',
    macAddress: 'aa:bb:cc:dd:ee:02',
    deviceIP: '192.168.1.101',
    deviceName: 'phone',
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

const mockMatrix: DeviceRoutingMatrixData = {
  devices: mockDevices,
  interfaces: mockInterfaces,
  routings: mockRoutings,
  summary: {
    totalDevices: 3,
    dhcpDevices: 2,
    arpOnlyDevices: 1,
    routedDevices: 1,
    unroutedDevices: 2,
    activeRoutings: 1,
    activeInterfaces: 2,
  },
};

const mockActions: DeviceRoutingActions = {
  onAssign: vi.fn().mockResolvedValue(undefined),
  onRemove: vi.fn().mockResolvedValue(undefined),
  onBulkAssign: vi.fn().mockResolvedValue(undefined),
};

describe('useDeviceRoutingMatrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Selection State', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      expect(result.current.selectedDevices.size).toBe(0);
      expect(result.current.selectionCount).toBe(0);
      expect(result.current.isDeviceSelected('dev-1')).toBe(false);
    });

    it('should toggle device selection', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Select device
      act(() => {
        result.current.toggleSelection('dev-1');
      });

      expect(result.current.isDeviceSelected('dev-1')).toBe(true);
      expect(result.current.selectionCount).toBe(1);

      // Deselect device
      act(() => {
        result.current.toggleSelection('dev-1');
      });

      expect(result.current.isDeviceSelected('dev-1')).toBe(false);
      expect(result.current.selectionCount).toBe(0);
    });

    it('should select all devices', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectionCount).toBe(3);
      expect(result.current.isDeviceSelected('dev-1')).toBe(true);
      expect(result.current.isDeviceSelected('dev-2')).toBe(true);
      expect(result.current.isDeviceSelected('dev-3')).toBe(true);
    });

    it('should clear all selections', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Select some devices
      act(() => {
        result.current.toggleSelection('dev-1');
        result.current.toggleSelection('dev-2');
      });

      expect(result.current.selectionCount).toBe(2);

      // Clear all
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectionCount).toBe(0);
      expect(result.current.isDeviceSelected('dev-1')).toBe(false);
      expect(result.current.isDeviceSelected('dev-2')).toBe(false);
    });

    it('should handle range selection with shift+click', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Select first device (no shift)
      act(() => {
        result.current.toggleSelection('dev-1', false);
      });

      // Select third device with shift (should select range dev-1, dev-2, dev-3)
      act(() => {
        result.current.toggleSelection('dev-3', true);
      });

      expect(result.current.selectionCount).toBe(3);
      expect(result.current.isDeviceSelected('dev-1')).toBe(true);
      expect(result.current.isDeviceSelected('dev-2')).toBe(true);
      expect(result.current.isDeviceSelected('dev-3')).toBe(true);
    });

    it('should select range programmatically', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.selectRange(0, 1);
      });

      expect(result.current.selectionCount).toBe(2);
      expect(result.current.isDeviceSelected('dev-1')).toBe(true);
      expect(result.current.isDeviceSelected('dev-2')).toBe(true);
      expect(result.current.isDeviceSelected('dev-3')).toBe(false);
    });
  });

  describe('Filtering', () => {
    it('should initialize with default filters', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      expect(result.current.filters).toEqual({
        search: '',
        routingStatus: 'all',
        serviceFilter: undefined,
      });
      expect(result.current.filteredDevices).toHaveLength(3);
    });

    it('should filter devices by search (hostname)', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.setSearch('laptop');
      });

      expect(result.current.filteredDevices).toHaveLength(1);
      expect(result.current.filteredDevices[0].hostname).toBe('laptop');
    });

    it('should filter devices by search (IP address)', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.setSearch('192.168.1.100');
      });

      expect(result.current.filteredDevices).toHaveLength(1);
      expect(result.current.filteredDevices[0].ipAddress).toBe('192.168.1.100');
    });

    it('should filter devices by search (MAC address)', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.setSearch('aa:bb:cc:dd:ee:01');
      });

      expect(result.current.filteredDevices).toHaveLength(1);
      expect(result.current.filteredDevices[0].macAddress).toBe('aa:bb:cc:dd:ee:01');
    });

    it('should filter devices by routing status (routed)', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.setRoutingStatus('routed');
      });

      expect(result.current.filteredDevices).toHaveLength(1);
      expect(result.current.filteredDevices[0].isRouted).toBe(true);
    });

    it('should filter devices by routing status (unrouted)', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.setRoutingStatus('unrouted');
      });

      expect(result.current.filteredDevices).toHaveLength(2);
      expect(result.current.filteredDevices.every((d) => !d.isRouted)).toBe(true);
    });

    it('should filter devices by service instance', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.setServiceFilter('instance-tor');
      });

      expect(result.current.filteredDevices).toHaveLength(1);
      expect(result.current.filteredDevices[0].deviceID).toBe('dev-2');
    });

    it('should combine multiple filters', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      act(() => {
        result.current.setRoutingStatus('unrouted');
        result.current.setSearch('laptop');
      });

      expect(result.current.filteredDevices).toHaveLength(1);
      expect(result.current.filteredDevices[0].hostname).toBe('laptop');
      expect(result.current.filteredDevices[0].isRouted).toBe(false);
    });

    it('should clear all filters', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Set multiple filters
      act(() => {
        result.current.setSearch('test');
        result.current.setRoutingStatus('routed');
        result.current.setServiceFilter('instance-tor');
      });

      // Clear all
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        search: '',
        routingStatus: 'all',
        serviceFilter: undefined,
      });
      expect(result.current.filteredDevices).toHaveLength(3);
    });
  });

  describe('Computed Values', () => {
    it('should create device routing map', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      expect(result.current.deviceRoutingMap.size).toBe(1);
      expect(result.current.deviceRoutingMap.has('dev-2')).toBe(true);
      expect(result.current.deviceRoutingMap.get('dev-2')?.routingMark).toBe('tor-mark');
    });

    it('should filter available interfaces by gateway status', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Only interfaces with gatewayStatus 'up' or 'active' should be available
      expect(result.current.availableInterfaces).toHaveLength(2);
      expect(result.current.availableInterfaces[0].instanceName).toBe('Tor Exit');
      expect(result.current.availableInterfaces[1].instanceName).toBe('Xray');
    });

    it('should calculate canBulkAssign correctly', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Initially false (no selection)
      expect(result.current.canBulkAssign).toBe(false);

      // Select devices
      act(() => {
        result.current.toggleSelection('dev-1');
        result.current.toggleSelection('dev-3');
      });

      // Now true (has selection and available interfaces)
      expect(result.current.canBulkAssign).toBe(true);
    });

    it('should return canBulkAssign false when no available interfaces', () => {
      const matrixNoInterfaces = {
        ...mockMatrix,
        interfaces: [],
      };

      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(matrixNoInterfaces, mockActions)
      );

      act(() => {
        result.current.toggleSelection('dev-1');
      });

      expect(result.current.canBulkAssign).toBe(false);
    });
  });

  describe('Action Handlers', () => {
    it('should call onAssign and clear selection', async () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Select device
      act(() => {
        result.current.toggleSelection('dev-1');
      });

      expect(result.current.selectionCount).toBe(1);

      // Assign device
      await act(async () => {
        await result.current.handleAssign('dev-1', 'iface-1');
      });

      expect(mockActions.onAssign).toHaveBeenCalledWith('dev-1', 'iface-1');
      expect(result.current.selectionCount).toBe(0);
    });

    it('should call onRemove', async () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      await act(async () => {
        await result.current.handleRemove('routing-1');
      });

      expect(mockActions.onRemove).toHaveBeenCalledWith('routing-1');
    });

    it('should call onBulkAssign with selected devices and clear selection', async () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Select multiple devices
      act(() => {
        result.current.toggleSelection('dev-1');
        result.current.toggleSelection('dev-3');
      });

      expect(result.current.selectionCount).toBe(2);

      // Bulk assign
      await act(async () => {
        await result.current.handleBulkAssign('iface-2');
      });

      expect(mockActions.onBulkAssign).toHaveBeenCalledWith(
        expect.arrayContaining(['dev-1', 'dev-3']),
        'iface-2'
      );
      expect(result.current.selectionCount).toBe(0);
    });
  });

  describe('Helper Functions', () => {
    it('should get device routing by device ID', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      const routing = result.current.getDeviceRouting('dev-2');
      expect(routing).toBeDefined();
      expect(routing?.routingMark).toBe('tor-mark');

      const noRouting = result.current.getDeviceRouting('dev-1');
      expect(noRouting).toBeUndefined();
    });

    it('should get interface name by interface ID', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      expect(result.current.getInterfaceName('iface-1')).toBe('Tor Exit');
      expect(result.current.getInterfaceName('iface-2')).toBe('Xray');
      expect(result.current.getInterfaceName('nonexistent')).toBe('Unknown');
    });

    it('should expose loading state', () => {
      const { result: loadingResult } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions, true)
      );

      expect(loadingResult.current.isLoading).toBe(true);

      const { result: notLoadingResult } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions, false)
      );

      expect(notLoadingResult.current.isLoading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty device list', () => {
      const emptyMatrix = {
        ...mockMatrix,
        devices: [],
      };

      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(emptyMatrix, mockActions)
      );

      expect(result.current.filteredDevices).toHaveLength(0);
      expect(result.current.selectionCount).toBe(0);

      // Should not error when selecting all
      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectionCount).toBe(0);
    });

    it('should handle devices with missing optional fields', () => {
      const devicesWithMissingFields: NetworkDevice[] = [
        {
          deviceID: 'dev-minimal',
          macAddress: 'aa:bb:cc:dd:ee:ff',
          active: true,
          isRouted: false,
          source: 'arp',
          dhcpLease: false,
          arpEntry: true,
          // Missing: ipAddress, hostname, routingMark
        },
      ];

      const minimalMatrix = {
        ...mockMatrix,
        devices: devicesWithMissingFields,
      };

      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(minimalMatrix, mockActions)
      );

      expect(result.current.filteredDevices).toHaveLength(1);

      // Search should not error on missing fields
      act(() => {
        result.current.setSearch('test');
      });

      expect(result.current.filteredDevices).toHaveLength(0);
    });

    it('should handle selection after filtering', () => {
      const { result } = renderHook(() =>
        useDeviceRoutingMatrix(mockMatrix, mockActions)
      );

      // Select all devices
      act(() => {
        result.current.selectAll();
      });

      expect(result.current.selectionCount).toBe(3);

      // Apply filter (should only show 1 device)
      act(() => {
        result.current.setSearch('laptop');
      });

      // Selection should still be 3 (not affected by filters)
      expect(result.current.selectionCount).toBe(3);
      expect(result.current.filteredDevices).toHaveLength(1);
    });
  });
});
