/**
 * ServiceTrafficPanelDesktop Component
 *
 * Desktop presenter for service traffic statistics panel with rich data visualization.
 *
 * @description Desktop-optimized presenter with dense grid layout, traffic charts,
 * quota management, and device breakdown table.
 *
 * NAS-8.8: Implement Traffic Statistics and Quota Management
 * ADR-018: Headless + Platform Presenters
 */

import { memo } from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown, Settings } from 'lucide-react';
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
  Button,
  Progress,
  Badge,
} from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';
import { useServiceTrafficPanel } from './use-service-traffic-panel';
import type { ServiceTrafficPanelProps } from './service-traffic-panel.types';

// StatsCounter props inline since we can't import across features
interface StatsCounterProps {
  value: string;
  label: string;
  unit?: 'bytes' | 'packets' | 'count';
  className?: string;
}

/**
 * Formats BigInt bandwidth to bits per second with unit
 */
function formatBitsPerSecBigInt(bytesPerSec: bigint): string {
  const bitsPerSec = bytesPerSec * 8n;

  const k = 1000n;
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];

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

  return `${decimalValue.toFixed(2)} ${sizes[unitIndex]}`;
}

/**
 * Formats bytes as BigInt to human-readable size string
 */
function formatBytesBigInt(bytes: bigint, decimals = 2): string {
  if (bytes === 0n) return '0 B';

  const k = 1024n;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

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
 * StatsCounter component for displaying traffic counters
 */
function StatsCounter({ value, label, unit = 'bytes', className }: StatsCounterProps) {
  const formattedValue = (() => {
    try {
      const bigIntValue = BigInt(value);
      if (unit === 'bytes') {
        return formatBytesBigInt(bigIntValue);
      }
      return bigIntValue.toLocaleString('en-US');
    } catch (err) {
      return value;
    }
  })();

  return (
    <div className={cn('gap-component-sm flex flex-col', className)}>
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
      <span className="font-mono text-2xl font-semibold tabular-nums">{formattedValue}</span>
    </div>
  );
}

/**
 * Desktop Presenter for ServiceTrafficPanel
 *
 * Displays service traffic statistics in a dense, information-rich layout:
 * - Grid layout with traffic counters and rates
 * - Quota progress bar with threshold indicators
 * - Device breakdown table (top consumers)
 * - Historical traffic chart
 */
function ServiceTrafficPanelDesktopComponent({
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>{instanceName} Traffic Statistics</CardTitle>
          <CardDescription>Loading traffic statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="gap-component-md grid grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-20"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{instanceName} Traffic Statistics</CardTitle>
          <CardDescription>Failed to load traffic statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Icon
              icon={AlertCircle}
              className="h-4 w-4"
            />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon
                icon={Activity}
                className="text-primary h-5 w-5"
                aria-hidden="true"
              />
              {instanceName} Traffic Statistics
            </CardTitle>
            <CardDescription>Real-time traffic monitoring and quota management</CardDescription>
          </div>
          {quotaExceeded && (
            <Alert
              variant="destructive"
              className="w-auto"
            >
              <Icon
                icon={AlertCircle}
                className="h-4 w-4"
              />
              <AlertDescription className="text-sm">Quota limit exceeded</AlertDescription>
            </Alert>
          )}
          {quotaWarning && !quotaExceeded && (
            <Alert
              variant="warning"
              className="w-auto"
            >
              <Icon
                icon={AlertCircle}
                className="h-4 w-4"
              />
              <AlertDescription className="text-sm">
                Quota warning threshold reached
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-component-lg">
        {/* Traffic Counters Section */}
        <div>
          <h3 className="text-muted-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
            Total Traffic
          </h3>
          <div className="gap-component-md grid grid-cols-4">
            <StatsCounter
              value={stats.totalUploadBytes.toString()}
              label="Total Upload"
              unit="bytes"
            />
            <StatsCounter
              value={stats.totalDownloadBytes.toString()}
              label="Total Download"
              unit="bytes"
            />
            <StatsCounter
              value={stats.currentPeriodUpload.toString()}
              label="Period Upload"
              unit="bytes"
            />
            <StatsCounter
              value={stats.currentPeriodDownload.toString()}
              label="Period Download"
              unit="bytes"
            />
          </div>
        </div>

        {/* Bandwidth Rates Section */}
        {(uploadRate !== null || downloadRate !== null) && (
          <div>
            <h3 className="text-muted-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
              Current Rates
            </h3>
            <div className="gap-component-md grid grid-cols-2">
              {uploadRate !== null && (
                <div className="gap-component-sm bg-card p-component-md flex items-center rounded-md border">
                  <Icon
                    icon={TrendingUp}
                    className="text-category-vpn h-6 w-6"
                  />
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Upload Rate</p>
                    <p className="font-mono text-2xl font-semibold tabular-nums">
                      {formatBitsPerSecBigInt(uploadRate)}
                    </p>
                  </div>
                </div>
              )}
              {downloadRate !== null && (
                <div className="gap-component-sm bg-card p-component-md flex items-center rounded-md border">
                  <Icon
                    icon={TrendingDown}
                    className="text-success h-6 w-6"
                  />
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Download Rate</p>
                    <p className="font-mono text-2xl font-semibold tabular-nums">
                      {formatBitsPerSecBigInt(downloadRate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quota Section */}
        {stats.quota && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
                Traffic Quota
              </h3>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Configure traffic quota settings"
              >
                <Icon
                  icon={Settings}
                  className="mr-2 h-4 w-4"
                />
                Configure
              </Button>
            </div>
            <div className="space-y-component-sm bg-card p-component-md rounded-md border">
              <div className="flex items-center justify-between">
                <div className="gap-component-sm flex items-center">
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
                  <span className="text-sm font-medium">
                    {formatBytesBigInt(BigInt(stats.quota.consumedBytes))} of{' '}
                    {formatBytesBigInt(BigInt(stats.quota.limitBytes))}
                  </span>
                </div>
                <span className="font-mono text-sm font-semibold">
                  {quotaUsagePercent.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(quotaUsagePercent, 100)}
                className={cn(
                  'h-3',
                  quotaExceeded && '[&>div]:bg-error',
                  quotaWarning && !quotaExceeded && '[&>div]:bg-warning'
                )}
              />
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>Remaining: {formatBytesBigInt(BigInt(stats.quota.remainingBytes))}</span>
                <span>Action: {stats.quota.action.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Device Breakdown Preview */}
        {stats.deviceBreakdown.length > 0 && (
          <div>
            <h3 className="text-muted-foreground mb-3 text-sm font-semibold uppercase tracking-wide">
              Top Devices ({stats.deviceBreakdown.length})
            </h3>
            <div className="space-y-component-sm">
              {stats.deviceBreakdown.slice(0, 5).map((device) => (
                <div
                  key={device.deviceID}
                  className="bg-card p-component-sm flex items-center justify-between rounded-md border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {device.deviceName || device.ipAddress || device.macAddress}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {device.ipAddress} • {device.macAddress}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">
                      {formatBytesBigInt(BigInt(device.totalBytes))}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {device.percentOfTotal.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const ServiceTrafficPanelDesktop = memo(ServiceTrafficPanelDesktopComponent);
ServiceTrafficPanelDesktop.displayName = 'ServiceTrafficPanel.Desktop';
