/**
 * PingToolMobile - Mobile Presenter for Ping Diagnostic Tool
 *
 * Mobile layout with stacked form and collapsible results sheet.
 * Optimized for small screens (<640px).
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
 * Stacked layout optimized for mobile screens (<640px).
 * Results shown in a bottom sheet for space efficiency.
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

  const onSubmit = (values: PingFormValues) => {
    ping.startPing(values);
  };

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ping Diagnostic</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Target input */}
            <div className="space-y-2">
              <Label htmlFor="ping-target-mobile">Target *</Label>
              <Input
                id="ping-target-mobile"
                placeholder="8.8.8.8 or hostname"
                disabled={ping.isRunning}
                {...register('target')}
              />
              {errors.target && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.target.message}
                </p>
              )}
            </div>

            {/* Compact advanced options */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
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
              <div className="space-y-1">
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
                className="p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive"
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
            <div className="space-y-6 mt-4" role="log" aria-label="Ping results">
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
