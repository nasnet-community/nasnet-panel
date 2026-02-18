import { Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { Badge } from '@nasnet/ui/primitives';
import { Skeleton } from '@nasnet/ui/primitives';
import { Alert, AlertDescription } from '@nasnet/ui/primitives';
import { AlertCircle, Network, Shield, Activity } from 'lucide-react';
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
 * @param bridgeId - Bridge UUID
 */
export interface BridgeStpStatusProps {
  bridgeId: string;
}

export function BridgeStpStatus({ bridgeId }: BridgeStpStatusProps) {
  // Fetch bridge detail with STP status
  const { bridge, loading, error } = useBridgeDetail(bridgeId);

  // Subscribe to real-time STP status updates
  const { stpStatus: liveStpStatus } = useBridgeStpStatus(bridgeId);

  // Use live status if available, otherwise use bridge data
  const stpStatus = liveStpStatus || bridge?.stpStatus;

  // Check if STP is enabled
  const stpEnabled = bridge?.protocol && bridge.protocol !== 'none';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load STP status: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!bridge) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Bridge not found</AlertDescription>
      </Alert>
    );
  }

  if (!stpEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Spanning Tree Protocol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
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
    <div className="space-y-6">
      {/* Bridge-Level STP Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Spanning Tree Status
            <Badge variant="info" className="ml-auto">
              {bridge.protocol.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Root Bridge Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  stpStatus?.rootBridge ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}
              >
                <Network className="h-5 w-5" />
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
            <div className="space-y-1">
              <p className="text-sm font-medium">Root Bridge ID</p>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {stpStatus.rootBridgeId}
              </code>
            </div>
          )}

          {/* Root Port (only show if not root bridge) */}
          {!stpStatus?.rootBridge && stpStatus?.rootPort && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Root Port</p>
              <Badge variant="info">{stpStatus.rootPort}</Badge>
            </div>
          )}

          {/* Root Path Cost (only show if not root bridge) */}
          {!stpStatus?.rootBridge && stpStatus?.rootPathCost !== undefined && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Root Path Cost</p>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {stpStatus.rootPathCost}
              </code>
            </div>
          )}

          {/* Topology Changes */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Activity className="h-5 w-5" />
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
            <Badge variant="secondary" className="font-mono">
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
