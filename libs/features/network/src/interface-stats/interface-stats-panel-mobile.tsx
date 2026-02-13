/**
 * InterfaceStatsPanelMobile Component
 * Mobile presenter for interface statistics panel
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 * ADR-018: Headless + Platform Presenters
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives';
import { AlertCircle, ArrowDown, ArrowUp, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@nasnet/ui/primitives';
import { Skeleton } from '@nasnet/ui/primitives';
import { useInterfaceStatsPanel } from './use-interface-stats-panel';
import { StatsCounter } from './stats-counter';
import { ErrorRateIndicator } from './error-rate-indicator';
import type { InterfaceStatsPanelProps } from './interface-stats-panel.types';

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
 * Mobile Presenter for InterfaceStatsPanel
 *
 * Displays interface statistics in a mobile-optimized layout:
 * - Stacked card layout (full-width sections)
 * - Larger touch targets (44px minimum)
 * - Simplified visualizations
 * - Vertical spacing for readability
 */
export function InterfaceStatsPanelMobile({
  routerId,
  interfaceId,
  interfaceName,
  pollingInterval,
  onClose,
  className,
}: InterfaceStatsPanelProps) {
  const statsState = useInterfaceStatsPanel({
    routerId,
    interfaceId,
    pollingInterval,
  });

  const { stats, rates, errorRate, loading, error, hasErrors } = statsState;

  // Loading state
  if (loading && !stats) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{interfaceName}</CardTitle>
            <CardDescription>Loading statistics...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{interfaceName}</CardTitle>
            <CardDescription>Failed to load</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error.message}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                {interfaceName}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Real-time statistics
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Warning Banner */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Interface has errors
              </AlertDescription>
            </Alert>
          )}

          {/* Bandwidth Rates - Prominent Display */}
          {rates && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Current Bandwidth
              </h3>
              <div className="space-y-3">
                <Card className="border-chart-1/20 bg-chart-1/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-1/20">
                          <ArrowUp className="h-5 w-5 text-chart-1" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">TX Rate</div>
                          <div className="text-xl font-bold tabular-nums">
                            {formatBitsPerSecBigInt(rates.txRate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-chart-2/20 bg-chart-2/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chart-2/20">
                          <ArrowDown className="h-5 w-5 text-chart-2" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">RX Rate</div>
                          <div className="text-xl font-bold tabular-nums">
                            {formatBitsPerSecBigInt(rates.rxRate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Traffic Counters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Traffic Counters
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatsCounter value={stats.txBytes} label="TX Bytes" unit="bytes" />
              <StatsCounter value={stats.rxBytes} label="RX Bytes" unit="bytes" />
              <StatsCounter value={stats.txPackets} label="TX Packets" unit="packets" />
              <StatsCounter value={stats.rxPackets} label="RX Packets" unit="packets" />
            </div>
          </div>

          {/* Error Statistics */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Errors & Drops
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatsCounter value={String(stats.txErrors)} label="TX Errors" unit="count" />
              <StatsCounter value={String(stats.rxErrors)} label="RX Errors" unit="count" />
              <StatsCounter value={String(stats.txDrops)} label="TX Drops" unit="count" />
              <StatsCounter value={String(stats.rxDrops)} label="RX Drops" unit="count" />
            </div>

            {/* Error Rate */}
            <ErrorRateIndicator rate={errorRate} trend={0} threshold={0.1} />

            {/* High Error Warning */}
            {errorRate > 0.1 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  High error rate detected - check cable connections
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
