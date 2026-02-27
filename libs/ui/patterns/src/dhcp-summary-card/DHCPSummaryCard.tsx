/**
 * DHCP Summary Card Component
 * Compact card showing active leases count and IP range
 * Based on UX Design Specification - Direction 4: Action-First
 *
 * Features:
 * - Active lease count display with capacity ratio
 * - IP address range visualization
 * - Loading state with spinner
 * - Optional link navigation with hover effects
 * - Dark/light theme support
 *
 * @example
 * ```tsx
 * <DHCPSummaryCard
 *   activeLeases={24}
 *   totalCapacity={100}
 *   ipRange="192.168.1.100-192.168.1.200"
 * />
 * ```
 */

import * as React from 'react';

import { Link } from '@tanstack/react-router';
import { Network, Users, ChevronRight, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

/**
 * DHCPSummaryCard Props
 */
export interface DHCPSummaryCardProps {
  /** Total number of active leases */
  activeLeases: number;
  /** Total number of leases (for capacity) */
  totalCapacity?: number;
  /** IP address range (e.g., "192.168.1.100-192.168.1.200") */
  ipRange?: string;
  /** Server name */
  serverName?: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Link to full DHCP page */
  linkTo?: string;
  /** Custom className */
  className?: string;
}

/**
 * DHCPSummaryCard Component
 * Shows DHCP server summary with active lease count and IP range
 */
function DHCPSummaryCardComponent({
  activeLeases,
  totalCapacity,
  ipRange,
  serverName = 'DHCP Server',
  isLoading = false,
  linkTo = '/dhcp',
  className = '',
}: DHCPSummaryCardProps) {
  const content = (
    <Card
      className={cn(
        'h-full transition-all duration-200',
        linkTo && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
      role={linkTo ? 'link' : 'region'}
      aria-label={`${serverName} summary card`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'bg-info/10 dark:bg-info/20'
              )}
            >
              <Network
                className={cn('h-4 w-4', 'text-info')}
                aria-hidden="true"
              />
            </div>
            <CardTitle className="text-base font-semibold">{serverName}</CardTitle>
          </div>
          {linkTo && (
            <ChevronRight
              className={cn('h-4 w-4', 'text-muted-foreground')}
              aria-hidden="true"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ?
          <div
            className="flex items-center justify-center py-4"
            role="status"
            aria-live="polite"
            aria-label="Loading DHCP summary"
          >
            <Loader2
              className={cn('h-6 w-6 animate-spin', 'text-muted-foreground')}
              aria-hidden="true"
            />
          </div>
        : <div className="space-y-3">
            {/* Active Leases */}
            <div className="flex items-center gap-3">
              <Users
                className={cn('h-5 w-5', 'text-muted-foreground')}
                aria-hidden="true"
              />
              <div>
                <p className="text-foreground text-2xl font-bold">
                  {activeLeases}
                  {totalCapacity && (
                    <span className={cn('ml-1 text-sm font-normal', 'text-muted-foreground')}>
                      / {totalCapacity}
                    </span>
                  )}
                </p>
                <p className={cn('text-xs', 'text-muted-foreground')}>Active Leases</p>
              </div>
            </div>

            {/* IP Range */}
            {ipRange && (
              <div className="border-border border-t pt-2">
                <p className={cn('text-xs', 'text-muted-foreground')}>IP Range</p>
                <p
                  className={cn('truncate font-mono text-sm', 'text-foreground')}
                  title={ipRange}
                >
                  {ipRange}
                </p>
              </div>
            )}
          </div>
        }
      </CardContent>
    </Card>
  );

  if (linkTo) {
    // Use type assertion for dynamic link props
    return (
      <Link
        to={linkTo as '/'}
        className="block"
      >
        {content}
      </Link>
    );
  }

  return content;
}

DHCPSummaryCardComponent.displayName = 'DHCPSummaryCard';

export const DHCPSummaryCard = React.memo(DHCPSummaryCardComponent);
