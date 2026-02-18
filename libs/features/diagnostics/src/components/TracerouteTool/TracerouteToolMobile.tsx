/**
 * TracerouteToolMobile - Mobile Presenter for Traceroute Diagnostic Tool
 *
 * Mobile layout with stacked form and results.
 * Optimized for touch interactions with 44px minimum touch targets.
 */

import { memo, useState, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  Alert,
  AlertTitle,
  AlertDescription,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@nasnet/ui/primitives';
import { Play, Square, Loader2, Download, Copy, CheckCircle2, AlertCircle, Settings } from 'lucide-react';
import { tracerouteFormSchema, type TracerouteFormValues } from './traceroute.schema';
import { useTraceroute } from '../../hooks/useTraceroute';
import { TracerouteHopsList } from './TracerouteHopsList';
import type { TracerouteToolProps } from './TracerouteTool.types';
import { cn } from '@nasnet/ui/utils';

/**
 * TracerouteToolMobile - Mobile presenter component
 *
 * Stacked layout optimized for mobile screens (<640px).
 * Features bottom sheet for advanced options and collapsible results.
 */
export const TracerouteToolMobile = memo(function TracerouteToolMobile({
  routerId,
  onComplete,
  onError,
  onCancelled,
  onHopDiscovered,
}: TracerouteToolProps) {
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const traceroute = useTraceroute({
    deviceId: routerId,
    onComplete,
    onError,
    onCancelled,
    onHopDiscovered,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<TracerouteFormValues>({
    resolver: zodResolver(tracerouteFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      target: '',
      maxHops: 30,
      timeout: 3000,
      probeCount: 3,
      protocol: 'ICMP',
    },
  });

  const protocol = watch('protocol');

  const onSubmit = async (values: TracerouteFormValues) => {
    await traceroute.run({
      target: values.target,
      maxHops: values.maxHops || 30,
      timeout: values.timeout || 3000,
      probeCount: values.probeCount || 3,
      protocol: values.protocol || 'ICMP',
    });
  };

  const handleStop = async () => {
    await traceroute.cancel();
  };

  /**
   * Copy results to clipboard as text
   */
  const handleCopyResults = async () => {
    if (!traceroute.hops.length) return;

    const text = formatResultsAsText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Download results as JSON
   */
  const handleDownloadJSON = () => {
    if (!traceroute.result) return;

    const json = JSON.stringify(traceroute.result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceroute-${traceroute.result.target}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Format results as plain text
   */
  const formatResultsAsText = (): string => {
    const lines: string[] = [];
    const target = traceroute.result?.target || watch('target');

    lines.push(`traceroute to ${target}, ${watch('maxHops')} hops max`);
    lines.push('');

    traceroute.hops.forEach((hop) => {
      const hopNum = hop.hopNumber.toString().padStart(2, ' ');
      const address = hop.address || '*';
      const hostname = hop.hostname && hop.hostname !== hop.address ? `(${hop.hostname})` : '';

      const probeLatencies = hop.probes
        .map((probe) => (probe.success && probe.latencyMs != null ? `${probe.latencyMs.toFixed(1)} ms` : '*'))
        .join('  ');

      lines.push(`${hopNum}  ${address} ${hostname}  ${probeLatencies}`);
    });

    if (traceroute.result) {
      lines.push('');
      lines.push(`--- ${target} traceroute statistics ---`);
      lines.push(`${traceroute.hops.length} hops, ${traceroute.result.totalTimeMs.toFixed(0)}ms total`);
      lines.push(`Destination ${traceroute.result.reachedDestination ? 'reached' : 'not reached'}`);
    }

    return lines.join('\n');
  };

  /**
   * Status message based on current state
   */
  const statusMessage = useMemo(() => {
    if (traceroute.error) return traceroute.error;
    if (traceroute.isRunning) return `Tracing... (${traceroute.hops.length} hops)`;
    if (traceroute.result) {
      if (traceroute.result.reachedDestination) {
        return `Complete! Reached ${traceroute.result.target}`;
      }
      return `Incomplete. Did not reach ${traceroute.result.target}`;
    }
    return null;
  }, [traceroute.error, traceroute.isRunning, traceroute.result, traceroute.hops.length]);

  return (
    <div className="space-y-4 pb-safe">
      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Traceroute Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Target input */}
            <div className="space-y-2">
              <Label htmlFor="traceroute-target-mobile">
                Target <span className="text-destructive">*</span>
              </Label>
              <Input
                id="traceroute-target-mobile"
                placeholder="e.g., 8.8.8.8 or google.com"
                disabled={traceroute.isRunning}
                autoComplete="off"
                className="min-h-[44px]"
                {...register('target')}
              />
              {errors.target && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.target.message}
                </p>
              )}
            </div>

            {/* Advanced options sheet */}
            <Sheet open={showAdvanced} onOpenChange={setShowAdvanced}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px]"
                  disabled={traceroute.isRunning}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Options
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh]">
                <SheetHeader>
                  <SheetTitle>Advanced Options</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  {/* Max Hops */}
                  <div className="space-y-2">
                    <Label htmlFor="traceroute-max-hops-mobile">Max Hops</Label>
                    <Input
                      id="traceroute-max-hops-mobile"
                      type="number"
                      min={1}
                      max={64}
                      className="min-h-[44px]"
                      {...register('maxHops', { valueAsNumber: true })}
                    />
                    {errors.maxHops && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.maxHops.message}
                      </p>
                    )}
                  </div>

                  {/* Timeout */}
                  <div className="space-y-2">
                    <Label htmlFor="traceroute-timeout-mobile">Timeout (ms)</Label>
                    <Input
                      id="traceroute-timeout-mobile"
                      type="number"
                      min={100}
                      max={30000}
                      step={100}
                      className="min-h-[44px]"
                      {...register('timeout', { valueAsNumber: true })}
                    />
                    {errors.timeout && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.timeout.message}
                      </p>
                    )}
                  </div>

                  {/* Probe Count */}
                  <div className="space-y-2">
                    <Label htmlFor="traceroute-probe-count-mobile">Probes per Hop</Label>
                    <Input
                      id="traceroute-probe-count-mobile"
                      type="number"
                      min={1}
                      max={5}
                      className="min-h-[44px]"
                      {...register('probeCount', { valueAsNumber: true })}
                    />
                    {errors.probeCount && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.probeCount.message}
                      </p>
                    )}
                  </div>

                  {/* Protocol */}
                  <div className="space-y-2">
                    <Label htmlFor="traceroute-protocol-mobile">Protocol</Label>
                    <Select
                      value={protocol}
                      onValueChange={(value) => register('protocol').onChange({ target: { value } })}
                    >
                      <SelectTrigger id="traceroute-protocol-mobile" className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICMP">ICMP (default)</SelectItem>
                        <SelectItem value="UDP">UDP</SelectItem>
                        <SelectItem value="TCP">TCP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAdvanced(false)}
                    className="w-full min-h-[44px]"
                  >
                    Done
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Action button */}
            {!traceroute.isRunning ? (
              <Button
                type="submit"
                disabled={!isValid}
                className="w-full min-h-[44px]"
                aria-label="Start traceroute"
              >
                <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                Start Traceroute
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStop}
                variant="destructive"
                className="w-full min-h-[44px]"
                aria-label="Stop traceroute"
              >
                <Square className="h-4 w-4 mr-2" aria-hidden="true" />
                Stop
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Status and progress */}
      {statusMessage && (
        <Alert variant={traceroute.error ? 'destructive' : 'default'}>
          {traceroute.error ? (
            <AlertCircle className="h-4 w-4" />
          ) : traceroute.result?.reachedDestination ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <AlertTitle>{traceroute.error ? 'Error' : 'Status'}</AlertTitle>
          <AlertDescription className="text-sm">{statusMessage}</AlertDescription>
        </Alert>
      )}

      {traceroute.isRunning && (
        <div className="space-y-2">
          <Progress value={traceroute.progress} aria-label="Traceroute progress" />
        </div>
      )}

      {/* Results */}
      {traceroute.hops.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hops ({traceroute.hops.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyResults}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Copy results"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                {traceroute.result && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadJSON}
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="Download JSON"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TracerouteHopsList hops={traceroute.hops} isRunning={traceroute.isRunning} />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!traceroute.isRunning && traceroute.hops.length === 0 && !traceroute.error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground">
              <p className="text-base font-medium mb-2">No results yet</p>
              <p className="text-sm">Enter a target to begin</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

TracerouteToolMobile.displayName = 'TracerouteToolMobile';
