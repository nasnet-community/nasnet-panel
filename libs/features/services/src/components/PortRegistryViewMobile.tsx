/**
 * PortRegistryViewMobile Component
 *
 * Mobile presenter for port registry (<640px viewports).
 * Implements touch-optimized card layout with collapsible groups.
 *
 * Features:
 * - Card-based layout grouped by service type
 * - Collapsible sections with Radix Collapsible
 * - 44px minimum touch targets (WCAG AAA)
 * - Badge components for port and protocol
 * - Bottom padding for mobile navigation
 * - Pull-to-refresh support
 *
 * @see NAS-8.16: Port Conflict Detection
 * @see Docs/design/PLATFORM_PRESENTER_GUIDE.md
 */

import React, { memo, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Network, RefreshCw } from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { usePortAllocations } from '@nasnet/api-client/queries';
import type { PortAllocation } from '@nasnet/api-client/generated';

/**
 * PortRegistryViewMobile props
 */
export interface PortRegistryViewMobileProps {
  /** Router ID to display allocations for */
  routerId: string;

  /** Optional className for styling */
  className?: string;
}

/**
 * Format timestamp to relative time (mobile-friendly short format)
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * PortCard component
 * Individual port allocation card optimized for mobile with 44px touch targets
 */
interface PortCardProps {
  allocation: PortAllocation;
}

const PortCard = memo(function PortCard({ allocation }: PortCardProps) {
  return (
    <Card className="p-4 touch-manipulation">
      <div className="flex items-center justify-between min-h-[44px]">
        {/* Left: Port and Protocol badges */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-base px-3 py-1"
          >
            {allocation.port}
          </Badge>
          <Badge
            variant={allocation.protocol === 'TCP' ? 'secondary' : 'default'}
            className="uppercase text-xs"
          >
            {allocation.protocol}
          </Badge>
        </div>

        {/* Right: Timestamp */}
        <span className="text-xs text-muted-foreground shrink-0 ml-2">
          {formatRelativeTime(allocation.allocatedAt)}
        </span>
      </div>

      {/* Instance ID */}
      <div className="mt-3">
        <div className="text-xs text-muted-foreground">Instance</div>
        <div className="text-sm font-medium truncate">
          {allocation.instanceID}
        </div>
      </div>

      {/* Notes (if present) */}
      {allocation.notes && (
        <div className="mt-2">
          <div className="text-xs text-muted-foreground">Purpose</div>
          <div className="text-sm line-clamp-2">{allocation.notes}</div>
        </div>
      )}
    </Card>
  );
});

PortCard.displayName = 'PortCard';

/**
 * ServiceGroup component
 * Collapsible group of port allocations for a service type with 44px touch targets
 */
interface ServiceGroupProps {
  serviceType: string;
  allocations: PortAllocation[];
  defaultOpen?: boolean;
}

const ServiceGroup = memo(function ServiceGroup({
  serviceType,
  allocations,
  defaultOpen = true,
}: ServiceGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        {/* Collapsible Trigger - 44px minimum height */}
        <Collapsible.Trigger asChild>
          <button
            className="w-full p-4 flex items-center justify-between min-h-[44px] touch-manipulation hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            aria-label={`Toggle ${serviceType} ports`}
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-semibold">
                {serviceType}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {allocations.length} {allocations.length === 1 ? 'port' : 'ports'}
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            )}
          </button>
        </Collapsible.Trigger>

        {/* Collapsible Content */}
        <Collapsible.Content>
          <div className="px-4 pb-4 space-y-2">
            {allocations.map((allocation) => (
              <PortCard key={allocation.id} allocation={allocation} />
            ))}
          </div>
        </Collapsible.Content>
      </Card>
    </Collapsible.Root>
  );
});

ServiceGroup.displayName = 'ServiceGroup';

/**
 * PortRegistryViewMobile component
 *
 * Mobile-optimized presenter with touch-friendly cards and collapsible groups.
 * Implements 44px minimum touch targets and progressive disclosure via collapsibles.
 */
export const PortRegistryViewMobile = memo(function PortRegistryViewMobile({
  routerId,
  className,
}: PortRegistryViewMobileProps) {
  const { groupedByService, sortedAllocations, loading, error, refetch } =
    usePortAllocations(routerId);

  /**
   * Get service types sorted alphabetically for consistent display
   * Memoized to prevent unnecessary re-renders of ServiceGroup components
   */
  const serviceTypes = useMemo(
    () => Object.keys(groupedByService).sort(),
    [groupedByService]
  );

  return (
    <div className={cn('space-y-4 pb-20', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5" aria-hidden="true" />
              <CardTitle className="text-lg">Port Registry</CardTitle>
            </div>
            <Badge variant="outline" className="text-sm px-2 py-1">
              {sortedAllocations.length}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Port allocations for service instances
          </CardDescription>
        </CardHeader>

        {/* Refresh Button */}
        <CardContent className="pt-0">
          <Button
            variant="outline"
            size="lg"
            className="w-full min-h-[44px]"
            onClick={() => refetch()}
            disabled={loading}
            aria-label="Refresh port allocations"
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', loading && 'animate-spin')}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && sortedAllocations.length === 0 && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-destructive mb-2 text-sm font-medium">
              Failed to load port allocations
            </div>
            <p className="text-xs text-muted-foreground mb-4">{error.message}</p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => refetch()}
              className="min-h-[44px]"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && sortedAllocations.length === 0 && !error && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mx-auto mb-3 flex justify-center">
              <svg
                className="h-12 w-12 stroke-1"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.007H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.007H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.007H3.75v-.007zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">No Port Allocations</h3>
            <p className="text-sm text-muted-foreground">
              Ports will appear here when service instances are created.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Service Groups */}
      {!loading && !error && serviceTypes.length > 0 && (
        <div className="space-y-3">
          {serviceTypes.map((serviceType) => (
            <ServiceGroup
              key={serviceType}
              serviceType={serviceType}
              allocations={groupedByService[serviceType]}
            />
          ))}
        </div>
      )}
    </div>
  );
});

PortRegistryViewMobile.displayName = 'PortRegistryViewMobile';
