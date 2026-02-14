import { Badge } from '@nasnet/ui/primitives';
import { GatewayState, formatUptime, type GatewayInfo } from '@nasnet/api-client/queries';
import type { GatewayStatusCardProps } from './GatewayStatusCard';

/**
 * Desktop gateway status card with inline dense layout.
 * Optimized for power users with all info visible at once.
 */
export function GatewayStatusCardDesktop({
  gateway,
  instanceId,
  serviceName,
}: GatewayStatusCardProps) {
  const stateColorMap: Record<GatewayState, string> = {
    [GatewayState.RUNNING]: 'bg-semantic-success text-semantic-success-fg',
    [GatewayState.STOPPED]: 'bg-semantic-muted text-semantic-muted-fg',
    [GatewayState.ERROR]: 'bg-semantic-error text-semantic-error-fg',
    [GatewayState.NOT_NEEDED]: 'bg-semantic-muted text-semantic-muted-fg',
  };

  const stateLabel: Record<GatewayState, string> = {
    [GatewayState.RUNNING]: 'Running',
    [GatewayState.STOPPED]: 'Stopped',
    [GatewayState.ERROR]: 'Error',
    [GatewayState.NOT_NEEDED]: 'Not Needed',
  };

  return (
    <div
      className="flex items-center gap-4 rounded-md border border-border bg-surface px-4 py-2"
      role="status"
      aria-label={`Gateway status for ${serviceName}`}
    >
      {/* State badge */}
      <Badge className={stateColorMap[gateway.state]} aria-label="Gateway state">
        {stateLabel[gateway.state]}
      </Badge>

      {/* TUN interface name */}
      {gateway.tunName && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Interface:</span>
          <code className="rounded bg-surface-muted px-2 py-0.5 font-mono text-xs text-text">
            {gateway.tunName}
          </code>
        </div>
      )}

      {/* Process ID */}
      {gateway.pid != null && gateway.pid > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">PID:</span>
          <code className="font-mono text-xs text-text">{gateway.pid}</code>
        </div>
      )}

      {/* Uptime */}
      {gateway.uptime != null && gateway.uptime > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Uptime:</span>
          <span className="font-mono text-xs text-text">
            {formatUptime(gateway.uptime)}
          </span>
        </div>
      )}

      {/* Error message */}
      {gateway.state === GatewayState.ERROR && gateway.errorMessage && (
        <div className="ml-auto flex items-center gap-2 text-sm text-semantic-error">
          <span className="text-xs">{gateway.errorMessage}</span>
        </div>
      )}

      {/* Health check indicator */}
      {gateway.lastHealthCheck && gateway.state === GatewayState.RUNNING && (
        <div
          className="ml-auto flex items-center gap-1"
          title={`Last checked: ${new Date(gateway.lastHealthCheck).toLocaleString()}`}
        >
          <div className="h-2 w-2 rounded-full bg-semantic-success animate-pulse" aria-hidden="true" />
          <span className="text-xs text-text-muted">Healthy</span>
        </div>
      )}
    </div>
  );
}
