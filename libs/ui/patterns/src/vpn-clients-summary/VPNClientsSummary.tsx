/**
 * VPN Clients Summary Component
 * Summary card showing connected VPN client count with expandable list
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * @example
 * ```tsx
 * <VPNClientsSummary
 *   connectedCount={3}
 *   clients={vpnClients}
 *   linkTo="/vpn"
 * />
 * ```
 */

import React, { memo, useState, useCallback } from 'react';
import { Shield, ChevronDown, Loader2, Wifi } from 'lucide-react';

import { Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Icon,
} from '@nasnet/ui/primitives';

import { ProtocolIconBadge } from '../protocol-icon';

import type { VPNProtocol } from '@nasnet/core/types';

/**
 * Connected VPN client info
 */
export interface ConnectedVPNClient {
  /** Client ID */
  id: string;
  /** Client/user name */
  name: string;
  /** VPN protocol */
  protocol: VPNProtocol;
  /** Remote IP address */
  remoteAddress?: string;
  /** Local/assigned IP address */
  localAddress?: string;
  /** Connection uptime */
  uptime?: string;
}

/**
 * VPNClientsSummary Props
 */
export interface VPNClientsSummaryProps {
  /** Total connected clients count */
  connectedCount: number;
  /** List of connected clients (show top 3-5) */
  clients?: ConnectedVPNClient[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Link to full VPN page */
  linkTo?: string;
  /** Maximum clients to show in collapsed view */
  maxVisible?: number;
  /** Custom className */
  className?: string;
}

/**
 * VPNClientsSummary Component
 * Shows VPN client summary with connected count and expandable client list
 */
function VPNClientsSummaryComponent({
  connectedCount,
  clients = [],
  isLoading = false,
  linkTo = '/vpn',
  maxVisible = 3,
  className = '',
}: VPNClientsSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasClients = clients.length > 0;
  const visibleClients = isExpanded ? clients : clients.slice(0, maxVisible);
  const hasMore = clients.length > maxVisible;

  const status = connectedCount > 0 ? 'connected' : 'disconnected';
  const statusColor = status === 'connected' ? 'text-success' : 'text-muted-foreground';
  const bgColor = status === 'connected'
    ? 'bg-success/10 dark:bg-success/20'
    : 'bg-muted';

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
              <Icon icon={Shield} className={`w-5 h-5 ${statusColor}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">VPN Clients</CardTitle>
              <p className={`text-sm ${statusColor} font-medium`}>
                {connectedCount} Connected
              </p>
            </div>
          </div>
          {linkTo && (
            <Link to={linkTo as '/'}>
              <Button variant="ghost" size="sm" className="gap-1">
                See All
                <Icon icon={ChevronDown} className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Icon icon={Loader2} className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasClients ? (
          <div className="space-y-2 mt-3">
            {visibleClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 dark:bg-muted/20"
              >
                <ProtocolIconBadge protocol={client.protocol} variant="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {client.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {client.localAddress && (
                      <span className="font-mono">{client.localAddress}</span>
                    )}
                    {client.uptime && (
                      <>
                        <span>•</span>
                        <span>{client.uptime}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                </div>
              </div>
            ))}

            {/* Show more/less toggle */}
            {hasMore && (
              <button
                onClick={handleToggleExpanded}
                className="w-full flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <>
                    <Icon icon={ChevronDown} className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <Icon icon={ChevronDown} className="w-4 h-4" />
                    Show {clients.length - maxVisible} More
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Icon icon={Wifi} className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No clients connected</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const VPNClientsSummary = memo(VPNClientsSummaryComponent);
VPNClientsSummary.displayName = 'VPNClientsSummary';

