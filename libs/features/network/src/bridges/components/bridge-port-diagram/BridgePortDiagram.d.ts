/**
 * Bridge Port Diagram Component - Visual port membership management
 * Features:
 * - SVG-style tree visualization of bridge ports
 * - Drag-and-drop interface assignment
 * - Visual indicators for PVID, VLANs, STP role/state
 * - Port removal with confirmation
 *
 * @description Interactive drag-and-drop interface for managing bridge port memberships.
 * Provides visual feedback during drag operations and safety confirmations for removal.
 *
 * @param bridgeId - Bridge UUID
 * @param routerId - Router ID
 * @param onEditPort - Callback when user clicks edit on a port
 * @param className - Optional CSS class for styling
 */
export interface BridgePortDiagramProps {
    bridgeId: string;
    routerId: string;
    onEditPort?: (portId: string) => void;
    className?: string;
}
declare function BridgePortDiagramComponent({ bridgeId, routerId, onEditPort, className }: BridgePortDiagramProps): import("react/jsx-runtime").JSX.Element;
declare namespace BridgePortDiagramComponent {
    var displayName: string;
}
export declare const BridgePortDiagram: import("react").MemoExoticComponent<typeof BridgePortDiagramComponent>;
export {};
//# sourceMappingURL=BridgePortDiagram.d.ts.map