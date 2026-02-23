import { DragEndEvent } from '@dnd-kit/core';
/**
 * Headless hook for bridge port diagram drag-and-drop logic.
 * Manages port membership and available interfaces with drag-and-drop support.
 * Implements stable drag-and-drop handlers with toast feedback and undo actions.
 *
 * @param bridgeId - Bridge UUID
 * @param routerId - Router ID
 * @returns Bridge port state, interface data, and drag-and-drop handlers
 */
export declare function useBridgePortDiagram(bridgeId: string, routerId: string): {
    ports: any;
    isLoadingPorts: boolean;
    hasPortsError: import("@apollo/client").ApolloError | undefined;
    availableInterfaces: any;
    isLoadingInterfaces: boolean;
    hasInterfacesError: import("@apollo/client").ApolloError | undefined;
    handleDragEnd: (event: DragEndEvent) => Promise<void>;
    handleRemovePort: (portId: string) => Promise<void>;
    selectedPortId: string | null;
    setSelectedPortId: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    portToRemove: string | null;
    setPortToRemove: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    isLoading: boolean;
};
export type UseBridgePortDiagramReturn = ReturnType<typeof useBridgePortDiagram>;
//# sourceMappingURL=use-bridge-port-diagram.d.ts.map