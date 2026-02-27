/**
 * RouterHealthSummaryCard Mobile Presenter
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Mobile-optimized presenter for router health summary.
 * Compact layout with 64px height row, expandable to bottom sheet.
 *
 * Platform: Mobile (<640px)
 * - Single row, compact display
 * - 44px touch targets (WCAG AAA)
 * - Tap to expand to bottom sheet (future enhancement)
 *
 * @see ADR-018: Headless + Platform Presenters
 */

import React, { useCallback } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, Button } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { UseRouterHealthCardReturn } from './useRouterHealthCard';
import { getHealthBgClass, formatUptime } from './health-utils';

export interface RouterHealthSummaryCardMobileProps {
  /** Computed state from headless hook */
  state: UseRouterHealthCardReturn;
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mobile presenter for router health summary
 *
 * Compact row layout optimized for mobile viewports.
 * Shows essential info: name, status badge, health indicator.
 *
 * Future enhancements:
 * - Tap to expand to bottom sheet with full details
 * - Swipe left to reveal quick actions
 * - Long press to copy router UUID
 *
 * @description Renders a compact card with 44px touch targets for mobile devices.
 */
export const RouterHealthSummaryCardMobile = React.memo(function RouterHealthSummaryCardMobile({
  state,
  onRefresh,
  className,
}: RouterHealthSummaryCardMobileProps) {
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);
  const { router, healthStatus, isOnline, isStale, cacheAgeMinutes } = state;

  if (!router) {
    return <RouterHealthSummaryCardMobileSkeleton className={className} />;
  }

  return (
    <Card
      className={cn('overflow-hidden', className)}
      role="region"
      aria-label={`Router health summary for ${router.name}`}
    >
      <CardHeader className="pb-component-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground truncate text-base font-semibold">{router.name}</h3>
            <p className="text-muted-foreground truncate text-xs">{router.model}</p>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              aria-label="Refresh router data"
              className="ml-component-sm h-11 w-11 flex-shrink-0"
            >
              <RefreshCw
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-component-md">
        {/* Status and Health Row */}
        <div className="gap-component-sm flex items-center">
          <Badge
            variant={isOnline ? 'connected' : 'offline'}
            pulse={isOnline}
            role="status"
            aria-label={`Connection status: ${router.status}`}
          >
            {router.status}
          </Badge>

          <div
            className={cn(
              'gap-component-xs px-component-sm py-component-xs flex items-center rounded-full text-xs font-medium',
              getHealthBgClass(healthStatus),
              healthStatus === 'warning' ? 'text-warning-foreground' : 'text-primary-foreground'
            )}
            role="meter"
            aria-valuenow={
              healthStatus === 'healthy' ? 100
              : healthStatus === 'warning' ?
                50
              : 0
            }
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Health status: ${healthStatus}`}
          >
            <Activity
              className="h-3 w-3"
              aria-hidden="true"
            />
            <span className="capitalize">{healthStatus}</span>
          </div>

          {isStale && (
            <span className="text-muted-foreground ml-auto text-xs">{cacheAgeMinutes}m ago</span>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="gap-component-md grid grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Version</dt>
            <dd className="text-foreground font-mono text-sm font-medium">{router.version}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Uptime</dt>
            <dd className="text-foreground font-mono text-sm font-medium">
              {formatUptime(router.uptime)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">CPU</dt>
            <dd className={cn('font-mono text-sm font-medium', getCpuColorClass(router.cpuUsage))}>
              {router.cpuUsage}%
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Memory</dt>
            <dd
              className={cn(
                'font-mono text-sm font-medium',
                getMemoryColorClass(router.memoryUsage)
              )}
            >
              {router.memoryUsage}%
            </dd>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-muted-foreground text-xs">
          Last updated: {formatLastUpdate(router.lastUpdate)}
        </div>
      </CardContent>
    </Card>
  );
});

RouterHealthSummaryCardMobile.displayName = 'RouterHealthSummaryCardMobile';

/**
 * Loading skeleton for mobile presenter
 *
 * @description Displays a skeleton placeholder while router health data is loading.
 */
export const RouterHealthSummaryCardMobileSkeleton = React.memo(
  function RouterHealthSummaryCardMobileSkeleton({ className }: { className?: string }) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-component-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-component-sm flex-1">
              <div className="bg-muted h-4 w-32 rounded" />
              <div className="bg-muted h-3 w-24 rounded" />
            </div>
            <div className="bg-muted h-11 w-11 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-component-md">
          <div className="gap-component-sm flex">
            <div className="bg-muted h-6 w-20 rounded-full" />
            <div className="bg-muted h-6 w-20 rounded-full" />
          </div>
          <div className="gap-component-md grid grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-component-xs"
              >
                <div className="bg-muted h-3 w-16 rounded" />
                <div className="bg-muted h-4 w-12 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
);

RouterHealthSummaryCardMobileSkeleton.displayName = 'RouterHealthSummaryCardMobileSkeleton';

// Helper functions

/**
 * Get text color class for CPU usage level
 * @description Returns semantic color class based on CPU usage threshold
 */
function getCpuColorClass(usage: number): string {
  if (usage >= 90) return 'text-error';
  if (usage >= 70) return 'text-warning';
  return 'text-foreground';
}

/**
 * Get text color class for memory usage level
 * @description Returns semantic color class based on memory usage threshold
 */
function getMemoryColorClass(usage: number): string {
  if (usage >= 95) return 'text-error';
  if (usage >= 80) return 'text-warning';
  return 'text-foreground';
}

/**
 * Format last update timestamp to human-readable string
 * @description Converts a date to relative time format (e.g., "5m ago", "2h ago")
 */
function formatLastUpdate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
