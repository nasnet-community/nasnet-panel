/**
 * PingToolDesktop - Desktop Presenter for Ping Diagnostic Tool
 *
 * Desktop layout with side-by-side form and results.
 * Form on the left, results/graph/stats on the right.
 */

import { memo } from 'react';
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
 * Side-by-side layout optimized for desktop screens (>1024px).
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
    resolver: zodResolver(pingFormSchema),
    mode: 'onChange',
    defaultValues: {
      target: '',
      count: 10,
      size: 56,
      timeout: 1000,
    },
  });

  const onSubmit = (values: PingFormValues) => {
    ping.startPing(values);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left column: Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ping Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Target input */}
            <div className="space-y-2">
              <Label htmlFor="ping-target">
                Target <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ping-target"
                placeholder="Enter hostname or IP (e.g., 8.8.8.8)"
                aria-describedby="ping-target-description"
                disabled={ping.isRunning}
                {...register('target')}
              />
              <p
                id="ping-target-description"
                className="text-sm text-muted-foreground"
              >
                IPv4, IPv6 address, or hostname
              </p>
              {errors.target && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.target.message}
                </p>
              )}
            </div>

            <Separator />

            {/* Advanced options */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Advanced Options</h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Count */}
                <div className="space-y-2">
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
                    <p className="text-sm text-destructive" role="alert">
                      {errors.count.message}
                    </p>
                  )}
                </div>

                {/* Size */}
                <div className="space-y-2">
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
                    <p className="text-sm text-destructive" role="alert">
                      {errors.size.message}
                    </p>
                  )}
                </div>

                {/* Timeout */}
                <div className="space-y-2">
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
                    <p className="text-sm text-destructive" role="alert">
                      {errors.timeout.message}
                    </p>
                  )}
                </div>

                {/* Source Interface */}
                <div className="space-y-2">
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
            <div className="flex gap-2">
              {!ping.isRunning ? (
                <Button
                  type="submit"
                  disabled={!isValid || ping.isStarting}
                  className="flex-1"
                >
                  {ping.isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
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
                >
                  {ping.isStopping ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop Ping
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Error display */}
            {ping.error && (
              <div
                className="p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive"
                role="alert"
              >
                {ping.error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Right column: Results, Graph, Statistics */}
      <div className="space-y-6">
        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              Results {ping.results.length > 0 && `(${ping.results.length}/${ping.count})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
