/**
 * TracerouteToolDesktop - Desktop Presenter for Traceroute Diagnostic Tool
 *
 * Desktop layout with side-by-side form and results.
 * Form on the left, real-time hop results and path visualization on the right.
 */

import { memo, useState, useMemo, useCallback } from 'react';
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
} from '@nasnet/ui/primitives';
import { Play, Square, Loader2, Download, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { tracerouteFormSchema, type TracerouteFormValues } from './traceroute.schema';
import { useTraceroute } from '../../hooks/useTraceroute';
import { TracerouteHopsList } from './TracerouteHopsList';
import type { TracerouteToolProps } from './TracerouteTool.types';
import { cn } from '@nasnet/ui/utils';

/**
 * TracerouteToolDesktop - Desktop presenter component
 *
 * Side-by-side layout optimized for desktop screens (>1024px).
 * Features real-time hop discovery and network path visualization.
 */
export const TracerouteToolDesktop = memo(function TracerouteToolDesktop({
  routerId,
  onComplete,
  onError,
  onCancelled,
  onHopDiscovered,
}: TracerouteToolProps) {
  const [copied, setCopied] = useState(false);

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

  const onSubmit = useCallback(async (values: TracerouteFormValues) => {
    await traceroute.run({
      target: values.target,
      maxHops: values.maxHops || 30,
      timeout: values.timeout || 3000,
      probeCount: values.probeCount || 3,
      protocol: values.protocol || 'ICMP',
    });
  }, [traceroute]);

  const handleStop = useCallback(async () => {
    await traceroute.cancel();
  }, [traceroute]);

  /**
   * Format results as plain text (similar to CLI traceroute output)
   */
  const formatResultsAsText = useCallback((): string => {
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
  }, [traceroute.result, traceroute.hops, watch]);

  /**
   * Copy results to clipboard as text
   */
  const handleCopyResults = useCallback(async () => {
    if (!traceroute.hops.length) return;

    const text = formatResultsAsText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [traceroute.hops, formatResultsAsText]);

  /**
   * Download results as JSON
   */
  const handleDownloadJSON = useCallback(() => {
    if (!traceroute.result) return;

    const json = JSON.stringify(traceroute.result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceroute-${traceroute.result.target}-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [traceroute.result]);

  /**
   * Status message based on current state
   */
  const statusMessage = useMemo(() => {
    if (traceroute.error) return traceroute.error;
    if (traceroute.isRunning) return `Tracing route... (${traceroute.hops.length} hops discovered)`;
    if (traceroute.result) {
      if (traceroute.result.reachedDestination) {
        return `Trace complete! Reached ${traceroute.result.target} in ${traceroute.result.totalTimeMs.toFixed(0)}ms`;
      }
      return `Trace incomplete. Did not reach ${traceroute.result.target}`;
    }
    return null;
  }, [traceroute.error, traceroute.isRunning, traceroute.result, traceroute.hops.length]);

  return (
    <div className="grid grid-cols-2 gap-component-lg">
      {/* Left column: Form */}
      <Card>
        <CardHeader>
          <CardTitle>Traceroute Diagnostic Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-component-lg">
            {/* Target input */}
            <div className="space-y-component-sm">
              <Label htmlFor="traceroute-target">
                Target <span className="text-error">*</span>
              </Label>
              <Input
                id="traceroute-target"
                placeholder="Enter hostname or IP (e.g., 8.8.8.8, google.com)"
                aria-describedby="traceroute-target-description"
                disabled={traceroute.isRunning}
                autoComplete="off"
                className="font-mono"
                {...register('target')}
              />
              <p id="traceroute-target-description" className="text-xs text-muted-foreground">
                IPv4, IPv6 address, or hostname to trace route to
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
                {/* Max Hops */}
                <div className="space-y-component-sm">
                  <Label htmlFor="traceroute-max-hops">Max Hops</Label>
                  <Input
                    id="traceroute-max-hops"
                    type="number"
                    min={1}
                    max={64}
                    disabled={traceroute.isRunning}
                    {...register('maxHops', { valueAsNumber: true })}
                  />
                  {errors.maxHops && (
                    <p className="text-xs text-error" role="alert">
                      {errors.maxHops.message}
                    </p>
                  )}
                </div>

                {/* Timeout */}
                <div className="space-y-component-sm">
                  <Label htmlFor="traceroute-timeout">Timeout (ms)</Label>
                  <Input
                    id="traceroute-timeout"
                    type="number"
                    min={100}
                    max={30000}
                    step={100}
                    disabled={traceroute.isRunning}
                    {...register('timeout', { valueAsNumber: true })}
                  />
                  {errors.timeout && (
                    <p className="text-xs text-error" role="alert">
                      {errors.timeout.message}
                    </p>
                  )}
                </div>

                {/* Probe Count */}
                <div className="space-y-component-sm">
                  <Label htmlFor="traceroute-probe-count">Probes per Hop</Label>
                  <Input
                    id="traceroute-probe-count"
                    type="number"
                    min={1}
                    max={5}
                    disabled={traceroute.isRunning}
                    {...register('probeCount', { valueAsNumber: true })}
                  />
                  {errors.probeCount && (
                    <p className="text-xs text-error" role="alert">
                      {errors.probeCount.message}
                    </p>
                  )}
                </div>

                {/* Protocol */}
                <div className="space-y-component-sm">
                  <Label htmlFor="traceroute-protocol">Protocol</Label>
                  <Select
                    value={protocol}
                    onValueChange={(value) => register('protocol').onChange({ target: { value } })}
                    disabled={traceroute.isRunning}
                  >
                    <SelectTrigger id="traceroute-protocol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ICMP">ICMP (default)</SelectItem>
                      <SelectItem value="UDP">UDP</SelectItem>
                      <SelectItem value="TCP">TCP</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.protocol && (
                    <p className="text-xs text-error" role="alert">
                      {errors.protocol.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Action buttons */}
            <div className="flex gap-component-md">
              {!traceroute.isRunning ? (
                <Button
                  type="submit"
                  disabled={!isValid}
                  className="flex-1"
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
                  className="flex-1"
                  aria-label="Stop traceroute"
                >
                  <Square className="h-4 w-4 mr-2" aria-hidden="true" />
                  Stop
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Right column: Results */}
      <div className="space-y-component-lg">
        {/* Status bar */}
        {statusMessage && (
          <Alert variant={traceroute.error ? 'destructive' : 'default'}>
            {traceroute.error ? (
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            ) : traceroute.result?.reachedDestination ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <AlertTitle>{traceroute.error ? 'Error' : 'Status'}</AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        {/* Progress bar */}
        {traceroute.isRunning && (
          <div className="space-y-component-md">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{Math.round(traceroute.progress)}%</span>
            </div>
            <Progress value={traceroute.progress} aria-label="Traceroute progress" />
          </div>
        )}

        {/* Hops list */}
        {traceroute.hops.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Network Hops ({traceroute.hops.length})</CardTitle>
              <div className="flex gap-component-md">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyResults}
                  disabled={traceroute.hops.length === 0}
                  aria-label="Copy results to clipboard"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                {traceroute.result && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadJSON}
                    aria-label="Download results as JSON"
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    JSON
                  </Button>
                )}
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
            <CardContent className="flex flex-col items-center justify-center p-component-xl text-center">
              <div className="text-muted-foreground">
                <p className="text-lg font-medium mb-component-md">No results yet</p>
                <p className="text-xs">Enter a target and click "Start Traceroute" to begin</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

TracerouteToolDesktop.displayName = 'TracerouteToolDesktop';
