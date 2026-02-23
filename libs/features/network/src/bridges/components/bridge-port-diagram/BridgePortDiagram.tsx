import { memo, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { Alert, AlertDescription, Skeleton, Icon } from '@nasnet/ui/primitives';
import { Network, AlertCircle } from 'lucide-react';
import { useBridgePortDiagram } from './use-bridge-port-diagram';
import { PortNode } from './PortNode';
import { AvailableInterfaces } from './AvailableInterfaces';
import { SafetyConfirmation } from '@nasnet/ui/patterns';
import type { BridgePort } from '@nasnet/api-client/generated';

const MIN_SKELETON_COUNT = 3;

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

function BridgePortDiagramComponent({
  bridgeId,
  routerId,
  onEditPort,
  className
}: BridgePortDiagramProps) {
  const {
    ports,
    isLoadingPorts,
    hasPortsError,
    availableInterfaces,
    isLoadingInterfaces,
    hasInterfacesError,
    handleDragEnd,
    handleRemovePort,
    portToRemove,
    setPortToRemove,
    isLoading,
  } = useBridgePortDiagram(bridgeId, routerId);

  const portToRemoveData = useMemo(
    () => ports?.find((p: BridgePort) => p.id === portToRemove),
    [ports, portToRemove]
  );

  const handleRemovePortCallback = useCallback(
    (id: string) => setPortToRemove(id),
    [setPortToRemove]
  );

  const handleEditPortCallback = useCallback(
    (id: string) => onEditPort?.(id),
    [onEditPort]
  );

  const handleDragEndCallback = useCallback(
    (event: DragEndEvent) => handleDragEnd(event),
    [handleDragEnd]
  );

  const handleRemoveConfirmCallback = useCallback(
    () => handleRemovePort(portToRemove!),
    [handleRemovePort, portToRemove]
  );

  const handleCancelRemoveCallback = useCallback(
    () => setPortToRemove(null),
    [setPortToRemove]
  );

  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className || ''}`}>
      {/* Bridge Ports Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Icon icon={Network} className="h-5 w-5" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Bridge Ports</h3>
        </div>

        {/* Loading State */}
        {isLoadingPorts && (
          <div className="space-y-3">
            {Array.from({ length: MIN_SKELETON_COUNT }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {hasPortsError && (
          <Alert variant="destructive">
            <Icon icon={AlertCircle} className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              Failed to load bridge ports: {hasPortsError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Ports List with Drag-and-Drop */}
        {!isLoadingPorts && !hasPortsError && (
          <DndContext onDragEnd={handleDragEndCallback}>
            <BridgeDropZoneComponent bridgeId={bridgeId} portCount={ports?.length || 0}>
              <div className="space-y-2" role="list" aria-label="Bridge ports">
                {ports && ports.length > 0 ? (
                  ports.map((port: BridgePort) => (
                    <PortNode
                      key={port.id}
                      port={port}
                      onRemove={handleRemovePortCallback}
                      onEdit={handleEditPortCallback}
                      isRemoving={isLoading}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                    <Icon icon={Network} className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" aria-hidden="true" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      No ports assigned
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drag an interface from the right to add it to this bridge
                    </p>
                  </div>
                )}
              </div>
            </BridgeDropZoneComponent>

            {/* Drag Overlay (shows dragged item) */}
            <DragOverlay>
              <div className="rounded-md border bg-background p-3 shadow-lg opacity-80">
                <span className="text-sm font-medium">Dragging interface...</span>
              </div>
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Available Interfaces Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Interfaces</h3>

        {/* Error State */}
        {hasInterfacesError && (
          <Alert variant="destructive">
            <Icon icon={AlertCircle} className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              Failed to load interfaces: {hasInterfacesError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Available Interfaces */}
        {!hasInterfacesError && (
          <AvailableInterfaces
            interfaces={availableInterfaces || []}
            loading={isLoadingInterfaces}
          />
        )}
      </div>

      {/* Port Remove Confirmation */}
      {portToRemoveData && (
        <SafetyConfirmation
          open={!!portToRemove}
          onOpenChange={(open) => !open && handleCancelRemoveCallback()}
          title={`Remove port "${portToRemoveData.interface.name}"?`}
          description="This port will be removed from the bridge and become available for other uses."
          consequences={[
            portToRemoveData.taggedVlans && portToRemoveData.taggedVlans.length > 0
              ? `VLAN configuration will be lost (Tagged: ${portToRemoveData.taggedVlans.join(', ')})`
              : undefined,
            portToRemoveData.untaggedVlans && portToRemoveData.untaggedVlans.length > 0
              ? `Untagged VLANs: ${portToRemoveData.untaggedVlans.join(', ')}`
              : undefined,
          ].filter(Boolean) as string[]}
          confirmText="REMOVE"
          onConfirm={handleRemoveConfirmCallback}
          onCancel={handleCancelRemoveCallback}
        />
      )}
    </div>
  );
}

BridgePortDiagramComponent.displayName = 'BridgePortDiagram';

export const BridgePortDiagram = memo(BridgePortDiagramComponent);

/**
 * Bridge Drop Zone - Droppable area for adding interfaces
 */
interface BridgeDropZoneProps {
  bridgeId: string;
  portCount: number;
  children: React.ReactNode;
}

const BridgeDropZoneComponent = memo(function BridgeDropZone({ bridgeId, portCount, children }: BridgeDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `bridge-${bridgeId}`,
  });

  const dropZoneClasses = useMemo(
    () => `rounded-lg border-2 transition-colors ${
      isOver
        ? 'border-primary bg-primary/5'
        : portCount === 0
        ? 'border-dashed'
        : 'border-border'
    } p-4`,
    [isOver, portCount]
  );

  return (
    <div
      ref={setNodeRef}
      className={dropZoneClasses}
      role="region"
      aria-label="Bridge port drop zone"
    >
      {children}
    </div>
  );
});

BridgeDropZoneComponent.displayName = 'BridgeDropZone';
