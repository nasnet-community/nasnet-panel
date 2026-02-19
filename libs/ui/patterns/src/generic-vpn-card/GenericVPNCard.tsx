/**
 * GenericVPNCard Component
 *
 * Displays generic VPN interface information (L2TP, PPTP, SSTP).
 * Story 0-4-4: Other VPN Type Viewer.
 *
 * @example
 * ```tsx
 * <GenericVPNCard vpnInterface={l2tpInterface} />
 * ```
 */

import React, { memo } from 'react';

import type { VPNInterface } from '@nasnet/core/types';
import { Card, CardHeader, CardTitle, CardContent } from '@nasnet/ui/primitives';

import { StatusIndicator } from '../status-indicator';

export interface GenericVPNCardProps {
  /** VPN interface data */
  vpnInterface: VPNInterface;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Generic VPN Card Component
 * Displays VPN interface name, type, status, and remote address
 * Supports L2TP, PPTP, and SSTP protocols
 *
 * @example
 * ```tsx
 * <GenericVPNCard vpnInterface={l2tpInterface} />
 * ```
 */
function GenericVPNCardComponent({ vpnInterface, onClick }: GenericVPNCardProps) {
  // Determine status for display
  const status = vpnInterface.disabled ? 'offline' : vpnInterface.running ? 'online' : 'warning';

  const statusLabel = vpnInterface.disabled
    ? 'Disabled'
    : vpnInterface.running
    ? 'Connected'
    : 'Disconnected';

  // Get protocol-specific label
  const protocolLabel = vpnInterface.type.toUpperCase();

  return (
    <Card
      onClick={onClick}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      className={`rounded-card-sm md:rounded-card-lg shadow-sm transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none' : ''
      }`}
      aria-label={`${vpnInterface.name} ${protocolLabel} VPN - ${statusLabel}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {vpnInterface.name}
            </CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <StatusIndicator status={status} label={statusLabel} />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {protocolLabel}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        <div className="divide-y divide-border">
          <div className="flex justify-between items-start py-3">
            <span className="text-sm font-medium text-muted-foreground">Remote Server</span>
            <span className="text-sm font-semibold text-foreground text-right">
              {vpnInterface.connectTo || 'Not configured'}
            </span>
          </div>

          {vpnInterface.user && (
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-muted-foreground">Username</span>
              <span className="text-sm font-mono font-semibold text-foreground">
                {vpnInterface.user}
              </span>
            </div>
          )}

          {vpnInterface.comment && (
            <div className="flex justify-between items-start py-3">
              <span className="text-sm font-medium text-muted-foreground">Comment</span>
              <span className="text-xs text-muted-foreground italic text-right max-w-xs">
                {vpnInterface.comment}
              </span>
            </div>
          )}

          {'verifyServerCertificate' in vpnInterface && vpnInterface.verifyServerCertificate !== undefined && (
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-medium text-muted-foreground">Verify Certificate</span>
              <span className="text-sm font-semibold text-foreground">
                {vpnInterface.verifyServerCertificate ? 'Yes' : 'No'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const GenericVPNCard = memo(GenericVPNCardComponent);
GenericVPNCard.displayName = 'GenericVPNCard';
