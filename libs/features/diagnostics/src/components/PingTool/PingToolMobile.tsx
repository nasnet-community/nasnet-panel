/**
 * PingToolMobile - Mobile Presenter for Ping Diagnostic Tool
 *
 * Progressive disclosure layout with form on main screen and
 * results in a full-screen bottom sheet (90vh).
 *
 * WCAG AAA Compliance:
 * - 44x44px minimum touch targets (all buttons)
 * - 8px minimum spacing between touch targets
 * - Full-screen sheet for better mobile UX (not floating modal)
 * - Semantic color tokens
 * - ARIA live regions for results
 * - Monospace font for IPs and latency
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@nasnet/ui/primitives';
import { Play, Square, Loader2, ChevronRight } from 'lucide-react';
import { pingFormSchema, type PingFormValues } from './ping.schema';
import { usePing } from './usePing';
import { PingResults } from './PingResults';
import { PingStatistics } from './PingStatistics';
import { LatencyGraph } from './LatencyGraph';
import type { PingToolProps } from './PingTool.types';

/**
 * PingToolMobile - Mobile presenter component
 *
 * Progressive disclosure layout optimized for touch (<640px):
 * - Main view: Form with essential fields (target, count, timeout)
 * - Bottom sheet: Full results, graph, and stats (triggered by button)
 *
 * Performance optimizations:
 * - useCallback for form submission
 * - React.memo to prevent unnecessary re-renders
 * - Lazy-loaded bottom sheet (only renders when needed)
 * - Virtualized results list (100+ results supported)
 *
 * @param props - Component props (routerId, onComplete, onError callbacks)
 * @returns Mobile layout presenter
 */
export const PingToolMobile = memo(function PingToolMobile({
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
    <div className="space-y-component-md">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ping Diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-component-md">
            {/* Target input with monospace for IPs */}
            <div className="space-y-component-xs">
              <Label htmlFor="ping-target-mobile">Target *</Label>
              <Input
                id="ping-target-mobile"
                placeholder="8.8.8.8 or hostname"
                disabled={ping.isRunning}
                className="font-mono"
                {...register('target')}
              />
              {errors.target && (
                <p className="text-sm text-error" role="alert">
                  {errors.target.message}
                </p>
              )}
            </div>

            {/* Compact advanced options */}
            <div className="grid grid-cols-2 gap-component-sm">
              <div className="space-y-component-xs">
                <Label htmlFor="ping-count-mobile" className="text-xs">
                  Count
                </Label>
                <Input
                  id="ping-count-mobile"
                  type="number"
                  min={1}
                  max={100}
                  disabled={ping.isRunning}
                  {...register('count')}
                />
              </div>
              <div className="space-y-component-xs">
                <Label htmlFor="ping-timeout-mobile" className="text-xs">
                  Timeout (ms)
                </Label>
                <Input
                  id="ping-timeout-mobile"
                  type="number"
                  min={100}
                  max={30000}
                  disabled={ping.isRunning}
                  {...register('timeout')}
                />
              </div>
            </div>

            {/* Action button */}
            {!ping.isRunning ? (
              <Button
                type="submit"
                disabled={!isValid || ping.isStarting}
                className="w-full"
                size="lg"
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
                className="w-full"
                size="lg"
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

            {/* Error display */}
            {ping.error && (
              <div
                className="p-component-sm border border-error bg-error/10 rounded-card-sm text-sm text-error"
                role="alert"
              >
                {ping.error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results Sheet (only show if there are results) */}
      {ping.results.length > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full" size="lg">
              View Results ({ping.results.length}/{ping.count})
              <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Ping Results</SheetTitle>
            </SheetHeader>
            <div className="space-y-component-lg mt-component-md" role="log" aria-label="Ping results">
              <PingResults results={ping.results} />
              <LatencyGraph results={ping.results} />
              <PingStatistics statistics={ping.statistics} />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
});

PingToolMobile.displayName = 'PingToolMobile';
