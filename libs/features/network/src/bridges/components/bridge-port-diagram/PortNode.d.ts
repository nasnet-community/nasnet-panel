import type { BridgePort } from '@nasnet/api-client/generated';
export interface PortNodeProps {
    port: BridgePort;
    onRemove: (portId: string) => void;
    onEdit: (portId: string) => void;
    isRemoving?: boolean;
    className?: string;
}
/**
 * Port Node Component - Visualizes a bridge port with VLAN and STP info
 * Shows: Interface name, PVID, Tagged VLANs, STP role/state
 *
 * @description Visual representation of a bridge port with VLAN tagging and STP status
 */
export declare const PortNode: import("react").NamedExoticComponent<PortNodeProps>;
//# sourceMappingURL=PortNode.d.ts.map