/**
 * WAN Overview List Component
 *
 * Responsive grid of WAN interface cards with real-time updates.
 * Story: NAS-6.8 - Implement WAN Link Configuration (Phase 8: Overview Integration)
 */

import { useMemo } from 'react';
import { EmptyState } from '@nasnet/ui/patterns';
import { Globe, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@nasnet/ui/primitives';
import { WANCard, WANCardCompact } from '../wan-card/WANCard';
import { usePlatform } from '@nasnet/ui/layouts';
import type { WANInterfaceData } from '../../types/wan.types';

export interface WANOverviewListProps {
  wans: WANInterfaceData[];
  loading?: boolean;
  error?: Error | null;
  onAddWAN?: () => void;
  onConfigureWAN?: (wanId: string) => void;
  onViewDetails?: (wanId: string) => void;
  onRefresh?: () => void;
}

/**
 * WAN Overview List - Displays all WAN interfaces in a responsive grid
 *
 * Layout:
 * - Mobile: 1 column (compact cards)
 * - Tablet: 2 columns
 * - Desktop: 3 columns
 */
export function WANOverviewList({
  wans,
  loading = false,
  error = null,
  onAddWAN,
  onConfigureWAN,
  onViewDetails,
  onRefresh,
}: WANOverviewListProps) {
  const platform = usePlatform();
  const isMobile = platform === 'mobile';

  /**
   * Sort WANs: default route first, then by connection status, then by name
   */
  const sortedWANs = useMemo(() => {
    return [...wans].sort((a, b) => {
      // Default route first
      if (a.isDefaultRoute && !b.isDefaultRoute) return -1;
      if (!a.isDefaultRoute && b.isDefaultRoute) return 1;

      // Connected before disconnected
      const statusOrder = {
        CONNECTED: 0,
        CONNECTING: 1,
        DISCONNECTED: 2,
        ERROR: 3,
        DISABLED: 4,
      };
      const aStatus = statusOrder[a.status] ?? 999;
      const bStatus = statusOrder[b.status] ?? 999;
      if (aStatus !== bStatus) return aStatus - bStatus;

      // Alphabetical by name
      return a.interfaceName.localeCompare(b.interfaceName);
    });
  }, [wans]);

  /**
   * Loading state
   */
  if (loading && wans.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading WAN interfaces...</p>
        </div>
      </div>
    );
  }

  /**
   * Error state
   */
  if (error && wans.length === 0) {
    return (
      <div className="rounded-lg border border-error/20 bg-error/5 p-6">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-error">Failed to load WAN interfaces</h3>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Empty state
   */
  if (wans.length === 0) {
    return (
      <EmptyState
        icon={Globe}
        title="No WAN Configured"
        description="Configure a WAN connection to connect your network to the internet."
        action={
          onAddWAN
            ? {
                label: 'Add WAN Connection',
                onClick: onAddWAN,
                variant: 'action',
              }
            : undefined
        }
      />
    );
  }

  /**
   * WAN list with responsive grid
   */
  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            WAN Interfaces ({wans.length})
          </h2>
          {loading && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          )}
          {onAddWAN && (
            <Button size="sm" onClick={onAddWAN}>
              <Plus className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Add WAN</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error banner (if error but have cached data) */}
      {error && wans.length > 0 && (
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-warning">
                Failed to refresh WAN data
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Showing cached data. {error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Responsive grid */}
      <div
        className={
          isMobile
            ? 'space-y-3'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        }
      >
        {sortedWANs.map((wan) =>
          isMobile ? (
            <WANCardCompact
              key={wan.id}
              wan={wan}
              onConfigure={onConfigureWAN}
              onViewDetails={onViewDetails}
            />
          ) : (
            <WANCard
              key={wan.id}
              wan={wan}
              onConfigure={onConfigureWAN}
              onViewDetails={onViewDetails}
            />
          )
        )}
      </div>

      {/* Statistics footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
        <div className="flex items-center gap-4">
          <span>
            Connected:{' '}
            <strong className="text-success">
              {wans.filter((w) => w.status === 'CONNECTED').length}
            </strong>
          </span>
          <span>
            Healthy:{' '}
            <strong className="text-success">
              {
                wans.filter(
                  (w) => w.healthEnabled && w.healthStatus === 'HEALTHY'
                ).length
              }
            </strong>
          </span>
          <span>
            Default Route:{' '}
            <strong>
              {wans.find((w) => w.isDefaultRoute)?.interfaceName || 'None'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
