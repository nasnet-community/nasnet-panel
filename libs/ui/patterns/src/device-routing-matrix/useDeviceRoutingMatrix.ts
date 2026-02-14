/**
 * useDeviceRoutingMatrix Hook
 *
 * Headless hook containing all business logic for DeviceRoutingMatrix.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */

import { useState, useMemo, useCallback } from 'react';
import type {
  NetworkDevice,
  VirtualInterfaceInfo,
  DeviceRouting,
  DeviceFilters,
  RoutingStatus,
  DeviceRoutingActions,
  DeviceRoutingMatrixData,
} from './types';

/**
 * Return type for useDeviceRoutingMatrix hook
 */
export interface UseDeviceRoutingMatrixReturn {
  // Selection state
  selectedDevices: Set<string>;
  isDeviceSelected: (deviceID: string) => boolean;
  toggleSelection: (deviceID: string, shiftKey?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectRange: (fromIndex: number, toIndex: number) => void;

  // Filters
  filters: DeviceFilters;
  setSearch: (search: string) => void;
  setRoutingStatus: (status: RoutingStatus) => void;
  setServiceFilter: (instanceID?: string) => void;
  clearFilters: () => void;

  // Computed values
  filteredDevices: NetworkDevice[];
  availableInterfaces: VirtualInterfaceInfo[];
  deviceRoutingMap: Map<string, DeviceRouting>;
  selectionCount: number;
  canBulkAssign: boolean;

  // Action handlers
  handleAssign: (deviceID: string, interfaceID: string) => Promise<void>;
  handleRemove: (routingID: string) => Promise<void>;
  handleBulkAssign: (interfaceID: string) => Promise<void>;

  // Helpers
  getDeviceRouting: (deviceID: string) => DeviceRouting | undefined;
  getInterfaceName: (interfaceID: string) => string;
  isLoading: boolean;
}

/**
 * Headless hook for DeviceRoutingMatrix component
 *
 * Manages selection state, filters, and provides action handlers.
 * All business logic is centralized here for reuse across platforms.
 *
 * @param matrix - Matrix data from API
 * @param actions - Action handler callbacks
 * @param loading - Loading state
 * @returns State, computed values, and action handlers
 */
export function useDeviceRoutingMatrix(
  matrix: DeviceRoutingMatrixData,
  actions: DeviceRoutingActions,
  loading = false
): UseDeviceRoutingMatrixReturn {
  // Selection state
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);

  // Filters state
  const [filters, setFilters] = useState<DeviceFilters>({
    search: '',
    routingStatus: 'all',
    serviceFilter: undefined,
  });

  // Create device routing lookup map for O(1) access
  const deviceRoutingMap = useMemo(() => {
    const map = new Map<string, DeviceRouting>();
    matrix.routings.forEach((routing) => {
      if (routing.active) {
        map.set(routing.deviceID, routing);
      }
    });
    return map;
  }, [matrix.routings]);

  // Filter devices based on search, routing status, and service filter
  const filteredDevices = useMemo(() => {
    let devices = matrix.devices;

    // Search filter (hostname, IP, MAC)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      devices = devices.filter(
        (device) =>
          device.hostname?.toLowerCase().includes(searchLower) ||
          device.ipAddress?.toLowerCase().includes(searchLower) ||
          device.macAddress.toLowerCase().includes(searchLower)
      );
    }

    // Routing status filter
    if (filters.routingStatus === 'routed') {
      devices = devices.filter((device) => device.isRouted);
    } else if (filters.routingStatus === 'unrouted') {
      devices = devices.filter((device) => !device.isRouted);
    }

    // Service filter (show only devices routed through this service)
    if (filters.serviceFilter) {
      devices = devices.filter((device) => {
        const routing = deviceRoutingMap.get(device.deviceID);
        return routing?.instanceID === filters.serviceFilter;
      });
    }

