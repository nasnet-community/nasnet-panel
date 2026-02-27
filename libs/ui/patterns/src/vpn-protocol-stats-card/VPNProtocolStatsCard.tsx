/**
 * VPN Protocol Stats Card Component
 * Displays statistics for a single VPN protocol
 * Based on UX Design - Direction 2: Card-Heavy Dashboard
 *
 * @example
 * ```tsx
 * <VPNProtocolStatsCard
 *   stats={{
 *     protocol: 'wireguard',
 *     serverCount: 2,
 *     clientCount: 3,
 *     activeServerConnections: 8,
 *     activeClientConnections: 2,
 *     totalRx: 1024000,
 *     totalTx: 512000,
 *   }}
 *   onClick={() => navigate('/vpn/wireguard')}
 * />
 * ```
 */

import * as React from 'react';
import { forwardRef, useCallback } from 'react';

import type { VPNProtocolStats } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
import { cn } from '@nasnet/ui/utils';
import { Card, CardContent } from '@nasnet/ui/primitives';

import { ProtocolIconBadge, getProtocolLabel } from '../protocol-icon';

export interface VPNProtocolStatsCardProps {
  /** Protocol statistics */
  stats: VPNProtocolStats;
  /** Optional click handler */
  onClick?: () => void;
  /** Show compact version */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * VPNProtocolStatsCard Component
 * Shows server/client counts, active connections, and traffic for a protocol
 */
function VPNProtocolStatsCardComponent({
  stats,
  onClick,
  compact = false,
  className = '',
}: VPNProtocolStatsCardProps) {
  const hasServers = stats.serverCount > 0;
  const hasClients = stats.clientCount > 0;
  const isActive = stats.activeServerConnections > 0 || stats.activeClientConnections > 0;

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
        isActive && 'border-success/30 dark:border-success/20',
        className
      )}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      aria-label={`${getProtocolLabel(stats.protocol)} statistics`}
    >
      <CardContent className={compact ? 'p-component-md' : 'p-component-lg'}>
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <ProtocolIconBadge
            protocol={stats.protocol}
            variant={compact ? 'sm' : 'md'}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground truncate font-semibold">
              {getProtocolLabel(stats.protocol)}
            </h3>
            {isActive && (
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full" />
                <span className="text-success text-xs font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-3`}>
          {/* Servers */}
          <div className="bg-muted/50 rounded-[var(--semantic-radius-input)] p-2 text-center">
            <p className="text-foreground text-lg font-bold">{stats.serverCount}</p>
            <p className="text-muted-foreground text-xs">
              {stats.serverCount === 1 ? 'Server' : 'Servers'}
            </p>
          </div>

          {/* Clients */}
          <div className="bg-muted/50 rounded-[var(--semantic-radius-input)] p-2 text-center">
            <p className="text-foreground text-lg font-bold">{stats.clientCount}</p>
            <p className="text-muted-foreground text-xs">
              {stats.clientCount === 1 ? 'Client' : 'Clients'}
            </p>
          </div>

          {!compact && (
            <>
              {/* Active Connections */}
              <div className="bg-muted/50 rounded-[var(--semantic-radius-input)] p-2 text-center">
                <p className="text-foreground text-lg font-bold">
                  {stats.activeServerConnections + stats.activeClientConnections}
                </p>
                <p className="text-muted-foreground text-xs">Active</p>
              </div>

              {/* Traffic */}
              <div className="bg-muted/50 rounded-[var(--semantic-radius-input)] p-2 text-center">
                <p className="text-foreground truncate text-sm font-bold">
                  {formatBytes(stats.totalRx + stats.totalTx)}
                </p>
                <p className="text-muted-foreground text-xs">Traffic</p>
              </div>
            </>
          )}
        </div>

        {/* Connection Details (non-compact) */}
        {!compact && (hasServers || hasClients) && (
          <div className="border-border mt-4 border-t pt-3">
            <div className="text-muted-foreground flex justify-between text-xs">
              {hasServers && (
                <span>
                  {stats.activeServerConnections} server{' '}
                  {stats.activeServerConnections === 1 ? 'conn' : 'conns'}
                </span>
              )}
              {hasClients && (
                <span>
                  {stats.activeClientConnections} client{' '}
                  {stats.activeClientConnections === 1 ? 'conn' : 'conns'}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const VPNProtocolStatsCard = React.memo(
  forwardRef<HTMLDivElement, VPNProtocolStatsCardProps>((props, ref) => (
    <VPNProtocolStatsCardComponent {...props} />
  ))
);

VPNProtocolStatsCard.displayName = 'VPNProtocolStatsCard';
