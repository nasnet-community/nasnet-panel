/**
 * WAN Card Component
 *
 * Composite card displaying WAN interface status, health, and connection details.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 8: Overview Integration)
 *
 * @description Displays comprehensive WAN interface information including connection type,
 * status, public IP, health monitoring status, and quick action buttons.
 */

import { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { Globe, Activity, Wifi, WifiOff, Clock, Network, Settings, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WANInterfaceData } from '../../types/wan.types';
import { getHealthStatusColor, getConnectionStatusColor } from '../../hooks/useWANSubscription';

export interface WANCardProps {
  wan: WANInterfaceData;
  onConfigure?: (wanId: string) => void;
  onViewDetails?: (wanId: string) => void;
}

/**
 * WAN Card - Shows comprehensive WAN interface information
 *
 * Displays:
 * - Connection status (CONNECTED, CONNECTING, DISCONNECTED, etc.)
 * - Health status (HEALTHY, DEGRADED, DOWN, UNKNOWN)
 * - Connection type (DHCP, PPPoE, Static IP, LTE)
 * - Public IP and gateway
 * - Uptime
 * - Quick actions
 */
const WANCardComponent = ({ wan, onConfigure, onViewDetails }: WANCardProps) => {
  const isConnected = wan.status === 'CONNECTED';
  const isHealthy = wan.healthStatus === 'HEALTHY';
  const hasHealthCheck = wan.healthEnabled;

  /**
   * Get connection type badge variant
   */
  const getConnectionTypeBadge = () => {
    switch (wan.connectionType) {
      case 'DHCP':
        return { variant: 'default' as const, icon: <Network className="h-3 w-3" /> };
      case 'PPPOE':
        return { variant: 'secondary' as const, icon: <Wifi className="h-3 w-3" /> };
      case 'STATIC_IP':
        return { variant: 'outline' as const, icon: <Settings className="h-3 w-3" /> };
      case 'LTE':
        return { variant: 'default' as const, icon: <TrendingUp className="h-3 w-3" /> };
      default:
        return { variant: 'outline' as const, icon: <Network className="h-3 w-3" /> };
    }
  };

  /**
   * Get health status badge variant
   */
  const getHealthStatusBadge = () => {
    switch (wan.healthStatus) {
      case 'HEALTHY':
        return 'success' as const;
      case 'DEGRADED':
        return 'warning' as const;
      case 'DOWN':
        return 'error' as const;
      default:
        return 'outline' as const;
    }
  };

  const typeBadge = getConnectionTypeBadge();

  const handleCardClick = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(wan.id);
    }
  }, [wan.id, onViewDetails]);

  const handleConfigureClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onConfigure) {
        onConfigure(wan.id);
      }
    },
    [wan.id, onConfigure]
  );

  return (
    <Card
      className={cn(onViewDetails && 'cursor-pointer transition-shadow hover:shadow-md')}
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="gap-component-sm flex items-center">
            {isConnected ?
              <Globe
                className="text-success h-5 w-5"
                aria-hidden="true"
              />
            : <WifiOff
                className="text-muted-foreground h-5 w-5"
                aria-hidden="true"
              />
            }
            <CardTitle>{wan.interfaceName}</CardTitle>
          </div>
          {onConfigure && (
            <button
              onClick={handleConfigureClick}
              className="text-primary text-xs hover:underline"
              aria-label={`Configure ${wan.interfaceName}`}
            >
              Configure
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-component-md">
          {/* Connection Info */}
          <div className="flex items-center justify-between">
            <div className="gap-component-sm flex items-center">
              <Badge
                variant={getConnectionStatusColor(wan.status) as any}
                className="text-xs"
              >
                {isConnected ?
                  <Globe
                    className="h-3 w-3"
                    aria-hidden="true"
                  />
                : <WifiOff
                    className="h-3 w-3"
                    aria-hidden="true"
                  />
                }
                <span className="ml-1">
                  {wan.status.charAt(0) + wan.status.slice(1).toLowerCase()}
                </span>
              </Badge>
              <Badge {...typeBadge}>
                {typeBadge.icon}
                <span className="ml-1">{wan.connectionType}</span>
              </Badge>
            </div>

            {/* Health Status (if enabled) */}
            {hasHealthCheck && (
              <div className="gap-component-sm flex items-center">
                <Activity
                  className={cn('h-4 w-4', isHealthy ? 'text-success' : 'text-warning')}
                  aria-hidden="true"
                />
                <Badge
                  variant={getHealthStatusColor(wan.healthStatus) as any}
                  className="text-xs"
                >
                  {wan.healthStatus.charAt(0) + wan.healthStatus.slice(1).toLowerCase()}
                </Badge>
              </div>
            )}
          </div>

          {/* IP Information */}
          {isConnected && (
            <div className="space-y-component-md text-sm">
              {wan.publicIP && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Public IP:</span>
                  <code className="bg-muted px-component-sm py-component-xs category-networking rounded-[var(--semantic-radius-button)] font-mono text-xs">
                    {wan.publicIP}
                  </code>
                </div>
              )}

              {wan.gateway && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gateway:</span>
                  <code className="bg-muted px-component-sm py-component-xs category-networking rounded-[var(--semantic-radius-button)] font-mono text-xs">
                    {wan.gateway}
                  </code>
                </div>
              )}

              {wan.primaryDNS && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">DNS:</span>
                  <code className="bg-muted px-component-sm py-component-xs category-networking rounded-[var(--semantic-radius-button)] font-mono text-xs">
                    {wan.primaryDNS}
                    {wan.secondaryDNS && (
                      <>
                        , <span className="font-mono">{wan.secondaryDNS}</span>
                      </>
                    )}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Uptime */}
          {isConnected && wan.lastConnected && (
            <div className="gap-component-md text-muted-foreground pt-component-md border-border flex items-center border-t text-xs">
              <Clock
                className="h-3 w-3"
                aria-hidden="true"
              />
              <span>
                Connected{' '}
                {formatDistanceToNow(new Date(wan.lastConnected), {
                  addSuffix: true,
                })}
              </span>
            </div>
          )}

          {/* Health Check Info */}
          {hasHealthCheck && wan.healthTarget && (
            <div className="text-muted-foreground pt-component-md border-border border-t text-xs">
              <div className="flex items-center justify-between">
                <span>Health target:</span>
                <code className="category-networking font-mono text-[10px]">
                  {wan.healthTarget}
                </code>
              </div>
              {wan.healthLatency && wan.healthLatency > 0 && (
                <div className="mt-1 flex items-center justify-between">
                  <span>Latency:</span>
                  <code className="category-networking font-mono text-[10px]">
                    {wan.healthLatency}ms
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Default Route Indicator */}
          {wan.isDefaultRoute && (
            <div className="pt-component-md border-border border-t">
              <Badge
                variant="secondary"
                className="text-[10px]"
              >
                <Network
                  className="mr-component-xs h-3 w-3"
                  aria-hidden="true"
                />
                Default Route
              </Badge>
            </div>
          )}

          {/* Disconnected State */}
          {!isConnected && (
            <div className="text-muted-foreground pt-component-md border-border border-t text-xs">
              <div className="gap-component-md flex items-center">
                <WifiOff
                  className="h-3 w-3"
                  aria-hidden="true"
                />
                <span>Not connected</span>
              </div>
              {wan.lastConnected && (
                <div className="mt-component-xs">
                  Last connected{' '}
                  {formatDistanceToNow(new Date(wan.lastConnected), {
                    addSuffix: true,
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

WANCardComponent.displayName = 'WANCard';

export const WANCard = memo(WANCardComponent);

/**
 * Compact WAN Card for mobile/narrow views
 */
const WANCardCompactComponent = ({ wan, onConfigure, onViewDetails }: WANCardProps) => {
  const isConnected = wan.status === 'CONNECTED';

  const handleConfigureClick = useCallback(() => {
    if (onConfigure) {
      onConfigure(wan.id);
    }
  }, [wan.id, onConfigure]);

  return (
    <div className="border-border p-component-md space-y-component-md rounded-[var(--semantic-radius-card)] border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="gap-component-md flex items-center">
          {isConnected ?
            <Globe
              className="text-success h-4 w-4"
              aria-hidden="true"
            />
          : <WifiOff
              className="text-muted-foreground h-4 w-4"
              aria-hidden="true"
            />
          }
          <h3 className="text-sm font-semibold">{wan.interfaceName}</h3>
        </div>
        <Badge
          variant={getConnectionStatusColor(wan.status) as any}
          className="text-xs"
        >
          {isConnected ?
            <Globe
              className="h-3 w-3"
              aria-hidden="true"
            />
          : <WifiOff
              className="h-3 w-3"
              aria-hidden="true"
            />
          }
          <span className="ml-component-xs">
            {wan.status.charAt(0) + wan.status.slice(1).toLowerCase()}
          </span>
        </Badge>
      </div>

      {/* IP Info */}
      {isConnected && wan.publicIP && (
        <div className="text-xs">
          <code className="bg-muted px-component-sm py-component-xs category-networking rounded-[var(--semantic-radius-button)] font-mono">
            {wan.publicIP}
          </code>
        </div>
      )}

      {/* Type Badge */}
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className="text-[10px]"
        >
          {wan.connectionType}
        </Badge>

        {/* Actions */}
        <div className="gap-component-sm flex">
          {onConfigure && (
            <button
              onClick={handleConfigureClick}
              className="text-primary text-xs hover:underline"
              aria-label={`Configure ${wan.interfaceName}`}
            >
              Configure
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

WANCardCompactComponent.displayName = 'WANCardCompact';

export const WANCardCompact = memo(WANCardCompactComponent);
