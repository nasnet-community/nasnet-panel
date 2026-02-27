/**
 * DHCP Server Configuration Card Component
 * Displays DHCP server configuration including pool range and lease time
 *
 * Epic 0.5: DHCP Management - Story 0.5.1
 */

import * as React from 'react';

import type { DHCPServer, DHCPPool } from '@nasnet/core/types';
import { formatLeaseTime } from '@nasnet/core/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives';

import { cn } from '@nasnet/ui/utils';

export interface DHCPServerCardProps {
  /** DHCP server configuration */
  server: DHCPServer;

  /** Address pool referenced by the server */
  pool?: DHCPPool;

  /** Additional CSS classes */
  className?: string;
}

/**
 * DHCPServerCard Component
 * Displays DHCP server configuration with pool range and lease time
 *
 * Features:
 * - Server name and interface/bridge display
 * - Address pool range (resolved from pool reference)
 * - Human-readable lease time formatting
 * - Authoritative badge when enabled
 * - Dark/light theme support via Tailwind
 *
 * @example
 * ```tsx
 * <DHCPServerCard server={dhcpServer} pool={addressPool} />
 * ```
 */
const DHCPServerCardComponent = React.forwardRef<HTMLDivElement, DHCPServerCardProps>(
  ({ server, pool, className }, ref) => {
    // Format lease time to human-readable string
    const formattedLeaseTime = formatLeaseTime(server.leaseTime);

    // Resolve pool range from pool reference
    const poolRange = pool?.ranges.join(', ') || 'Not configured';

    return (
      <Card
        ref={ref}
        className={cn(
          'rounded-card-sm md:rounded-card-lg shadow-sm transition-shadow hover:shadow-md',
          className
        )}
        role="article"
        aria-label={`DHCP Server Configuration for ${server.name}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className={cn('text-lg font-semibold', 'text-slate-900 dark:text-slate-50')}>
              {server.name}
            </CardTitle>
            {server.authoritative && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                  'bg-info/10 text-info ring-info/20 ring-1 ring-inset',
                  'dark:bg-info/20 dark:text-sky-400'
                )}
                role="status"
                aria-label="Server is authoritative"
              >
                Authoritative
              </span>
            )}
          </div>
          <CardDescription className={cn('text-sm', 'text-slate-500 dark:text-slate-400')}>
            DHCP Server Configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            <div className="flex items-center justify-between py-3">
              <span className={cn('text-sm font-medium', 'text-slate-500 dark:text-slate-400')}>
                Interface
              </span>
              <span className={cn('text-sm font-semibold', 'text-slate-900 dark:text-slate-50')}>
                {server.interface}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className={cn('text-sm font-medium', 'text-slate-500 dark:text-slate-400')}>
                Lease Time
              </span>
              <span className={cn('text-sm font-semibold', 'text-slate-900 dark:text-slate-50')}>
                {formattedLeaseTime}
              </span>
            </div>

            <div className="flex items-start justify-between py-3">
              <span className={cn('text-sm font-medium', 'text-slate-500 dark:text-slate-400')}>
                Pool Range
              </span>
              <span
                className={cn(
                  'text-right text-sm font-semibold',
                  'text-slate-900 dark:text-slate-50'
                )}
              >
                {poolRange}
              </span>
            </div>

            {server.disabled && (
              <div className="pt-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                    'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10',
                    'dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-400/20'
                  )}
                  role="status"
                  aria-label="Server is disabled"
                >
                  Server Disabled
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

DHCPServerCardComponent.displayName = 'DHCPServerCard';

export const DHCPServerCard = React.memo(DHCPServerCardComponent);
