/**
 * ServiceTrafficPanelMobile Component
 * Mobile presenter for service traffic statistics panel
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 * ADR-018: Headless + Platform Presenters
 *
 * Mobile-optimized with:
 * - 44px minimum touch targets
 * - Stacked card layout
 * - Simplified metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@nasnet/ui/primitives';
import { Skeleton } from '@nasnet/ui/primitives';
import { Progress } from '@nasnet/ui/primitives';
import { Badge } from '@nasnet/ui/primitives';
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
export function ServiceTrafficPanelMobile({
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
      <div className={cn('space-y-4', className)}>
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
      <div className={cn('space-y-4', className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{instanceName}</CardTitle>
          </div>
          <CardDescription>Traffic Statistics</CardDescription>
        </CardHeader>
      </Card>

      {/* Quota Alert */}
      {quotaExceeded && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Traffic quota limit has been exceeded
          </AlertDescription>
        </Alert>
      )}
      {quotaWarning && !quotaExceeded && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
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
          <CardContent className="space-y-3">
            {uploadRate !== null && (
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">Upload</span>
                </div>
                <span className="text-lg font-mono font-semibold">
                  {formatBitsPerSecBigInt(uploadRate)}
                </span>
              </div>
            )}
            {downloadRate !== null && (
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Download</span>
                </div>
                <span className="text-lg font-mono font-semibold">
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
        <CardContent className="space-y-3">
          <div className="flex justify-between rounded-lg bg-muted p-4">
            <span className="text-sm font-medium">Total Upload</span>
            <span className="text-sm font-mono font-semibold">
              {formatBytesBigInt(BigInt(stats.totalUploadBytes))}
            </span>
          </div>
          <div className="flex justify-between rounded-lg bg-muted p-4">
            <span className="text-sm font-medium">Total Download</span>
            <span className="text-sm font-mono font-semibold">
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
              <Badge variant={quotaExceeded ? 'error' : quotaWarning ? 'warning' : 'default'}>
                {stats.quota.period}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
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
                  quotaExceeded && '[&>div]:bg-destructive',
                  quotaWarning && !quotaExceeded && '[&>div]:bg-warning'
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Limit: {formatBytesBigInt(BigInt(stats.quota.limitBytes))}</span>
                <span>{quotaUsagePercent.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3 text-sm">
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
          <CardContent className="space-y-2">
            {stats.deviceBreakdown.slice(0, 3).map((device) => (
              <div
                key={device.deviceID}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {device.deviceName || device.ipAddress || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {device.ipAddress}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">
                      {formatBytesBigInt(BigInt(device.totalBytes))}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
