/**
 * PingToolDesktop - Desktop Presenter for Ping Diagnostic Tool
 *
 * Dense side-by-side layout optimized for desktop screens (>1024px).
 * - Left column: form with all advanced options visible
 * - Right column: results, latency graph, and statistics
 *
 * WCAG AAA Compliance:
 * - 7:1 contrast ratio on all text
 * - 32-38px touch/click targets for buttons
 * - IP addresses and latency in monospace font (font-mono)
 * - Semantic color tokens (success/warning/destructive)
 * - ARIA live regions for dynamic results
 * - Keyboard accessible form with proper labels
 */

import { memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
} from '@nasnet/ui/primitives';
import { Play, Square, Loader2 } from 'lucide-react';
import { pingFormSchema, type PingFormValues } from './ping.schema';
import { usePing } from './usePing';
import { PingResults } from './PingResults';
import { PingStatistics } from './PingStatistics';
import { LatencyGraph } from './LatencyGraph';
import type { PingToolProps } from './PingTool.types';

/**
 * PingToolDesktop - Desktop presenter component
 *
 * Grid layout with dense information display:
 * - Left: Ping form (40% width) with all advanced options visible
 * - Right: Streaming results (60% width) with graph and stats below
 *
 * Performance optimizations:
 * - useCallback for form submission to prevent unnecessary re-renders
 * - React.memo to skip re-renders when props unchanged
 * - Stable form schema validation
 * - Virtualized results list for 100+ items
 *
 * @param props - Component props (routerId, onComplete, onError callbacks)
 * @returns Desktop layout presenter
 */
export const PingToolDesktop = memo(function PingToolDesktop({
  routerId,
  onComplete,
  onError,
}: PingToolProps) {
  const ping = usePing({
    deviceId: routerId,
    onComplete,
    onError,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<PingFormValues>({
    resolver: zodResolver(pingFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      target: '',
      count: 10,
      size: 56,
      timeout: 1000,
    },
  });

  // Stable form submission handler with useCallback
  const onSubmit = useCallback((values: PingFormValues) => {
    ping.startPing(values);
  }, [ping]);

  return (
    <div className="grid grid-cols-2 gap-component-lg">
      {/* Left column: Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ping Diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-component-lg">
            {/* Target input with semantic tokens and monospace for IPs */}
            <div className="space-y-component-sm">
              <Label htmlFor="ping-target">
                Target <span className="text-error">*</span>
              </Label>
              <Input
                id="ping-target"
                placeholder="8.8.8.8 or hostname"
                aria-describedby="ping-target-description"
                disabled={ping.isRunning}
                className="font-mono"
                {...register('target')}
              />
              <p
                id="ping-target-description"
                className="text-xs text-muted-foreground"
              >
                IPv4, IPv6, or hostname
              </p>
              {errors.target && (
                <p className="text-xs text-error" role="alert">
                  {errors.target.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Advanced options */}
            <div className="space-y-component-lg">
              <h4 className="text-sm font-semibold">Advanced Options</h4>

              <div className="grid grid-cols-2 gap-component-lg">
                {/* Count */}
                <div className="space-y-component-sm">
                  <Label htmlFor="ping-count">Count</Label>
                  <Input
                    id="ping-count"
                    type="number"
                    min={1}
                    max={100}
                    disabled={ping.isRunning}
                    {...register('count')}
                  />
                  {errors.count && (
                    <p className="text-xs text-error" role="alert">
                      {errors.count.message}
                    </p>
                  )}
                </div>

                {/* Size */}
                <div className="space-y-component-sm">
                  <Label htmlFor="ping-size">Size (bytes)</Label>
                  <Input
                    id="ping-size"
                    type="number"
                    min={56}
                    max={65500}
                    disabled={ping.isRunning}
                    {...register('size')}
                  />
                  {errors.size && (
                    <p className="text-xs text-error" role="alert">
                      {errors.size.message}
                    </p>
                  )}
                </div>

                {/* Timeout */}
                <div className="space-y-component-sm">
                  <Label htmlFor="ping-timeout">Timeout (ms)</Label>
                  <Input
                    id="ping-timeout"
                    type="number"
                    min={100}
                    max={30000}
                    disabled={ping.isRunning}
                    {...register('timeout')}
                  />
                  {errors.timeout && (
                    <p className="text-xs text-error" role="alert">
                      {errors.timeout.message}
                    </p>
                  )}
                </div>

                {/* Source Interface */}
                <div className="space-y-component-sm">
                  <Label htmlFor="ping-source">Source Interface</Label>
                  <Input
                    id="ping-source"
                    placeholder="Auto"
                    disabled={ping.isRunning}
                    {...register('sourceInterface')}
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-component-md">
              {!ping.isRunning ? (
                <Button
                  type="submit"
                  disabled={!isValid || ping.isStarting}
                  className="flex-1"
                  aria-label="Start ping"
                >
                  {ping.isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" aria-hidden="true" />
                      Start Ping
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={ping.stop}
                  disabled={ping.isStopping}
                  className="flex-1"
                  aria-label="Stop ping"
                >
                  {ping.isStopping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" aria-hidden="true" />
                      Stop Ping
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Error display */}
            {ping.error && (
              <div
                className="p-component-md border border-error bg-error/10 rounded-card-sm text-xs text-error"
                role="alert"
              >
                {ping.error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Right column: Results, Graph, Statistics */}
      <div className="space-y-component-lg">
        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              Results {ping.results.length > 0 && `(${ping.results.length}/${ping.count})`}
            </CardTitle>
          </CardHeader>
          <CardContent role="log" aria-label="Ping results">
            <PingResults results={ping.results} />
          </CardContent>
        </Card>

        {/* Latency Graph */}
        {ping.results.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <LatencyGraph results={ping.results} />
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {ping.results.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <PingStatistics statistics={ping.statistics} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

PingToolDesktop.displayName = 'PingToolDesktop';
