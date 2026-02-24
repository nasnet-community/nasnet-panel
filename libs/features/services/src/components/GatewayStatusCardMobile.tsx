import { memo, useState, useCallback } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, cn, Icon } from '@nasnet/ui/primitives';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GatewayState, formatUptime, type GatewayInfo } from '@nasnet/api-client/queries';
import type { GatewayStatusCardProps } from './GatewayStatusCard';

/**
 * Mobile gateway status card with collapsible details.
 * Optimized for touch with 44px touch targets and progressive disclosure.
 *
 * @example
 * ```tsx
 * <GatewayStatusCardMobile
 *   gateway={gatewayData}
 *   instanceId="tor-gateway-1"
 *   serviceName="Tor Browser"
 * />
 * ```
 */
export const GatewayStatusCardMobile = memo(function GatewayStatusCardMobile({
  gateway,
  instanceId,
  serviceName,
}: GatewayStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const stateColorMap: Record<GatewayState, string> = {
    [GatewayState.RUNNING]: 'bg-success text-success-foreground',
    [GatewayState.STOPPED]: 'bg-muted text-muted-foreground',
    [GatewayState.ERROR]: 'bg-error text-error-foreground',
    [GatewayState.NOT_NEEDED]: 'bg-muted text-muted-foreground',
  };

  const stateLabel: Record<GatewayState, string> = {
    [GatewayState.RUNNING]: 'Running',
    [GatewayState.STOPPED]: 'Stopped',
    [GatewayState.ERROR]: 'Error',
    [GatewayState.NOT_NEEDED]: 'Not Needed',
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className={stateColorMap[gateway.state]} aria-label="Gateway state">
              {stateLabel[gateway.state]}
            </Badge>
            {gateway.state === GatewayState.RUNNING && (
              <div
                className="h-2 w-2 rounded-full bg-success animate-pulse"
                aria-hidden="false"
                role="status"
                aria-label="Gateway is healthy"
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleExpand}
            className="h-11 w-11 p-0"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 pt-0">
          {/* TUN interface name */}
          {gateway.tunName && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">TUN Interface</span>
              <code className="rounded bg-muted px-3 py-2 font-mono text-sm text-foreground">
                {gateway.tunName}
              </code>
            </div>
          )}

          {/* Process ID - technical data with monospace font */}
          {gateway.pid != null && gateway.pid > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Process ID</span>
              <code className="font-mono text-sm text-foreground">{gateway.pid}</code>
            </div>
          )}

          {/* Uptime */}
          {gateway.uptime != null && gateway.uptime > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Uptime</span>
              <span className="font-mono text-sm text-foreground">
                {formatUptime(gateway.uptime)}
              </span>
            </div>
          )}

          {/* Last health check */}
          {gateway.lastHealthCheck && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Last Health Check</span>
              <span className="text-sm text-foreground">
                {new Date(gateway.lastHealthCheck).toLocaleString()}
              </span>
            </div>
          )}

          {/* Error message */}
          {gateway.state === GatewayState.ERROR && gateway.errorMessage && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-error">Error Message</span>
              <p className="text-sm text-error">{gateway.errorMessage}</p>
            </div>
          )}

          {/* Service info */}
          <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Service Instance</span>
            <span className="text-sm text-foreground">{serviceName}</span>
            <code className="mt-1 font-mono text-xs text-muted-foreground">{instanceId}</code>
          </div>
        </CardContent>
      )}
    </Card>
  );
});

GatewayStatusCardMobile.displayName = 'GatewayStatusCardMobile';
