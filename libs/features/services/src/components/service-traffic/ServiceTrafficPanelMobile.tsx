/**
 * ServiceTrafficPanelMobile Component
 *
 * Mobile presenter for service traffic statistics panel.
 *
 * @description Mobile-optimized presenter with stacked card layout and
 * simplified metrics for touch-first interactions.
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 * ADR-018: Headless + Platform Presenters
 *
 * Mobile-optimized with:
 * - 44px minimum touch targets
 * - Stacked card layout
 * - Simplified metrics
 */

import { memo } from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icon,
  Alert,
  AlertDescription,
  Skeleton,
  Progress,
  Badge,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { useServiceTrafficPanel } from './use-service-traffic-panel';
import type { ServiceTrafficPanelProps } from './service-traffic-panel.types';

/**
 * Formats BigInt bandwidth to bits per second with unit
 */
function formatBitsPerSecBigInt(bytesPerSec: bigint): string {
  const bitsPerSec = bytesPerSec * 8n;
  const k = 1000n;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];

  let value = bitsPerSec;
  let unitIndex = 0;

  while (value >= k && unitIndex < sizes.length - 1) {
    value = value / k;
    unitIndex++;
  }

  const divisor = k ** BigInt(unitIndex);
  const integerPart = bitsPerSec / divisor;
  const remainder = bitsPerSec % divisor;
  const decimalValue = Number(integerPart) + Number(remainder) / Number(divisor);

  return `${decimalValue.toFixed(1)} ${sizes[unitIndex]}`;
}

/**
 * Formats bytes as BigInt to human-readable size string
 */
function formatBytesBigInt(bytes: bigint, decimals = 1): string {
  if (bytes === 0n) return '0 B';

  const k = 1024n;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  let value = bytes;
  let unitIndex = 0;

  while (value >= k && unitIndex < sizes.length - 1) {
    value = value / k;
    unitIndex++;
  }

  const divisor = k ** BigInt(unitIndex);
  const integerPart = bytes / divisor;
  const remainder = bytes % divisor;
  const decimalValue = Number(integerPart) + Number(remainder) / Number(divisor);

  return `${decimalValue.toFixed(decimals)} ${sizes[unitIndex]}`;
}

/**
 * Mobile Presenter for ServiceTrafficPanel
 *
 * Displays service traffic statistics in a mobile-optimized layout:
 * - Stacked cards for easy scrolling
 * - Large touch targets (44px minimum)
 * - Simplified metrics for small screens
 * - Collapsible sections for device breakdown
 */
function ServiceTrafficPanelMobileComponent({
  routerID,
  instanceID,
  instanceName,
  historyHours = 24,
  onClose,
  className,
}: ServiceTrafficPanelProps) {
  const trafficState = useServiceTrafficPanel({
    routerID,
    instanceID,
    historyHours,
  });

  const {
    stats,
    uploadRate,
    downloadRate,
    quotaUsagePercent,
    quotaWarning,
    quotaExceeded,
    loading,
    error,
  } = trafficState;

  // Loading state
  if (loading && !stats) {
    return (
      <div className={cn('space-y-component-md', className)}>
        <Card>
          <CardHeader>
            <CardTitle>{instanceName}</CardTitle>
            <CardDescription>Loading traffic...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className={cn('space-y-component-md', className)}>
        <Alert variant="destructive">
          <Icon
            icon={AlertCircle}
            className="h-4 w-4"
          />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={cn('space-y-component-md', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="gap-component-sm flex items-center">
            <Icon
              icon={Activity}
              className="text-primary h-5 w-5"
              aria-hidden="true"
            />
            <CardTitle className="text-lg">{instanceName}</CardTitle>
          </div>
          <CardDescription>Traffic Statistics</CardDescription>
        </CardHeader>
      </Card>

      {/* Quota Alert */}
      {quotaExceeded && (
        <Alert variant="destructive">
          <Icon
            icon={AlertCircle}
            className="h-4 w-4"
          />
          <AlertDescription>Traffic quota limit has been exceeded</AlertDescription>
        </Alert>
      )}
      {quotaWarning && !quotaExceeded && (
        <Alert variant="warning">
          <Icon
            icon={AlertCircle}
            className="h-4 w-4"
          />
          <AlertDescription>
            Approaching traffic quota limit ({quotaUsagePercent.toFixed(1)}%)
          </AlertDescription>
        </Alert>
      )}

      {/* Current Rates Card */}
      {(uploadRate !== null || downloadRate !== null) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-component-sm">
            {uploadRate !== null && (
              <div className="bg-muted p-component-md flex items-center justify-between rounded-lg">
                <div className="gap-component-sm flex items-center">
                  <Icon
                    icon={TrendingUp}
                    className="text-category-vpn h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">Upload</span>
                </div>
                <span className="font-mono text-lg font-semibold">
                  {formatBitsPerSecBigInt(uploadRate)}
                </span>
              </div>
            )}
            {downloadRate !== null && (
              <div className="bg-muted p-component-md flex items-center justify-between rounded-lg">
                <div className="gap-component-sm flex items-center">
                  <Icon
                    icon={TrendingDown}
                    className="text-success h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">Download</span>
                </div>
                <span className="font-mono text-lg font-semibold">
                  {formatBitsPerSecBigInt(downloadRate)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Total Traffic Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total Traffic</CardTitle>
        </CardHeader>
        <CardContent className="space-y-component-sm">
          <div className="bg-muted p-component-md flex justify-between rounded-lg">
            <span className="text-sm font-medium">Total Upload</span>
            <span className="font-mono text-sm font-semibold">
              {formatBytesBigInt(BigInt(stats.totalUploadBytes))}
            </span>
          </div>
          <div className="bg-muted p-component-md flex justify-between rounded-lg">
            <span className="text-sm font-medium">Total Download</span>
            <span className="font-mono text-sm font-semibold">
              {formatBytesBigInt(BigInt(stats.totalDownloadBytes))}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quota Card */}
      {stats.quota && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Traffic Quota</CardTitle>
              <Badge
                variant={
                  quotaExceeded ? 'error'
                  : quotaWarning ?
                    'warning'
                  : 'default'
                }
              >
                {stats.quota.period}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-component-sm">
            <div className="space-y-component-sm">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span className="font-mono font-semibold">
                  {formatBytesBigInt(BigInt(stats.quota.consumedBytes))}
                </span>
              </div>
              <Progress
                value={Math.min(quotaUsagePercent, 100)}
                className={cn(
                  'h-2',
                  quotaExceeded && '[&>div]:bg-error',
                  quotaWarning && !quotaExceeded && '[&>div]:bg-warning'
                )}
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Limit: {formatBytesBigInt(BigInt(stats.quota.limitBytes))}</span>
                <span>{quotaUsagePercent.toFixed(1)}%</span>
              </div>
            </div>
            <div className="bg-muted p-component-sm flex justify-between rounded-lg text-sm">
              <span className="text-muted-foreground">Action</span>
              <span className="font-medium">{stats.quota.action.replace('_', ' ')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Devices Card */}
      {stats.deviceBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top Devices ({stats.deviceBreakdown.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-component-sm">
            {stats.deviceBreakdown.slice(0, 3).map((device) => (
              <div
                key={device.deviceID}
                className="bg-card p-component-sm rounded-lg border"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {device.deviceName || device.ipAddress || 'Unknown'}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{device.ipAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {formatBytesBigInt(BigInt(device.totalBytes))}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {device.percentOfTotal.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const ServiceTrafficPanelMobile = memo(ServiceTrafficPanelMobileComponent);
ServiceTrafficPanelMobile.displayName = 'ServiceTrafficPanel.Mobile';
