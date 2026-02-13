/**
 * InterfaceStatsPanelDesktop Component
 * Desktop presenter for interface statistics panel
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
 * Desktop Presenter for InterfaceStatsPanel
 *
 * Displays interface statistics in a dense, information-rich layout:
 * - Grid layout with multiple stat sections
 * - Real-time counters with animation
 * - Bandwidth rates with directional indicators
 * - Error rate with threshold warnings
 */
export function InterfaceStatsPanelDesktop({
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
      <Card className={className}>
        <CardHeader>
          <CardTitle>{interfaceName} Statistics</CardTitle>
          <CardDescription>Loading interface statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
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
          <CardTitle>{interfaceName} Statistics</CardTitle>
          <CardDescription>Failed to load statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {interfaceName} Statistics
            </CardTitle>
            <CardDescription>
              Real-time traffic statistics and error monitoring
            </CardDescription>
          </div>
          {hasErrors && (
            <Alert variant="destructive" className="w-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Interface has errors
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Traffic Counters Section */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Traffic Counters
          </h3>
          <div className="grid grid-cols-4 gap-4">
            <StatsCounter value={stats.txBytes} label="TX Bytes" unit="bytes" />
            <StatsCounter value={stats.rxBytes} label="RX Bytes" unit="bytes" />
            <StatsCounter value={stats.txPackets} label="TX Packets" unit="packets" />
            <StatsCounter value={stats.rxPackets} label="RX Packets" unit="packets" />
          </div>
        </div>

        {/* Bandwidth Rates Section */}
        {rates && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Bandwidth
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-chart-1/20 bg-chart-1/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowUp className="h-4 w-4" />
                        <span>TX Rate</span>
                      </div>
                      <div className="mt-1 text-3xl font-bold tabular-nums">
                        {formatBitsPerSecBigInt(rates.txRate)}
                      </div>
                    </div>
                    <Activity className="h-12 w-12 text-chart-1 opacity-20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-chart-2/20 bg-chart-2/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowDown className="h-4 w-4" />
                        <span>RX Rate</span>
                      </div>
                      <div className="mt-1 text-3xl font-bold tabular-nums">
                        {formatBitsPerSecBigInt(rates.rxRate)}
                      </div>
                    </div>
                    <Activity className="h-12 w-12 text-chart-2 opacity-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Errors Section */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Error Statistics
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <StatsCounter value={String(stats.txErrors)} label="TX Errors" unit="count" />
              <StatsCounter value={String(stats.rxErrors)} label="RX Errors" unit="count" />
              <StatsCounter value={String(stats.txDrops)} label="TX Drops" unit="count" />
              <StatsCounter value={String(stats.rxDrops)} label="RX Drops" unit="count" />
            </div>

            {/* Error Rate Indicator */}
            <ErrorRateIndicator rate={errorRate} trend={0} threshold={0.1} />

            {/* Warning for high error rates */}
            {errorRate > 0.1 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error rate exceeds 0.1% - check cable connections and port configuration
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
