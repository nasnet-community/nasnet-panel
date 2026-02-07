import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import { Alert, AlertDescription } from '@nasnet/ui/primitives';
import { Skeleton } from '@nasnet/ui/primitives';
import { AlertCircle, Network } from 'lucide-react';
import { useBridgePortDiagram } from './use-bridge-port-diagram';
import { PortNode } from './PortNode';
import { AvailableInterfaces } from './AvailableInterfaces';
import { SafetyConfirmation } from '@nasnet/ui/patterns';

/**
 * Bridge Port Diagram Component - Visual port membership management
 * Features:
 * - SVG-style tree visualization of bridge ports
 * - Drag-and-drop interface assignment
 * - Visual indicators for PVID, VLANs, STP role/state
 * - Port removal with confirmation
 *
 * @param bridgeId - Bridge UUID
 * @param routerId - Router ID
 */
export interface BridgePortDiagramProps {
  bridgeId: string;
  routerId: string;
  onEditPort?: (portId: string) => void;
}

export function BridgePortDiagram({ bridgeId, routerId, onEditPort }: BridgePortDiagramProps) {
  const {
    ports,
    portsLoading,
    portsError,
    availableInterfaces,
    interfacesLoading,
    interfacesError,
    handleDragEnd,
    handleRemovePort,
    portToRemove,
    setPortToRemove,
    isLoading,
  } = useBridgePortDiagram(bridgeId, routerId);

  const portToRemoveData = ports?.find((p) => p.uuid === portToRemove);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Bridge Ports Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Bridge Ports</h3>
        </div>

        {/* Loading State */}
        {portsLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {portsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load bridge ports: {portsError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Ports List with Drag-and-Drop */}
        {!portsLoading && !portsError && (
          <DndContext onDragEnd={handleDragEnd}>
            <BridgeDropZone bridgeId={bridgeId} portCount={ports?.length || 0}>
              <div className="space-y-2" role="list" aria-label="Bridge ports">
                {ports && ports.length > 0 ? (
                  ports.map((port) => (
                    <PortNode
                      key={port.uuid}
                      port={port}
                      onRemove={(portId) => setPortToRemove(portId)}
                      onEdit={onEditPort || (() => {})}
                      isRemoving={isLoading}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                    <Network className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      No ports assigned
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drag an interface from the right to add it to this bridge
                    </p>
                  </div>
                )}
              </div>
            </BridgeDropZone>

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
        {interfacesError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load interfaces: {interfacesError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Available Interfaces */}
        {!interfacesError && (
          <AvailableInterfaces
            interfaces={availableInterfaces || []}
            loading={interfacesLoading}
          />
        )}
      </div>

      {/* Port Remove Confirmation */}
      {portToRemoveData && (
        <SafetyConfirmation
          open={!!portToRemove}
          onOpenChange={(open) => !open && setPortToRemove(null)}
          title={`Remove port "${portToRemoveData.interfaceName}"?`}
          severity="warning"
          urgency="normal"
          description="This port will be removed from the bridge and become available for other uses."
          consequences={[
            portToRemoveData.taggedVlans && portToRemoveData.taggedVlans.length > 0
              ? `VLAN configuration will be lost (Tagged: ${portToRemoveData.taggedVlans.join(', ')})`
              : undefined,
            portToRemoveData.untaggedVlans && portToRemoveData.untaggedVlans.length > 0
              ? `Untagged VLANs: ${portToRemoveData.untaggedVlans.join(', ')}`
              : undefined,
          ].filter(Boolean) as string[]}
          confirmLabel="Remove Port"
          onConfirm={() => handleRemovePort(portToRemove)}
          onCancel={() => setPortToRemove(null)}
        />
      )}
    </div>
  );
}

/**
 * Bridge Drop Zone - Droppable area for adding interfaces
 */
interface BridgeDropZoneProps {
  bridgeId: string;
  portCount: number;
  children: React.ReactNode;
}

function BridgeDropZone({ bridgeId, portCount, children }: BridgeDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `bridge-${bridgeId}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 transition-colors ${
        isOver
          ? 'border-primary bg-primary/5'
          : portCount === 0
          ? 'border-dashed'
          : 'border-border'
      } p-4`}
      role="region"
      aria-label="Bridge port drop zone"
    >
      {children}
    </div>
  );
}
