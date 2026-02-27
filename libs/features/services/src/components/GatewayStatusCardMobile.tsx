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
      <CardHeader className="pb-component-sm">
        <div className="flex items-center justify-between">
          <div className="gap-component-md flex items-center">
            <Badge
              className={stateColorMap[gateway.state]}
              aria-label="Gateway state"
            >
              {stateLabel[gateway.state]}
            </Badge>
            {gateway.state === GatewayState.RUNNING && (
              <div
                className="bg-success h-2 w-2 animate-pulse rounded-full"
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
            {isExpanded ?
              <ChevronUp
                className="h-5 w-5"
                aria-hidden="true"
              />
            : <ChevronDown
                className="h-5 w-5"
                aria-hidden="true"
              />
            }
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-component-md pt-0">
          {/* TUN interface name */}
          {gateway.tunName && (
            <div className="gap-component-xs flex flex-col">
              <span className="text-muted-foreground text-xs">TUN Interface</span>
              <code className="bg-muted px-component-sm py-component-xs text-foreground rounded font-mono text-sm">
                {gateway.tunName}
              </code>
            </div>
          )}

          {/* Process ID - technical data with monospace font */}
          {gateway.pid != null && gateway.pid > 0 && (
            <div className="gap-component-xs flex flex-col">
              <span className="text-muted-foreground text-xs">Process ID</span>
              <code className="text-foreground font-mono text-sm">{gateway.pid}</code>
            </div>
          )}

          {/* Uptime */}
          {gateway.uptime != null && gateway.uptime > 0 && (
            <div className="gap-component-xs flex flex-col">
              <span className="text-muted-foreground text-xs">Uptime</span>
              <span className="text-foreground font-mono text-sm">
                {formatUptime(gateway.uptime)}
              </span>
            </div>
          )}

          {/* Last health check */}
          {gateway.lastHealthCheck && (
            <div className="gap-component-xs flex flex-col">
              <span className="text-muted-foreground text-xs">Last Health Check</span>
              <span className="text-foreground text-sm">
                {new Date(gateway.lastHealthCheck).toLocaleString()}
              </span>
            </div>
          )}

          {/* Error message */}
          {gateway.state === GatewayState.ERROR && gateway.errorMessage && (
            <div className="gap-component-xs flex flex-col">
              <span className="text-error text-xs">Error Message</span>
              <p className="text-error text-sm">{gateway.errorMessage}</p>
            </div>
          )}

          {/* Service info */}
          <div className="mt-component-lg gap-component-xs border-border pt-component-md flex flex-col border-t">
            <span className="text-muted-foreground text-xs">Service Instance</span>
            <span className="text-foreground text-sm">{serviceName}</span>
            <code className="mt-component-xs text-muted-foreground font-mono text-xs">
              {instanceId}
            </code>
          </div>
        </CardContent>
      )}
    </Card>
  );
});

GatewayStatusCardMobile.displayName = 'GatewayStatusCardMobile';
