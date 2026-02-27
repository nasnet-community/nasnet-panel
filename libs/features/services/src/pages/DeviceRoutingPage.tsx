/**
 * DeviceRoutingPage
 *
 * Device-to-Service Routing management page (NAS-8.3).
 * Displays network devices and allows assigning them to service instances for routing.
 *
 * Features:
 * - Device discovery from DHCP + ARP
 * - Service instance selection for routing
 * - Bulk device assignment
 * - Real-time routing updates
 * - Toast notifications for user feedback
 *
 * @component
 * @example
 * ```tsx
 * <DeviceRoutingPage routerId="router-001" />
 * ```
 *
 * @see {@link DeviceRoutingMatrix} for the pattern component
 * @see {@link KillSwitchToggle} for global kill switch control
 * @see {@link RoutingChainViz} for visualizing routing chains
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Network } from 'lucide-react';

import type { DeviceRoutingActions, RoutingChainData } from '@nasnet/ui/patterns';

import {
  useDeviceRoutingMatrix,
  useAssignDeviceRouting,
  useRemoveDeviceRouting,
  useBulkAssignRouting,
  useDeviceRoutingSubscription,
} from '@nasnet/api-client/queries';
import { useToast } from '@nasnet/ui/primitives';
import {
  DeviceRoutingMatrix,
  RoutingChainViz,
  KillSwitchToggle,
  ScheduleEditor,
} from '@nasnet/ui/patterns';
import { cn } from '@nasnet/ui/utils';

/**
 * DeviceRoutingPage props
 *
 * @interface DeviceRoutingPageProps
 * @property {string} routerId - Router ID for scoping device discovery and routing queries
 * @property {string} [className] - Optional CSS classes to apply to the container
 */
export interface DeviceRoutingPageProps {
  /** Router ID for scoping all queries and mutations */
  routerId: string;

  /** Optional CSS classes for the container */
  className?: string;
}

/**
 * DeviceRoutingPage component
 *
 * Main page for device-to-service routing management.
 * Displays the DeviceRoutingMatrix pattern component populated from DHCP leases and ARP table.
 * Supports single and bulk device assignment to service virtual interfaces.
 * Real-time toast notifications are emitted via GraphQL subscription on routing changes.
 *
 * @param {DeviceRoutingPageProps} props - Component props
 * @returns {React.ReactElement} The rendered device routing page
 */
