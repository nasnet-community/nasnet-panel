import { memo, useMemo } from 'react';
import { useReducedMotion } from '@nasnet/core/utils';
import { AlertCircle } from 'lucide-react';
import { Badge, Icon } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { GatewayState, formatUptime, type GatewayInfo } from '@nasnet/api-client/queries';
import type { GatewayStatusCardProps } from './GatewayStatusCard';

/**
 * Desktop gateway status card with inline dense layout.
 * Optimized for power users with all info visible at once.
 *
 * @see docs/design/ux-design/6-component-library.md#status-indicators
 */
export const GatewayStatusCardDesktop = memo(function GatewayStatusCardDesktop({
  gateway,
  instanceId,
  serviceName,
  className,
}: GatewayStatusCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // Memoize state color and label maps
  const stateColorMap = useMemo(
    () => ({
      [GatewayState.RUNNING]: 'bg-success text-success-foreground',
      [GatewayState.STOPPED]: 'bg-muted text-muted-foreground',
      [GatewayState.ERROR]: 'bg-error text-error-foreground',
      [GatewayState.NOT_NEEDED]: 'bg-muted text-muted-foreground',
    }),
    []
  );

  const stateLabel = useMemo(
    () => ({
      [GatewayState.RUNNING]: 'Running',
      [GatewayState.STOPPED]: 'Stopped',
      [GatewayState.ERROR]: 'Error',
      [GatewayState.NOT_NEEDED]: 'Not Needed',
    }),
    []
  );

  return (
    <div
      className={cn(
        'gap-component-md border-border bg-card px-component-md py-component-sm flex items-center rounded-md border',
        className
      )}
      role="status"
      aria-label={`Gateway status for ${serviceName}`}
      aria-live="polite"
    >
      {/* State badge */}
      <Badge
        className={stateColorMap[gateway.state]}
        aria-label="Gateway state"
      >
        {stateLabel[gateway.state]}
      </Badge>

      {/* TUN interface name */}
      {gateway.tunName && (
        <div className="gap-component-sm flex items-center text-sm">
          <span className="text-muted-foreground">Interface:</span>
          <code className="bg-muted px-component-sm text-foreground rounded py-0.5 font-mono text-xs">
            {gateway.tunName}
          </code>
        </div>
      )}

      {/* Process ID */}
      {gateway.pid != null && gateway.pid > 0 && (
        <div className="gap-component-sm flex items-center text-sm">
          <span className="text-muted-foreground">PID:</span>
          <code
            className="text-foreground font-mono text-xs"
            aria-label={`Process ID ${gateway.pid}`}
          >
            {gateway.pid}
          </code>
        </div>
      )}

      {/* Uptime */}
      {gateway.uptime != null && gateway.uptime > 0 && (
        <div className="gap-component-sm flex items-center text-sm">
          <span className="text-muted-foreground">Uptime:</span>
          <span className="text-foreground font-mono text-xs">{formatUptime(gateway.uptime)}</span>
        </div>
      )}

      {/* Error message */}
      {gateway.state === GatewayState.ERROR && gateway.errorMessage && (
        <div
          className="gap-component-sm text-error ml-auto flex items-center text-sm"
          role="alert"
          aria-label={`Error: ${gateway.errorMessage}`}
        >
          <Icon
            icon={AlertCircle}
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span className="text-xs">{gateway.errorMessage}</span>
        </div>
      )}

      {/* Health check indicator */}
      {gateway.lastHealthCheck && gateway.state === GatewayState.RUNNING && (
        <div
          className="gap-component-xs ml-auto flex items-center"
          role="status"
          aria-label={`Healthy, last checked ${new Date(gateway.lastHealthCheck).toLocaleString()}`}
          title={`Last checked: ${new Date(gateway.lastHealthCheck).toLocaleString()}`}
        >
          <div
            className={cn(
              'bg-success h-2 w-2 rounded-full',
              !prefersReducedMotion && 'animate-pulse'
            )}
            aria-hidden="true"
          />
          <span className="text-muted-foreground text-xs">Healthy</span>
        </div>
      )}
    </div>
  );
});

GatewayStatusCardDesktop.displayName = 'GatewayStatusCardDesktop';
