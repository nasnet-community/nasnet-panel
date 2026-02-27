import { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import {
  useBridgePorts,
  useAvailableInterfacesForBridge,
  useAddBridgePort,
  useRemoveBridgePort,
} from '@nasnet/api-client/queries';
import { toast } from 'sonner';

const DEFAULT_PVID = 1;
const DEFAULT_FRAME_TYPES = 'ADMIT_ALL';
const UNDO_TOAST_DURATION = 10000; // 10 seconds

/**
 * Headless hook for bridge port diagram drag-and-drop logic.
 * Manages port membership and available interfaces with drag-and-drop support.
 * Implements stable drag-and-drop handlers with toast feedback and undo actions.
 *
 * @param bridgeId - Bridge UUID
 * @param routerId - Router ID
 * @returns Bridge port state, interface data, and drag-and-drop handlers
 */
export function useBridgePortDiagram(bridgeId: string, routerId: string) {
  const {
    ports,
    loading: portsLoading,
    error: portsError,
    refetch: refetchPorts,
  } = useBridgePorts(bridgeId);
  const {
    interfaces: availableInterfaces,
    loading: interfacesLoading,
    error: interfacesError,
    refetch: refetchInterfaces,
  } = useAvailableInterfacesForBridge(routerId);

  const [addBridgePort, { loading: adding }] = useAddBridgePort();
  const [removeBridgePort, { loading: removing }] = useRemoveBridgePort();

  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [portToRemove, setPortToRemove] = useState<string | null>(null);

  // Handle drag end - add interface to bridge
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      // Check if dropped on bridge drop zone
      if (over?.id === `bridge-${bridgeId}` && active.data.current?.type === 'interface') {
        const interfaceId = active.id as string;

        try {
          const result = await addBridgePort({
            variables: {
              bridgeId,
              input: {
                interfaceId,
                pvid: DEFAULT_PVID,
                frameTypes: DEFAULT_FRAME_TYPES,
                ingressFiltering: false,
              },
            },
          });

          if (result.data?.addBridgePort?.success) {
            const operationId = result.data.addBridgePort.operationId;

            toast.success(`Added ${active.data.current?.name || interfaceId} to bridge`, {
              duration: UNDO_TOAST_DURATION,
              action:
                operationId ?
                  {
                    label: 'Undo',
                    onClick: async () => {
                      toast.info('Undo functionality coming soon');
                    },
                  }
                : undefined,
            });

            // Refetch both lists
            refetchPorts();
            refetchInterfaces();
          } else {
            const errors = result.data?.addBridgePort?.errors || [];
            errors.forEach((err: { message: string }) => toast.error(err.message));
          }
        } catch (err: unknown) {
          toast.error('Failed to add port to bridge');
          console.error(err);
        }
      }
    },
    [bridgeId, addBridgePort, refetchPorts, refetchInterfaces]
  );

  // Handle port removal
  const handleRemovePort = useCallback(
    async (portId: string) => {
      try {
        const result = await removeBridgePort({
          variables: { portId },
        });

        if (result.data?.removeBridgePort?.success) {
          const operationId = result.data.removeBridgePort.operationId;

          toast.success('Port removed from bridge', {
            duration: UNDO_TOAST_DURATION,
            action:
              operationId ?
                {
                  label: 'Undo',
                  onClick: async () => {
                    toast.info('Undo functionality coming soon');
                  },
                }
              : undefined,
          });

          // Refetch both lists
          refetchPorts();
          refetchInterfaces();
          setPortToRemove(null);
        } else {
          const errors = result.data?.removeBridgePort?.errors || [];
          errors.forEach((err: { message: string }) => toast.error(err.message));
        }
      } catch (err: unknown) {
        toast.error('Failed to remove port from bridge');
        console.error(err);
      }
    },
    [removeBridgePort, refetchPorts, refetchInterfaces]
  );

  return {
    // Port data
    ports,
    isLoadingPorts: portsLoading,
    hasPortsError: portsError,

    // Available interfaces
    availableInterfaces,
    isLoadingInterfaces: interfacesLoading,
    hasInterfacesError: interfacesError,

    // Actions
    handleDragEnd,
    handleRemovePort,

    // UI state
    selectedPortId,
    setSelectedPortId,
    portToRemove,
    setPortToRemove,

    // Loading states
    isLoading: adding || removing,
  };
}

export type UseBridgePortDiagramReturn = ReturnType<typeof useBridgePortDiagram>;
