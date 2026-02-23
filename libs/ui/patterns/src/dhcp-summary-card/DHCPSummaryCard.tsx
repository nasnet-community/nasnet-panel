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
        linkTo && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      role={linkTo ? 'link' : 'region'}
      aria-label={`${serverName} summary card`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'bg-info/10 dark:bg-info/20'
            )}>
              <Network
                className={cn('w-4 h-4', 'text-info')}
                aria-hidden="true"
              />
            </div>
            <CardTitle className="text-base font-semibold">{serverName}</CardTitle>
          </div>
          {linkTo && (
            <ChevronRight
              className={cn('w-4 h-4', 'text-muted-foreground')}
              aria-hidden="true"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div
            className="flex items-center justify-center py-4"
            role="status"
            aria-live="polite"
            aria-label="Loading DHCP summary"
          >
            <Loader2
              className={cn('w-6 h-6 animate-spin', 'text-muted-foreground')}
              aria-hidden="true"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Leases */}
            <div className="flex items-center gap-3">
              <Users
                className={cn('w-5 h-5', 'text-muted-foreground')}
                aria-hidden="true"
              />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {activeLeases}
                  {totalCapacity && (
                    <span className={cn('text-sm font-normal ml-1', 'text-muted-foreground')}>
                      / {totalCapacity}
                    </span>
                  )}
                </p>
                <p className={cn('text-xs', 'text-muted-foreground')}>Active Leases</p>
              </div>
            </div>

            {/* IP Range */}
            {ipRange && (
              <div className="pt-2 border-t border-border">
                <p className={cn('text-xs', 'text-muted-foreground')}>IP Range</p>
                <p
                  className={cn('text-sm font-mono truncate', 'text-foreground')}
                  title={ipRange}
                >
                  {ipRange}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (linkTo) {
    // Use type assertion for dynamic link props
    return (
      <Link to={linkTo as '/'} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

DHCPSummaryCardComponent.displayName = 'DHCPSummaryCard';

export const DHCPSummaryCard = React.memo(DHCPSummaryCardComponent);


















