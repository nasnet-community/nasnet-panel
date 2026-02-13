/**
 * LeaseCard Skeleton Component
 *
 * Loading skeleton for the LeaseCard component.
 * Displays placeholder content while lease data is loading.
 * Part of NAS-6.11: DHCP Lease Management
 *
 * @module @nasnet/features/network/dhcp/lease-card
 */

import * as React from 'react';

import { cn, Card, Skeleton } from '@nasnet/ui/primitives';

export interface LeaseCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loader for LeaseCard
 *
 * Matches the layout of the actual LeaseCard component
 * to prevent layout shift when data loads.
 */
export function LeaseCardSkeleton({ className }: LeaseCardSkeletonProps) {
  return (
    <Card
      className={cn(
        'border-b border-border last:border-b-0 rounded-none',
        className
      )}
      aria-busy="true"
      aria-label="Loading lease information"
    >
      <div className="px-4 py-3 flex items-start gap-3 min-h-[44px]">
        {/* Avatar skeleton */}
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* IP address line */}
          <Skeleton className="h-5 w-32" />

          {/* Hostname line */}
          <Skeleton className="h-4 w-24" />

          {/* MAC + Status line */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        {/* Chevron skeleton */}
        <Skeleton className="h-5 w-5 flex-shrink-0 mt-1" />
      </div>
    </Card>
  );
}
