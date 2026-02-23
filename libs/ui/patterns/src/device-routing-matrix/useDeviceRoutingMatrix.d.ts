/**
 * useDeviceRoutingMatrix Hook
 *
 * Headless hook containing all business logic for DeviceRoutingMatrix.
 * Platform presenters consume this hook for shared state and behavior.
 *
 * @see ADR-018: Headless Platform Presenters
 */
import type { NetworkDevice, VirtualInterfaceInfo, DeviceRouting, DeviceFilters, RoutingStatus, DeviceRoutingActions, DeviceRoutingMatrixData } from './types';
/**
 * Return type for useDeviceRoutingMatrix hook
 */
export interface UseDeviceRoutingMatrixReturn {
    selectedDevices: Set<string>;
    isDeviceSelected: (deviceID: string) => boolean;
    toggleSelection: (deviceID: string, shiftKey?: boolean) => void;
    selectAll: () => void;
    clearSelection: () => void;
    selectRange: (fromIndex: number, toIndex: number) => void;
    filters: DeviceFilters;
    setSearch: (search: string) => void;
    setRoutingStatus: (status: RoutingStatus) => void;
    setServiceFilter: (instanceID?: string) => void;
    clearFilters: () => void;
    filteredDevices: NetworkDevice[];
    availableInterfaces: VirtualInterfaceInfo[];
    deviceRoutingMap: Map<string, DeviceRouting>;
    selectionCount: number;
    canBulkAssign: boolean;
    handleAssign: (deviceID: string, interfaceID: string) => Promise<void>;
    handleRemove: (routingID: string) => Promise<void>;
    handleBulkAssign: (interfaceID: string) => Promise<void>;
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
export declare function useDeviceRoutingMatrix(matrix: DeviceRoutingMatrixData, actions: DeviceRoutingActions, loading?: boolean): UseDeviceRoutingMatrixReturn;
//# sourceMappingURL=useDeviceRoutingMatrix.d.ts.map