    return devices;
  }, [matrix.devices, filters, deviceRoutingMap]);

  // Available interfaces for assignment
  const availableInterfaces = useMemo(() => {
    return matrix.interfaces.filter(
      (iface) => iface.gatewayStatus === 'up' || iface.gatewayStatus === 'active'
    );
  }, [matrix.interfaces]);

  // Selection helpers
  const isDeviceSelected = useCallback(
    (deviceID: string) => selectedDevices.has(deviceID),
    [selectedDevices]
  );

  const toggleSelection = useCallback(
    (deviceID: string, shiftKey = false) => {
      setSelectedDevices((prev) => {
        const newSet = new Set(prev);

        if (shiftKey && lastSelectedIndex >= 0) {
          // Range selection with shift+click
          const currentIndex = filteredDevices.findIndex((d) => d.deviceID === deviceID);
          if (currentIndex >= 0) {
            const start = Math.min(lastSelectedIndex, currentIndex);
            const end = Math.max(lastSelectedIndex, currentIndex);
            for (let i = start; i <= end; i++) {
              newSet.add(filteredDevices[i].deviceID);
            }
          }
        } else {
          // Toggle single selection
          if (newSet.has(deviceID)) {
            newSet.delete(deviceID);
          } else {
            newSet.add(deviceID);
          }
        }

        return newSet;
      });

      // Update last selected index for shift+click range selection
      const currentIndex = filteredDevices.findIndex((d) => d.deviceID === deviceID);
      if (currentIndex >= 0) {
        setLastSelectedIndex(currentIndex);
      }
    },
    [filteredDevices, lastSelectedIndex]
  );

  const selectRange = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSelectedDevices((prev) => {
        const newSet = new Set(prev);
        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        for (let i = start; i <= end; i++) {
          if (i < filteredDevices.length) {
            newSet.add(filteredDevices[i].deviceID);
          }
        }
        return newSet;
      });
    },
    [filteredDevices]
  );

  const selectAll = useCallback(() => {
    setSelectedDevices(new Set(filteredDevices.map((d) => d.deviceID)));
  }, [filteredDevices]);

  const clearSelection = useCallback(() => {
    setSelectedDevices(new Set());
    setLastSelectedIndex(-1);
  }, []);

  // Filter setters
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setRoutingStatus = useCallback((status: RoutingStatus) => {
    setFilters((prev) => ({ ...prev, routingStatus: status }));
  }, []);

  const setServiceFilter = useCallback((instanceID?: string) => {
    setFilters((prev) => ({ ...prev, serviceFilter: instanceID }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      routingStatus: 'all',
      serviceFilter: undefined,
    });
  }, []);

  // Action handlers
  const handleAssign = useCallback(
    async (deviceID: string, interfaceID: string) => {
      await actions.onAssign(deviceID, interfaceID);
      // Clear selection after successful assignment
      clearSelection();
    },
    [actions, clearSelection]
  );

  const handleRemove = useCallback(
    async (routingID: string) => {
      await actions.onRemove(routingID);
    },
    [actions]
  );

  const handleBulkAssign = useCallback(
    async (interfaceID: string) => {
      const deviceIDs = Array.from(selectedDevices);
      await actions.onBulkAssign(deviceIDs, interfaceID);
      // Clear selection after successful bulk assignment
      clearSelection();
    },
    [actions, selectedDevices, clearSelection]
  );

  // Helpers
  const getDeviceRouting = useCallback(
    (deviceID: string) => deviceRoutingMap.get(deviceID),
    [deviceRoutingMap]
  );

  const getInterfaceName = useCallback(
    (interfaceID: string) => {
      const iface = matrix.interfaces.find((i) => i.id === interfaceID);
      return iface?.instanceName ?? 'Unknown';
    },
    [matrix.interfaces]
  );

  return {
    // Selection state
    selectedDevices,
    isDeviceSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,

    // Filters
    filters,
    setSearch,
    setRoutingStatus,
    setServiceFilter,
    clearFilters,

    // Computed values
    filteredDevices,
    availableInterfaces,
    deviceRoutingMap,
    selectionCount: selectedDevices.size,
    canBulkAssign: selectedDevices.size > 0 && availableInterfaces.length > 0,

    // Action handlers
    handleAssign,
    handleRemove,
    handleBulkAssign,

    // Helpers
    getDeviceRouting,
    getInterfaceName,
    isLoading: loading,
  };
}
