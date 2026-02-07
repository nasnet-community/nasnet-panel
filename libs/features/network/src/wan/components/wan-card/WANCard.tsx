/**
 * WAN Card Component
 *
 * Composite card displaying WAN interface status, health, and connection details.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 8: Overview Integration)
 */

import { StatusCard } from '@nasnet/ui/patterns';
import { StatusBadge } from '@nasnet/ui/patterns';
import { Badge } from '@nasnet/ui/primitives';
import {
  Globe,
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Network,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WANInterfaceData } from '../../types/wan.types';
import {
  getHealthStatusColor,
  getConnectionStatusColor,
} from '../../hooks/useWANSubscription';

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
export function WANCard({ wan, onConfigure, onViewDetails }: WANCardProps) {
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

  const typeBadge = getConnectionTypeBadge();

  return (
    <StatusCard
      title={wan.interfaceName}
      status={isConnected ? 'online' : 'offline'}
      icon={isConnected ? <Globe className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
      actions={
        <div className="flex gap-2">
          {onConfigure && (
            <button
              onClick={() => onConfigure(wan.id)}
              className="text-xs text-primary hover:underline"
              aria-label={`Configure ${wan.interfaceName}`}
            >
              Configure
            </button>
          )}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(wan.id)}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              aria-label={`View details for ${wan.interfaceName}`}
            >
              Details
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Connection Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusBadge
              status={wan.status.toLowerCase()}
              variant={getConnectionStatusColor(wan.status)}
            />
            <Badge {...typeBadge}>
              {typeBadge.icon}
              <span className="ml-1">{wan.connectionType}</span>
            </Badge>
          </div>

          {/* Health Status (if enabled) */}
          {hasHealthCheck && (
            <div className="flex items-center gap-2">
              <Activity
                className={`h-4 w-4 ${
                  isHealthy ? 'text-success' : 'text-warning'
                }`}
              />
              <StatusBadge
                status={wan.healthStatus.toLowerCase()}
                variant={getHealthStatusColor(wan.healthStatus)}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* IP Information */}
        {isConnected && (
          <div className="space-y-2 text-sm">
            {wan.publicIP && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Public IP:</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {wan.publicIP}
                </code>
              </div>
            )}

            {wan.gateway && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gateway:</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {wan.gateway}
                </code>
              </div>
            )}

            {wan.primaryDNS && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">DNS:</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {wan.primaryDNS}
                  {wan.secondaryDNS && `, ${wan.secondaryDNS}`}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Uptime */}
        {isConnected && wan.lastConnected && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="h-3 w-3" />
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
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center justify-between">
              <span>Health target:</span>
              <code className="font-mono text-[10px]">{wan.healthTarget}</code>
            </div>
            {wan.healthLatency && wan.healthLatency > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span>Latency:</span>
                <span className="font-mono text-[10px]">
                  {wan.healthLatency}ms
                </span>
              </div>
            )}
          </div>
        )}

        {/* Default Route Indicator */}
        {wan.isDefaultRoute && (
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="text-[10px]">
              <Network className="h-3 w-3 mr-1" />
              Default Route
            </Badge>
          </div>
        )}

        {/* Disconnected State */}
        {!isConnected && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <WifiOff className="h-3 w-3" />
              <span>Not connected</span>
            </div>
            {wan.lastConnected && (
              <div className="mt-1">
                Last connected{' '}
                {formatDistanceToNow(new Date(wan.lastConnected), {
                  addSuffix: true,
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </StatusCard>
  );
}

/**
 * Compact WAN Card for mobile/narrow views
 */
export function WANCardCompact({ wan, onConfigure, onViewDetails }: WANCardProps) {
  const isConnected = wan.status === 'CONNECTED';

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Globe className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-sm">{wan.interfaceName}</h3>
        </div>
        <StatusBadge
          status={wan.status.toLowerCase()}
          variant={getConnectionStatusColor(wan.status)}
          size="sm"
        />
      </div>

      {/* IP Info */}
      {isConnected && wan.publicIP && (
        <div className="text-xs">
          <code className="font-mono bg-muted px-2 py-1 rounded">
            {wan.publicIP}
          </code>
        </div>
      )}

      {/* Type Badge */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">
          {wan.connectionType}
        </Badge>

        {/* Actions */}
        <div className="flex gap-2">
          {onConfigure && (
            <button
              onClick={() => onConfigure(wan.id)}
              className="text-xs text-primary hover:underline"
            >
              Configure
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
