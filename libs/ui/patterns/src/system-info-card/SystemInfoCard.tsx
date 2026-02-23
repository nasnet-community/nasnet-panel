/**
 * System Information Card Component
 * Displays router system information including model, version, uptime, and architecture
 */

import React, { useCallback } from 'react';

import { AlertCircle, RefreshCw } from 'lucide-react';

import type { SystemInfo } from '@nasnet/core/types';
import { parseRouterOSUptime } from '@nasnet/core/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Button,
} from '@nasnet/ui/primitives';

/**
 * SystemInfoCard Props
 */
export interface SystemInfoCardProps {
  /** System information data */
  data?: SystemInfo | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Retry callback for error state */
  onRetry?: () => void;
}

/**
 * SystemInfoCard Component
 * Shows router model, RouterOS version, uptime, and CPU architecture
 * Includes skeleton loading state and error handling with retry
 */
export const SystemInfoCard = React.memo(function SystemInfoCard({
  data,
  isLoading = false,
  error = null,
  onRetry,
}: SystemInfoCardProps) {
  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);
  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Card className="rounded-card-sm md:rounded-card-lg shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  // Error state - show error with retry
  if (error) {
    return (
      <Card className="rounded-card-sm md:rounded-card-lg shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-error mb-4" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Failed to load system information
            </p>
            {onRetry && (
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="rounded-button"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data) {
    return (
      <Card className="rounded-card-sm md:rounded-card-lg shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No system information available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Parse uptime if it's in RouterOS format (e.g., "3d4h25m12s")
  const formattedUptime = data.uptime ? parseRouterOSUptime(data.uptime) : 'N/A';

  return (
    <Card className="rounded-card-sm md:rounded-card-lg shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          System Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-0">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Model</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{data.model || 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">RouterOS</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{data.routerOsVersion || 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Uptime</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{formattedUptime}</span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Architecture</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{data.cpuArchitecture || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SystemInfoCard.displayName = 'SystemInfoCard';
