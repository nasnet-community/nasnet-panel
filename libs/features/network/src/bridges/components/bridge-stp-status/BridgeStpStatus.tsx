import { memo, useMemo } from 'react';
import {
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Skeleton,
} from '@nasnet/ui/primitives';
import { AlertCircle, Shield, Network, Activity } from 'lucide-react';
import { useBridgeDetail, useBridgeStpStatus } from '@nasnet/api-client/queries';
import { StpPortTable } from './StpPortTable';
import { format } from 'date-fns';

/**
 * Bridge STP Status Component - Real-time spanning tree monitoring
 * Features:
 * - Bridge-level STP info (root bridge, topology changes)
 * - Per-port STP table (role, state, cost, edge)
 * - Real-time updates via GraphQL subscription
 *
 * @description Shows real-time spanning tree protocol status including root bridge ID,
 * path cost, and per-port role/state information.
 *
 * @param bridgeId - Bridge UUID
 * @param className - Optional CSS class for styling
 */
export interface BridgeStpStatusProps {
  bridgeId: string;
  className?: string;
}

function BridgeStpStatusComponent({ bridgeId, className }: BridgeStpStatusProps) {
  // Fetch bridge detail with STP status
  const { bridge, loading, error } = useBridgeDetail(bridgeId);

  // Subscribe to real-time STP status updates
  const { stpStatus: liveStpStatus } = useBridgeStpStatus(bridgeId);

  // Use live status if available, otherwise use bridge data
  const stpStatus = useMemo(() => liveStpStatus || bridge?.stpStatus, [liveStpStatus, bridge?.stpStatus]);

  // Check if STP is enabled
  const stpEnabled = useMemo(() => bridge?.protocol && bridge.protocol !== 'none', [bridge?.protocol]);

  if (loading) {
    return (
      <div className="space-y-component-lg">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Icon icon={AlertCircle} className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          Failed to load STP status: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!bridge) {
    return (
      <Alert>
        <Icon icon={AlertCircle} className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>Bridge not found</AlertDescription>
      </Alert>
    );
  }

  if (!stpEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-component-sm">
            <Icon icon={Shield} className="h-5 w-5 text-category-networking" aria-hidden="true" />
            Spanning Tree Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Icon icon={AlertCircle} className="h-4 w-4 text-info" aria-hidden="true" />
            <AlertDescription>
              STP is disabled for this bridge. Set the protocol to STP, RSTP, or MSTP to enable
              spanning tree.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Bridge-Level STP Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-component-sm">
            <Icon icon={Shield} className="h-5 w-5 text-category-networking" aria-hidden="true" />
            Spanning Tree Status
            <Badge variant="info" className="ml-auto font-mono text-xs font-medium">
              {bridge.protocol.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-component-lg">
          {/* Root Bridge Status */}
          <div className="flex items-center justify-between p-component-md rounded-card-sm border">
            <div className="flex items-center gap-component-md">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-pill ${
                  stpStatus?.rootBridge ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon icon={Network} className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium">Root Bridge</p>
                <p className="text-xs text-muted-foreground">
                  {stpStatus?.rootBridge ? 'This bridge is the root' : 'Not the root bridge'}
                </p>
              </div>
            </div>
            {stpStatus?.rootBridge ? (
              <Badge variant="success">Root</Badge>
            ) : (
              <Badge variant="secondary">Non-Root</Badge>
            )}
          </div>

          {/* Root Bridge ID */}
          {stpStatus?.rootBridgeId && (
            <div className="space-y-component-xs">
              <p className="text-sm font-medium">Root Bridge ID</p>
              <div className="font-mono text-xs bg-muted px-component-sm py-component-xs rounded-md break-all font-medium">
                {stpStatus.rootBridgeId}
              </div>
            </div>
          )}

          {/* Root Port (only show if not root bridge) */}
          {!stpStatus?.rootBridge && stpStatus?.rootPort && (
            <div className="space-y-component-xs">
              <p className="text-sm font-medium">Root Port</p>
              <Badge variant="info" className="font-mono font-medium">{stpStatus.rootPort}</Badge>
            </div>
          )}

          {/* Root Path Cost (only show if not root bridge) */}
          {!stpStatus?.rootBridge && stpStatus?.rootPathCost !== undefined && (
            <div className="space-y-component-xs">
              <p className="text-sm font-medium">Root Path Cost</p>
              <div className="font-mono text-xs bg-muted px-component-sm py-component-xs rounded-md font-medium">
                {stpStatus.rootPathCost}
              </div>
            </div>
          )}

          {/* Topology Changes */}
          <div className="flex items-center justify-between p-component-md rounded-card-sm border">
            <div className="flex items-center gap-component-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-primary/10 text-primary">
                <Icon icon={Activity} className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium">Topology Changes</p>
                {stpStatus?.lastTopologyChange ? (
                  <p className="text-xs text-muted-foreground">
                    Last change: {format(new Date(stpStatus.lastTopologyChange), 'PPp')}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No recent changes</p>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-xs font-medium">
              {stpStatus?.topologyChangeCount || 0}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Per-Port STP Table */}
      <Card>
        <CardHeader>
          <CardTitle>Port Spanning Tree Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StpPortTable ports={bridge.ports || []} />
        </CardContent>
      </Card>
    </div>
  );
}

BridgeStpStatusComponent.displayName = 'BridgeStpStatus';

export const BridgeStpStatus = memo(BridgeStpStatusComponent);
