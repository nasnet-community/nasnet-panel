/**
 * RouterHealthSummaryCard Desktop Presenter
 * Epic 5 - Story 5.1: Dashboard Layout with Router Health Summary
 *
 * Desktop-optimized presenter for router health summary.
 * Pro-grade density with detailed metrics and visual health indicator.
 *
 * Platform: Desktop (>1024px) and Tablet (640-1024px)
 * - Vertical card layout
 * - Detailed metrics display
 * - Visual health gauge/indicator
 * - Progress bars for CPU/Memory
 *
 * @see ADR-018: Headless + Platform Presenters
 */

import { RefreshCw, Activity, Cpu, MemoryStick, Thermometer } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, Badge, Button } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import type { UseRouterHealthCardReturn } from './useRouterHealthCard';
import { getHealthBgClass, getHealthTextClass, formatUptime } from './health-utils';

export interface RouterHealthSummaryCardDesktopProps {
  /** Computed state from headless hook */
  state: UseRouterHealthCardReturn;
  /** Callback when refresh is clicked */
  onRefresh?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Desktop presenter for router health summary
 *
 * Detailed vertical card with visual health indicator and progress bars.
 * Optimized for larger viewports with pro-grade information density.
 */
export function RouterHealthSummaryCardDesktop({
  state,
  onRefresh,
  className,
}: RouterHealthSummaryCardDesktopProps) {
  const { router, healthStatus, isOnline, isStale, cacheAgeMinutes, mutationsDisabled } = state;

  if (!router) {
    return <RouterHealthSummaryCardDesktopSkeleton className={className} />;
  }

  return (
    <Card
      className={cn('h-80 flex flex-col', className)}
      role="region"
      aria-label={`Router health summary for ${router.name}`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate mb-1">
              {router.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{router.model}</p>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              aria-label="Refresh router data"
              className="h-12 w-12 -mt-1 -mr-2" // 48px touch target
            >
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant={isOnline ? 'connected' : 'offline'}
            pulse={isOnline}
            role="status"
            aria-label={`Connection status: ${router.status}`}
          >
            {router.status}
          </Badge>

          {isStale && (
            <span className="text-xs text-muted-foreground">
              Data {cacheAgeMinutes}m old
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Version and Uptime */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium text-foreground">{router.version}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-medium text-foreground">{formatUptime(router.uptime)}</span>
          </div>
        </div>

        {/* Health Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Health Status</span>
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                getHealthBgClass(healthStatus),
                healthStatus === 'warning' ? 'text-black' : 'text-white'
              )}
              role="meter"
              aria-valuenow={healthStatus === 'healthy' ? 100 : healthStatus === 'warning' ? 50 : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Health status: ${healthStatus}`}
            >
              <Activity className="h-4 w-4" aria-hidden="true" />
              <span className="capitalize">{healthStatus}</span>
            </div>
          </div>
        </div>

        {/* Resource Metrics with Progress Bars */}
        <div className="space-y-3">
          {/* CPU Usage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
                <span>CPU</span>
              </div>
              <span className={cn('font-medium', getCpuTextClass(router.cpuUsage))}>
                {router.cpuUsage}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all', getCpuBgClass(router.cpuUsage))}
                style={{ width: `${router.cpuUsage}%` }}
                role="progressbar"
                aria-valuenow={router.cpuUsage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`CPU usage: ${router.cpuUsage}%`}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MemoryStick className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Memory</span>
              </div>
              <span className={cn('font-medium', getMemoryTextClass(router.memoryUsage))}>
                {router.memoryUsage}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full transition-all', getMemoryBgClass(router.memoryUsage))}
                style={{ width: `${router.memoryUsage}%` }}
                role="progressbar"
                aria-valuenow={router.memoryUsage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Memory usage: ${router.memoryUsage}%`}
              />
            </div>
          </div>

          {/* Temperature (if available) */}
          {router.temperature !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Thermometer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Temperature</span>
                </div>
                <span className={cn('font-medium', getTempTextClass(router.temperature))}>
                  {router.temperature}°C
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>Last updated</span>
          <span>{formatLastUpdate(router.lastUpdate)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Loading skeleton for desktop presenter
 */
export function RouterHealthSummaryCardDesktopSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('h-80 flex flex-col animate-pulse', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-40" />
            <div className="h-4 bg-muted rounded w-32" />
          </div>
          <div className="h-12 w-12 bg-muted rounded-md" />
        </div>
        <div className="h-6 bg-muted rounded-full w-24 mt-2" />
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>

        <div className="h-8 bg-muted rounded-full w-32 ml-auto" />

        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-4 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-12" />
              </div>
              <div className="h-2 bg-muted rounded-full w-full" />
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="h-3 bg-muted rounded w-full" />
      </CardFooter>
    </Card>
  );
}

// Helper functions for color classes

function getCpuTextClass(usage: number): string {
  if (usage >= 90) return 'text-semantic-error';
  if (usage >= 70) return 'text-semantic-warning';
  return 'text-foreground';
}

function getCpuBgClass(usage: number): string {
  if (usage >= 90) return 'bg-semantic-error';
  if (usage >= 70) return 'bg-semantic-warning';
  return 'bg-semantic-success';
}

function getMemoryTextClass(usage: number): string {
  if (usage >= 95) return 'text-semantic-error';
  if (usage >= 80) return 'text-semantic-warning';
  return 'text-foreground';
}

function getMemoryBgClass(usage: number): string {
  if (usage >= 95) return 'bg-semantic-error';
  if (usage >= 80) return 'bg-semantic-warning';
  return 'bg-semantic-success';
}

function getTempTextClass(temp: number): string {
  if (temp >= 75) return 'text-semantic-error';
  if (temp >= 60) return 'text-semantic-warning';
  return 'text-foreground';
}

function formatLastUpdate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}
