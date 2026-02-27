/**
 * InterfaceStatsPanelDesktop Component
 * Desktop presenter for interface statistics panel
 *
 * @description
 * Displays interface statistics in a dense, information-rich layout optimized
 * for desktop viewing. Shows real-time counters, bandwidth rates with directional
 * indicators, and comprehensive error statistics with rate warnings.
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 * ADR-018: Headless + Platform Presenters
 */

import { memo, useMemo } from 'react';

import { AlertCircle, ArrowDown, ArrowUp, Activity } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle , Alert, AlertDescription , Skeleton } from '@nasnet/ui/primitives';
import { cn } from '@nasnet/ui/utils';

import { ErrorRateIndicator } from './error-rate-indicator';
import { StatsCounter } from './stats-counter';
import { useInterfaceStatsPanel } from './use-interface-stats-panel';

import type { InterfaceStatsPanelProps } from './interface-stats-panel.types';

/** Kilobits constant for decimal calculations */
const K_BITS_DECIMAL = 1000n;

/** Bandwidth units for decimal formatting (bps, Kbps, Mbps, Gbps, Tbps) */
const BANDWIDTH_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];

/** Error rate threshold above which warning is displayed */
const ERROR_RATE_THRESHOLD = 0.1;

/**
 * Formats BigInt bandwidth to bits per second with appropriate unit
 * @param bytesPerSec - Bytes per second as BigInt
 * @returns Formatted bandwidth string (e.g., "1.23 Mbps")
 */
function formatBitsPerSecBigInt(bytesPerSec: bigint): string {
  const bitsPerSec = bytesPerSec * 8n;

  let value = bitsPerSec;
  let unitIndex = 0;

  while (value >= K_BITS_DECIMAL && unitIndex < BANDWIDTH_UNITS.length - 1) {
    value = value / K_BITS_DECIMAL;
    unitIndex++;
  }

  const divisor = K_BITS_DECIMAL ** BigInt(unitIndex);
  const integerPart = bitsPerSec / divisor;
  const remainder = bitsPerSec % divisor;
  const decimalValue = Number(integerPart) + Number(remainder) / Number(divisor);

  return `${decimalValue.toFixed(2)} ${BANDWIDTH_UNITS[unitIndex]}`;
}

/**
 * Desktop Presenter for InterfaceStatsPanel
 *
 * Displays interface statistics in a dense, information-rich layout:
 * - Grid layout with multiple stat sections
 * - Real-time counters with animation
 * - Bandwidth rates with directional indicators
 * - Error rate with threshold warnings
 */
export const InterfaceStatsPanelDesktop = memo(function InterfaceStatsPanelDesktop({
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

  // Memoize has high error rate check to avoid recalculation
  const isHighErrorRate = useMemo(() => errorRate > ERROR_RATE_THRESHOLD, [errorRate]);

  // Loading state with skeleton placeholders
  if (loading && !stats) {
    return (
      <Card className={cn('bg-card category-networking', className)}>
        <CardHeader>
          <CardTitle>{interfaceName} Statistics</CardTitle>
          <CardDescription>Loading interface statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-component-md">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state with actionable message
  if (error && !stats) {
    return (
      <Card className={cn('bg-card category-networking', className)}>
        <CardHeader>
          <CardTitle>{interfaceName} Statistics</CardTitle>
          <CardDescription>Failed to load statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>
              {error.message || 'Could not retrieve interface statistics. Check router connection.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={cn('bg-card category-networking', className)} role="region" aria-label={`${interfaceName} statistics`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" aria-hidden="true" />
              {interfaceName} Statistics
            </CardTitle>
            <CardDescription>
              Real-time traffic statistics and error monitoring
            </CardDescription>
          </div>
          {hasErrors && (
            <Alert variant="destructive" className="w-auto">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="text-sm">
                Interface has errors
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-component-lg">
        {/* Traffic Counters Section */}
        <div>
          <h3 className="mb-component-sm text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Traffic Counters
          </h3>
          <div className="grid grid-cols-4 gap-component-md">
            <StatsCounter value={stats.txBytes} label="TX Bytes" unit="bytes" />
            <StatsCounter value={stats.rxBytes} label="RX Bytes" unit="bytes" />
            <StatsCounter value={stats.txPackets} label="TX Packets" unit="packets" />
            <StatsCounter value={stats.rxPackets} label="RX Packets" unit="packets" />
          </div>
        </div>

        {/* Bandwidth Rates Section */}
        {rates && (
          <div>
            <h3 className="mb-component-sm text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Bandwidth
            </h3>
            <div className="grid grid-cols-2 gap-component-md">
              <Card className="border-chart-1/20 bg-chart-1/5 bg-muted">
                <CardContent className="pt-component-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-component-sm text-sm text-muted-foreground">
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        <span>TX Rate</span>
                      </div>
                      <div className="mt-component-sm text-3xl font-bold font-mono tabular-nums text-foreground">
                        {formatBitsPerSecBigInt(rates.txRate)}
                      </div>
                    </div>
                    <Activity className="h-12 w-12 text-chart-1 opacity-20" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-chart-2/20 bg-chart-2/5 bg-muted">
                <CardContent className="pt-component-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-component-sm text-sm text-muted-foreground">
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        <span>RX Rate</span>
                      </div>
                      <div className="mt-component-sm text-3xl font-bold font-mono tabular-nums text-foreground">
                        {formatBitsPerSecBigInt(rates.rxRate)}
                      </div>
                    </div>
                    <Activity className="h-12 w-12 text-chart-2 opacity-20" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Errors Section */}
        <div>
          <h3 className="mb-component-sm text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Error Statistics
          </h3>
          <div className="space-y-component-md">
            <div className="grid grid-cols-4 gap-component-md">
              <StatsCounter value={String(stats.txErrors)} label="TX Errors" unit="count" />
              <StatsCounter value={String(stats.rxErrors)} label="RX Errors" unit="count" />
              <StatsCounter value={String(stats.txDrops)} label="TX Drops" unit="count" />
              <StatsCounter value={String(stats.rxDrops)} label="RX Drops" unit="count" />
            </div>

            {/* Error Rate Indicator */}
            <ErrorRateIndicator rate={errorRate} trend={0} threshold={0.1} />

            {/* Warning for high error rates */}
            {isHighErrorRate && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  Error rate exceeds {(ERROR_RATE_THRESHOLD * 100).toFixed(1)}% - check cable connections and port configuration.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
