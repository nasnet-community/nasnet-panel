/**
 * VLANAllocationTable Pattern Component
 *
 * Auto-detecting wrapper that selects the appropriate platform presenter.
 * Displays VLAN allocations with filtering and sorting capabilities.
 *
 * @example
 * ```tsx
 * <VLANAllocationTable
 *   allocations={allocations}
 *   loading={loading}
 *   onRefresh={refetch}
 * />
 * ```
 */
export interface VLANAllocation {
    id: string;
    vlanID: number;
    serviceType: string;
    instanceName: string;
    bindIP?: string;
    interfaceName?: string;
    status: 'ALLOCATED' | 'RELEASING' | 'RELEASED';
    allocatedAt: string;
}
export type VLANAllocationSort = 'vlanID' | 'allocatedAt' | 'serviceType';
export interface VLANAllocationTableProps {
    /** List of VLAN allocations to display */
    allocations: VLANAllocation[];
    /** Whether data is loading */
    loading?: boolean;
    /** Callback to refresh data */
    onRefresh?: () => void;
    /** Optional className for additional styling */
    className?: string;
}
/**
 * VLANAllocationTable - Displays VLAN allocations with filters and sorting
 *
 * Features:
 * - Filter by service type and status
 * - Sort by VLAN ID, allocated date, or service type
 * - Search by instance name
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Mobile (<640px): Card-based list with expandable details
 * - Tablet/Desktop (>=640px): Dense data table with all columns visible
 */
declare function VLANAllocationTableComponent(props: VLANAllocationTableProps): import("react/jsx-runtime").JSX.Element;
export declare const VLANAllocationTable: import("react").MemoExoticComponent<typeof VLANAllocationTableComponent>;
export {};
//# sourceMappingURL=VLANAllocationTable.d.ts.map