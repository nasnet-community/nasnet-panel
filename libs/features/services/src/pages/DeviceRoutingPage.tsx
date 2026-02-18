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
 */

import { useCallback, useEffect } from 'react';
import { useToast } from '@nasnet/ui/primitives';
import {
  useDeviceRoutingMatrix,
  useAssignDeviceRouting,
  useRemoveDeviceRouting,
  useBulkAssignRouting,
  useDeviceRoutingSubscription,
} from '@nasnet/api-client/queries';
import { DeviceRoutingMatrix } from '@nasnet/ui/patterns';
import type { DeviceRoutingActions } from '@nasnet/ui/patterns';

/**
 * DeviceRoutingPage props
 */
export interface DeviceRoutingPageProps {
  /** Router ID */
  routerId: string;
}

/**
 * DeviceRoutingPage component
 *
 * Main page for device-to-service routing management.
 * Uses the DeviceRoutingMatrix pattern component with API hooks.
 */
export function DeviceRoutingPage({ routerId }: DeviceRoutingPageProps) {
  const { toast } = useToast();

  // Fetch device routing matrix (devices, interfaces, routings)
  const {
    matrix,
    loading: matrixLoading,
    error: matrixError,
    refetch,
  } = useDeviceRoutingMatrix(routerId);

  // Mutation hooks
  const [assignDevice, { loading: assignLoading, error: assignError }] =
    useAssignDeviceRouting();

  const [removeDevice, { loading: removeLoading, error: removeError }] =
    useRemoveDeviceRouting();

  const {
    bulkAssign,
    progress: bulkProgress,
    loading: bulkLoading,
    error: bulkError,
  } = useBulkAssignRouting();

  // Subscribe to real-time routing changes
  const { event: routingEvent } = useDeviceRoutingSubscription(routerId);

  // Handle real-time routing events
  useEffect(() => {
    if (!routingEvent) return;

    switch (routingEvent.eventType) {
      case 'assigned':
        toast({
          title: 'Device Assigned',
          description: `Device ${
            routingEvent.routing?.deviceName ??
            routingEvent.routing?.deviceIP ??
            routingEvent.routing?.macAddress
          } has been assigned to a service.`,
          variant: 'default',
        });
        break;
      case 'removed':
        toast({
          title: 'Device Routing Removed',
          description: 'Device routing has been removed.',
          variant: 'default',
        });
        break;
      case 'updated':
        toast({
          title: 'Device Routing Updated',
          description: 'Device routing has been updated.',
          variant: 'default',
        });
        break;
    }
  }, [routingEvent, toast]);

  // Action handlers with toast notifications
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

        toast({
          title: 'Device Assigned',
          description: `${device.hostname ?? device.ipAddress ?? device.macAddress} assigned to ${iface.instanceName}`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Failed to assign device:', error);
        toast({
          title: 'Assignment Failed',
          description:
            error instanceof Error ? error.message : 'Failed to assign device',
          variant: 'destructive',
        });
      }
    },
    [matrix, routerId, assignDevice, toast]
  );

  const handleRemove = useCallback(
    async (routingID: string) => {
      if (!matrix) return;

      // Find routing details for better toast message
      const routing = matrix.routings.find((r) => r.id === routingID);

      try {
        await removeDevice(routingID);

        toast({
          title: 'Routing Removed',
          description: routing
            ? `${routing.deviceName ?? routing.deviceIP ?? routing.macAddress} unrouted`
            : 'Device routing removed',
          variant: 'default',
        });
      } catch (error) {
        console.error('Failed to remove device routing:', error);
        toast({
          title: 'Removal Failed',
          description:
            error instanceof Error ? error.message : 'Failed to remove routing',
          variant: 'destructive',
        });
      }
    },
    [matrix, removeDevice, toast]
  );

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

      // Build assignments array
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
        .filter((assignment) => assignment !== null);

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
          description:
            error instanceof Error
              ? error.message
              : 'Failed to assign devices',
          variant: 'destructive',
        });
      }
    },
    [matrix, routerId, bulkAssign, toast]
  );

  // Build action handlers object
  const actions: DeviceRoutingActions = {
    onAssign: handleAssign,
    onRemove: handleRemove,
    onBulkAssign: handleBulkAssign,
  };

  // Show error toast if matrix fetch fails
  useEffect(() => {
    if (matrixError) {
      toast({
        title: 'Failed to Load Devices',
        description: matrixError.message,
        variant: 'destructive',
      });
    }
  }, [matrixError, toast]);

  // Loading state
  const isLoading =
    matrixLoading || assignLoading || removeLoading || bulkLoading;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Device Routing</h1>
        <p className="text-muted-foreground">
          Route network devices through service instances (Tor, Xray, etc.)
        </p>
      </div>

      {bulkProgress && (
        <div className="mb-4 rounded-md border border-primary bg-primary/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Bulk Assignment Progress: {bulkProgress.percentage}%
            </span>
            <span className="text-sm text-muted-foreground">
              {bulkProgress.successful}/{bulkProgress.total} completed
            </span>
          </div>
        </div>
      )}

      {matrix ? (
        <DeviceRoutingMatrix
          routerId={routerId}
          matrix={matrix as any}
          actions={actions}
          loading={isLoading}
          error={matrixError}
          showSummary
        />
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading devices...</p>
        </div>
      )}
    </div>
  );
}
