/**
 * VPN Protocol Stats Card Component
 * Displays statistics for a single VPN protocol
 * Based on UX Design - Direction 2: Card-Heavy Dashboard
 */

import * as React from 'react';

import type { VPNProtocolStats } from '@nasnet/core/types';
import { formatBytes } from '@nasnet/core/utils';
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
export function VPNProtocolStatsCard({
  stats,
  onClick,
  compact = false,
  className = '',
}: VPNProtocolStatsCardProps) {
  const hasServers = stats.serverCount > 0;
  const hasClients = stats.clientCount > 0;
  const isActive = stats.activeServerConnections > 0 || stats.activeClientConnections > 0;

  return (
    <Card
      className={`
        transition-all duration-200 overflow-hidden
        ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
        ${isActive ? 'border-success/30 dark:border-success/20' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <CardContent className={compact ? 'p-4' : 'p-5'}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <ProtocolIconBadge protocol={stats.protocol} variant={compact ? 'sm' : 'md'} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {getProtocolLabel(stats.protocol)}
            </h3>
            {isActive && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} gap-3`}>
          {/* Servers */}
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-foreground">
              {stats.serverCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.serverCount === 1 ? 'Server' : 'Servers'}
            </p>
          </div>

          {/* Clients */}
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold text-foreground">
              {stats.clientCount}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.clientCount === 1 ? 'Client' : 'Clients'}
            </p>
          </div>

          {!compact && (
            <>
              {/* Active Connections */}
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-lg font-bold text-foreground">
                  {stats.activeServerConnections + stats.activeClientConnections}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>

              {/* Traffic */}
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <p className="text-sm font-bold text-foreground truncate">
                  {formatBytes(stats.totalRx + stats.totalTx)}
                </p>
                <p className="text-xs text-muted-foreground">Traffic</p>
              </div>
            </>
          )}
        </div>

        {/* Connection Details (non-compact) */}
        {!compact && (hasServers || hasClients) && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex justify-between text-xs text-muted-foreground">
              {hasServers && (
                <span>
                  {stats.activeServerConnections} server {stats.activeServerConnections === 1 ? 'conn' : 'conns'}
                </span>
              )}
              {hasClients && (
                <span>
                  {stats.activeClientConnections} client {stats.activeClientConnections === 1 ? 'conn' : 'conns'}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