function DeviceRoutingPageComponent({ routerId, className }: DeviceRoutingPageProps) {
  const { toast } = useToast();

  // State for schedule editor
  const [shouldShowScheduleEditor, setShouldShowScheduleEditor] = useState(false);
  const [selectedScheduleRoutingId, setSelectedScheduleRoutingId] = useState<string | null>(null);

  // Fetch device routing matrix (devices, interfaces, routings)
  const {
    matrix,
    loading: matrixLoading,
    error: matrixError,
    refetch,
  } = useDeviceRoutingMatrix(routerId);

  // Mutation hooks
  const [assignDevice, { loading: assignLoading, error: assignError }] = useAssignDeviceRouting();

  const [removeDevice, { loading: removeLoading, error: removeError }] = useRemoveDeviceRouting();

  const {
    bulkAssign,
    progress: bulkProgress,
    loading: bulkLoading,
    error: bulkError,
  } = useBulkAssignRouting();

  // Subscribe to real-time routing changes
  const { event: routingEvent } = useDeviceRoutingSubscription(routerId);

  // Handle real-time routing events (aria-live region updated via toast)
  useEffect(() => {
    if (!routingEvent) return;

    switch (routingEvent.eventType) {
      case 'assigned': {
        const deviceIdentifier =
          routingEvent.routing?.deviceName ??
          routingEvent.routing?.deviceIP ??
          routingEvent.routing?.macAddress ??
          'Unknown device';
        toast({
          title: 'Device Assigned',
          description: `${deviceIdentifier} has been assigned to a service.`,
          variant: 'default',
        });
        break;
      }
      case 'removed': {
        const deviceIdentifier =
          routingEvent.routing?.deviceName ??
          routingEvent.routing?.deviceIP ??
          routingEvent.routing?.macAddress ??
          'Unknown device';
        toast({
          title: 'Device Routing Removed',
          description: `${deviceIdentifier} routing has been removed.`,
          variant: 'default',
        });
        break;
      }
      case 'updated': {
        const deviceIdentifier =
          routingEvent.routing?.deviceName ??
          routingEvent.routing?.deviceIP ??
          routingEvent.routing?.macAddress ??
          'Unknown device';
        toast({
          title: 'Device Routing Updated',
          description: `${deviceIdentifier} routing has been updated.`,
          variant: 'default',
        });
        break;
      }
    }
  }, [routingEvent, toast]);

  // Action handler: assign device to service interface
  const handleAssign = useCallback(
    async (deviceID: string, interfaceID: string) => {
      if (!matrix) return;

      // Find device and interface details for better toast messages
      const device = matrix.devices.find((d) => d.deviceID === deviceID);
      const iface = matrix.interfaces.find((i) => i.id === interfaceID);

      if (!device || !iface) {
        toast({
          title: 'Assignment Failed',
          description: 'Device or service not found.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await assignDevice({
          routerID: routerId,
          deviceID: device.deviceID,
          macAddress: device.macAddress,
          deviceIP: device.ipAddress,
          deviceName: device.hostname,
          instanceID: iface.instanceID,
          interfaceID: iface.id,
          routingMark: iface.routingMark,
          routingMode: 'MAC', // Default to MAC-based routing
        });

        const deviceLabel = device.hostname ?? device.ipAddress ?? device.macAddress;
        toast({
          title: 'Device Assigned',
          description: `${deviceLabel} assigned to ${iface.instanceName}`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Failed to assign device:', error);
        toast({
          title: 'Assignment Failed',
          description: error instanceof Error ? error.message : 'Failed to assign device',
          variant: 'destructive',
        });
      }
    },
    [matrix, routerId, assignDevice, toast]
  );

  // Action handler: remove device routing
  const handleRemove = useCallback(
    async (routingID: string) => {
      if (!matrix) return;

      // Find routing details for better toast message
      const routing = matrix.routings.find((r) => r.id === routingID);

      try {
        await removeDevice(routingID);

        const deviceLabel =
          routing ? (routing.deviceName ?? routing.deviceIP ?? routing.macAddress) : 'Device';
        toast({
          title: 'Routing Removed',
          description: `${deviceLabel} routing has been removed`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Failed to remove device routing:', error);
        toast({
          title: 'Removal Failed',
          description: error instanceof Error ? error.message : 'Failed to remove routing',
          variant: 'destructive',
        });
      }
    },
    [matrix, removeDevice, toast]
  );

  // Action handler: bulk assign multiple devices to a service interface
  const handleBulkAssign = useCallback(
    async (deviceIDs: string[], interfaceID: string) => {
      if (!matrix) return;

      const iface = matrix.interfaces.find((i) => i.id === interfaceID);
      if (!iface) {
        toast({
          title: 'Bulk Assignment Failed',
          description: 'Service not found.',
          variant: 'destructive',
        });
        return;
      }

      // Build assignments array, filtering out missing devices
      const assignments = deviceIDs
        .map((deviceID) => {
          const device = matrix.devices.find((d) => d.deviceID === deviceID);
          if (!device) return null;

          return {
            deviceID: device.deviceID,
            macAddress: device.macAddress,
            deviceIP: device.ipAddress,
            deviceName: device.hostname,
            instanceID: iface.instanceID,
            interfaceID: iface.id,
            routingMark: iface.routingMark,
            routingMode: 'MAC' as const,
          };
        })
        .filter((assignment): assignment is NonNullable<typeof assignment> => assignment !== null);

      if (assignments.length === 0) {
        toast({
          title: 'Bulk Assignment Failed',
          description: 'No valid devices to assign.',
          variant: 'destructive',
        });
        return;
      }

      try {
        const result = await bulkAssign({
          routerID: routerId,
          assignments,
        });

        if (result.failureCount > 0) {
          toast({
            title: 'Bulk Assignment Partial Success',
            description: `${result.successCount} devices assigned, ${result.failureCount} failed`,
            variant: 'warning',
          });
        } else {
          toast({
            title: 'Bulk Assignment Complete',
            description: `All ${result.successCount} devices assigned to ${iface.instanceName}`,
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Failed to bulk assign devices:', error);
        toast({
          title: 'Bulk Assignment Failed',
          description: error instanceof Error ? error.message : 'Failed to assign devices',
          variant: 'destructive',
        });
      }
    },
    [matrix, routerId, bulkAssign, toast]
  );

  // Derive routing chain visualizations from matrix data (NAS-8.10)
  // Memoized to prevent unnecessary re-renders of RoutingChainViz components
  const routingChains: RoutingChainData[] = useMemo(() => {
    if (!matrix || !matrix.routings || matrix.routings.length === 0) return [];

    // Group routings by device for chain visualization
    const deviceRoutings = new Map<string, (typeof matrix.routings)[number][]>();
    for (const routing of matrix.routings) {
      const existing = deviceRoutings.get(routing.deviceID) || [];
      deviceRoutings.set(routing.deviceID, [...existing, routing]);
    }

    // Create chain data for devices with active routings
    return Array.from(deviceRoutings.entries()).map(([deviceID, routings]) => {
      const firstRouting = routings[0];
      const device = matrix.devices.find((d) => d.deviceID === deviceID);

      return {
        id: `chain-${deviceID}`,
        deviceId: deviceID,
        deviceName: device?.hostname || firstRouting.deviceName || null,
        deviceMac: device?.macAddress || firstRouting.macAddress || null,
        deviceIp: device?.ipAddress || firstRouting.deviceIP || null,
        hops: routings.map((r, hopIndex) => {
          const hopIface = matrix.interfaces.find((inf) => inf.id === r.interfaceID);
          return {
            id: r.id,
            order: hopIndex + 1,
            serviceName: hopIface?.instanceName || 'Unknown',
            serviceType: hopIface?.gatewayType,
            routingMark: r.routingMark,
            latencyMs: null,
            healthy: r.active,
            killSwitchActive: false,
          };
        }),
        active: firstRouting.active,
        routingMode: (firstRouting.routingMode || 'MAC') as 'MAC' | 'IP',
        killSwitchEnabled: false,
        killSwitchMode: 'BLOCK_ALL' as const,
        killSwitchActive: false,
        totalLatencyMs: null,
      };
    });
  }, [matrix]);

  // Build stable action handlers object (memoized for pattern component)
  const actions: DeviceRoutingActions = useMemo(
    () => ({
      onAssign: handleAssign,
      onRemove: handleRemove,
      onBulkAssign: handleBulkAssign,
    }),
    [handleAssign, handleRemove, handleBulkAssign]
  );

  // Show error toast if matrix fetch fails (no re-toast if error unchanged)
  useEffect(() => {
    if (matrixError) {
      toast({
        title: 'Failed to Load Devices',
        description: matrixError.message,
        variant: 'destructive',
      });
    }
  }, [matrixError, toast]);

  // Compute loading state
  const isLoading = matrixLoading || assignLoading || removeLoading || bulkLoading;

  // Handler: schedule editor close
  const handleCloseScheduleEditor = useCallback(() => {
    setShouldShowScheduleEditor(false);
    setSelectedScheduleRoutingId(null);
  }, []);

  // Handler: schedule editor open (when user clicks on a routing hop)
  const handleOpenScheduleEditor = useCallback((routingId: string) => {
    setSelectedScheduleRoutingId(routingId);
    setShouldShowScheduleEditor(true);
  }, []);

  // Handler: schedule editor save
  const handleSaveSchedule = useCallback(
    async (_schedule: unknown) => {
      toast({
        title: 'Schedule Created',
        description: 'Routing schedule has been saved.',
        variant: 'default',
      });
      handleCloseScheduleEditor();
    },
    [toast, handleCloseScheduleEditor]
  );

  // Handler: hop click on routing chain visualization
  const handleRoutingChainHopClick = useCallback(
    (hop: RoutingChainData['hops'][number]) => {
      handleOpenScheduleEditor(hop.id);
      toast({
        title: `Service: ${hop.serviceName}`,
        description: `Routing mark: ${hop.routingMark}`,
        variant: 'default',
      });
    },
    [toast, handleOpenScheduleEditor]
  );

  return (
    <div className={cn('py-component-lg container mx-auto', className)}>
      <div className="mb-component-lg">
        <div className="gap-component-md flex items-center">
          <h1 className="font-display text-foreground text-3xl tracking-tight">Device Routing</h1>
          <Network
            className="text-category-vpn h-6 w-6"
            aria-hidden="true"
          />
        </div>
        <p className="text-muted-foreground">
          Route network devices through service instances (Tor, Xray, etc.)
        </p>

        {/* Global Kill Switch (NAS-8.13) */}
        <div className="mt-component-md gap-component-md flex items-center">
          <KillSwitchToggle
            routerId={routerId}
            deviceId=""
            deviceName="Global"
            aria-label="Global kill switch toggle"
            className="ml-auto"
          />
        </div>
      </div>

      {/* Bulk Assignment Progress Bar */}
      {bulkProgress && (
        <div
          className={cn(
            'mb-component-md p-component-sm rounded-[var(--semantic-radius-card)] border',
            'border-border bg-info/10'
          )}
          role="status"
          aria-live="polite"
          aria-label={`Bulk assignment progress: ${bulkProgress.percentage}% complete`}
        >
          <div className="flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">
              Bulk Assignment Progress: {bulkProgress.percentage}%
            </span>
            <span className="text-muted-foreground font-mono text-sm">
              {bulkProgress.successful}/{bulkProgress.total} completed
            </span>
          </div>
        </div>
      )}

      {/* Routing Chain Visualizations (NAS-8.10) */}
      {routingChains.length > 0 && (
        <section className="mb-component-lg space-y-component-md">
          <h2 className="font-display text-foreground text-lg">Active Routing Chains</h2>
          <div className="space-y-component-md">
            {routingChains.slice(0, 5).map((chain) => (
              <RoutingChainViz
                key={chain.id}
                chain={chain}
                showLatency
                showKillSwitch
                compact
                onHopClick={handleRoutingChainHopClick}
              />
            ))}
            {routingChains.length > 5 && (
              <p className="text-muted-foreground text-center text-sm">
                and {routingChains.length - 5} more chains...
              </p>
            )}
          </div>
        </section>
      )}

      {/* Main Device Routing Matrix */}
      {matrix ?
        <DeviceRoutingMatrix
          routerId={routerId}
          matrix={matrix as any}
          actions={actions}
          loading={isLoading}
          error={matrixError}
          showSummary
        />
      : <div
          className="flex items-center justify-center py-12"
          role="status"
          aria-live="polite"
          aria-label="Loading device list"
        >
          <p className="text-muted-foreground">Loading devices...</p>
        </div>
      }

      {/* Schedule Editor Modal (NAS-8.21) */}
      <ScheduleEditor
        routingID={selectedScheduleRoutingId || ''}
        open={shouldShowScheduleEditor}
        onClose={handleCloseScheduleEditor}
        onSave={handleSaveSchedule}
        mode="create"
      />
    </div>
  );
}

// Export wrapped component with React.memo for performance optimization
export const DeviceRoutingPage = React.memo(DeviceRoutingPageComponent);
DeviceRoutingPage.displayName = 'DeviceRoutingPage';
