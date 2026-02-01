/**
 * DHCP Client Status Card Component
 * Displays DHCP client status for WAN interfaces
 *
 * Epic 0.5: DHCP Management - Story 0.5.3
 */

import * as React from 'react';

import type { DHCPClient } from '@nasnet/core/types';
import { formatExpirationTime } from '@nasnet/core/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nasnet/ui/primitives';

import { StatusBadge } from '../status-badge';

export interface DHCPClientCardProps {
  /** DHCP client configuration and status */
  client: DHCPClient;

  /** Additional CSS classes */
  className?: string;
}

/**
 * DHCPClientCard Component
 * Displays DHCP client status on WAN interfaces
 *
 * Features:
 * - Interface name as card header
 * - Status badge (Bound, Searching, Requesting, Stopped)
 * - Obtained IP address (when bound)
 * - Gateway and DNS server information
 * - Lease expiration display
 * - "Searching..." placeholder state
 * - Dark/light theme support
 */
export const DHCPClientCard = React.forwardRef<HTMLDivElement, DHCPClientCardProps>(
  ({ client, className }, ref) => {
    const formattedExpiration = client.expiresAfter
      ? formatExpirationTime(client.expiresAfter)
      : 'N/A';

    const isSearching = client.status === 'searching' || client.status === 'requesting';
    const isBound = client.status === 'bound';

    return (
      <Card ref={ref} className={`rounded-card-sm md:rounded-card-lg shadow-sm transition-shadow hover:shadow-md ${className || ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {client.interface}
            </CardTitle>
            <StatusBadge status={client.status} />
          </div>
          <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
            WAN DHCP Client Status
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isSearching ? (
            <div className="flex items-center justify-center py-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-warning border-t-transparent" />
                <span>
                  {client.status === 'searching'
                    ? 'Searching for DHCP server...'
                    : 'Requesting IP address...'}
                </span>
              </div>
            </div>
          ) : isBound ? (
            <div className="space-y-0 divide-y divide-slate-200 dark:divide-slate-700">
              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">IP Address</span>
                <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">{client.address || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Gateway</span>
                <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">{client.gateway || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Primary DNS</span>
                <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">{client.primaryDns || 'N/A'}</span>
              </div>

              {client.secondaryDns && (
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Secondary DNS</span>
                  <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">{client.secondaryDns}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">DHCP Server</span>
                <span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-50">{client.dhcpServer || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lease Expires</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{formattedExpiration}</span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              DHCP Client {client.disabled ? 'Disabled' : 'Stopped'}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

DHCPClientCard.displayName = 'DHCPClientCard';
