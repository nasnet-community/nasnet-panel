/**
 * InterfaceStatsPanelMobile Component
 * Mobile presenter for interface statistics panel
 *
 * @description
 * Displays interface statistics in a mobile-optimized stacked card layout.
 * Emphasizes bandwidth rates, minimizes technical details, uses larger
 * touch targets (44px minimum), and optimizes for vertical scrolling.
 *
 * NAS-6.9: Implement Interface Traffic Statistics
 * ADR-018: Headless + Platform Presenters
 */

import { memo, useMemo } from 'react';

import { AlertCircle, ArrowDown, ArrowUp, Activity } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Skeleton,
} from '@nasnet/ui/primitives';
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
 * Mobile Presenter for InterfaceStatsPanel
 *
 * Displays interface statistics in a mobile-optimized layout:
 * - Stacked card layout (full-width sections)
 * - Larger touch targets (44px minimum)
 * - Simplified visualizations
 * - Vertical spacing for readability
 */
export const InterfaceStatsPanelMobile = memo(function InterfaceStatsPanelMobile({
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

  // Memoize high error rate check to avoid recalculation
  const isHighErrorRate = useMemo(() => errorRate > ERROR_RATE_THRESHOLD, [errorRate]);

  // Loading state with skeleton placeholders
  if (loading && !stats) {
    return (
      <div className={cn('category-networking', className)}>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg">{interfaceName}</CardTitle>
            <CardDescription>Loading statistics...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-component-sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-16"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state with actionable message
  if (error && !stats) {
    return (
      <div className={cn('category-networking', className)}>
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-lg">{interfaceName}</CardTitle>
            <CardDescription>Failed to load</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle
                className="h-4 w-4"
                aria-hidden="true"
              />
              <AlertDescription className="text-sm">
                {error.message || 'Could not retrieve statistics. Check router connection.'}
              </AlertDescription>
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
    <div className={cn('category-networking', className)}>
      <Card
        className="bg-card"
        role="region"
        aria-label={`${interfaceName} statistics`}
      >
        <CardHeader className="pb-component-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="gap-component-sm flex items-center text-lg">
                <Activity
                  className="text-primary h-5 w-5"
                  aria-hidden="true"
                />
                <span className="truncate">{interfaceName}</span>
              </CardTitle>
              <CardDescription className="mt-component-sm text-sm">
                Real-time statistics
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-component-lg">
          {/* Error Warning Banner */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">Interface has errors</AlertDescription>
            </Alert>
          )}

          {/* Bandwidth Rates - Prominent Display */}
          {rates && (
            <div className="space-y-component-sm">
              <h3 className="text-muted-foreground text-sm font-semibold">Current Bandwidth</h3>
              <div className="space-y-component-sm">
                <Card className="border-chart-1/20 bg-chart-1/10 bg-muted">
                  <CardContent className="p-component-md">
                    <div className="flex items-center justify-between">
                      <div className="gap-component-sm flex items-center">
                        <div
                          className="bg-chart-1/20 flex h-10 w-10 items-center justify-center rounded-full"
                          aria-hidden="true"
                        >
                          <ArrowUp className="text-chart-1 h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-muted-foreground text-sm">TX Rate</div>
                          <div className="text-foreground truncate font-mono text-xl font-bold tabular-nums">
                            {formatBitsPerSecBigInt(rates.txRate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-chart-2/20 bg-chart-2/10 bg-muted">
                  <CardContent className="p-component-md">
                    <div className="flex items-center justify-between">
                      <div className="gap-component-sm flex items-center">
                        <div
                          className="bg-chart-2/20 flex h-10 w-10 items-center justify-center rounded-full"
                          aria-hidden="true"
                        >
                          <ArrowDown className="text-chart-2 h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-muted-foreground text-sm">RX Rate</div>
                          <div className="text-foreground truncate font-mono text-xl font-bold tabular-nums">
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
          <div className="space-y-component-sm">
            <h3 className="text-muted-foreground text-sm font-semibold">Traffic Counters</h3>
            <div className="gap-component-sm grid grid-cols-2">
              <StatsCounter
                value={stats.txBytes}
                label="TX Bytes"
                unit="bytes"
              />
              <StatsCounter
                value={stats.rxBytes}
                label="RX Bytes"
                unit="bytes"
              />
              <StatsCounter
                value={stats.txPackets}
                label="TX Packets"
                unit="packets"
              />
              <StatsCounter
                value={stats.rxPackets}
                label="RX Packets"
                unit="packets"
              />
            </div>
          </div>

          {/* Error Statistics */}
          <div className="space-y-component-sm">
            <h3 className="text-muted-foreground text-sm font-semibold">Errors & Drops</h3>
            <div className="gap-component-sm grid grid-cols-2">
              <StatsCounter
                value={String(stats.txErrors)}
                label="TX Errors"
                unit="count"
              />
              <StatsCounter
                value={String(stats.rxErrors)}
                label="RX Errors"
                unit="count"
              />
              <StatsCounter
                value={String(stats.txDrops)}
                label="TX Drops"
                unit="count"
              />
              <StatsCounter
                value={String(stats.rxDrops)}
                label="RX Drops"
                unit="count"
              />
            </div>

            {/* Error Rate */}
            <ErrorRateIndicator
              rate={errorRate}
              trend={0}
              threshold={0.1}
            />

            {/* High Error Warning */}
            {isHighErrorRate && (
              <Alert variant="destructive">
                <AlertCircle
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                <AlertDescription className="text-sm">
                  High error rate detected ({(ERROR_RATE_THRESHOLD * 100).toFixed(1)}+%) - check
                  cable connections.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

InterfaceStatsPanelMobile.displayName = 'InterfaceStatsPanelMobile';
