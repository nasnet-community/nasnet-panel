/**
 * DNS Cache Panel - Mobile Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.4
 *
 * @description Mobile layout (<640px) with compact card layout for DNS cache statistics and flush controls.
 * Displays cache usage, hit rate, top domains, and flush button with confirmation dialog.
 */

import * as React from 'react';
import { Button } from '@nasnet/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@nasnet/ui/primitives/card';
import { Progress } from '@nasnet/ui/primitives/progress';
import { Badge } from '@nasnet/ui/primitives/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@nasnet/ui/primitives/dialog';
import { Alert, AlertDescription } from '@nasnet/ui/primitives/alert';
import { Icon } from '@nasnet/ui/primitives/icon';
import { AlertCircle, Database, TrendingUp, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@nasnet/ui/utils';
import { useDnsCachePanel } from './useDnsCachePanel';
import type { DnsCachePanelProps } from './types';

/**
 * DnsCachePanelMobile component
 * Renders mobile-optimized DNS cache panel with statistics and flush functionality.
 */
const DnsCachePanelMobileComponent = React.memo(function DnsCachePanelMobile({
  deviceId,
  enablePolling = true,
  onFlushSuccess,
  onFlushError,
  className,
}: DnsCachePanelProps) {
  const {
    isLoading,
    isFlushing,
    isError,
    isFlushDialogOpen,
    cacheStats,
    flushResult,
    error,
    cacheUsedFormatted,
    cacheMaxFormatted,
    hitRateFormatted,
    openFlushDialog,
    closeFlushDialog,
    confirmFlush,
  } = useDnsCachePanel({
    deviceId,
    enablePolling,
    onFlushSuccess,
    onFlushError,
  });

  if (isError) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="pt-component-lg">
          <Alert variant="destructive">
            <Icon
              icon={AlertCircle}
              className="h-4 w-4"
            />
            <AlertDescription className="text-sm">
              {error || 'Failed to load DNS cache statistics. Please try again.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn('category-networking', className)}>
        <CardHeader>
          <CardTitle className="text-lg">DNS Cache</CardTitle>
          <CardDescription className="text-sm">Monitor and manage DNS cache</CardDescription>
        </CardHeader>
        <CardContent className="space-y-component-md">
          {/* Statistics Cards */}
          <div className="space-y-component-md">
            {/* Total Entries */}
            <Card className="bg-muted/50">
              <CardContent className="p-component-md">
                <div className="flex items-center justify-between">
                  <div className="gap-component-sm flex items-center">
                    <Icon
                      icon={Database}
                      className="text-muted-foreground h-5 w-5"
                    />
                    <span className="text-muted-foreground text-sm">Total Entries</span>
                  </div>
                  <div className="font-mono text-xl font-bold">
                    {isLoading ? '…' : cacheStats?.totalEntries?.toLocaleString() || '0'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Usage */}
            <Card className="bg-muted/50">
              <CardContent className="p-component-md space-y-component-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Cache Usage</span>
                  <Badge
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    {isLoading ? '…' : `${cacheStats?.cacheUsagePercent?.toFixed(1) || 0}%`}
                  </Badge>
                </div>
                <Progress
                  value={cacheStats?.cacheUsagePercent || 0}
                  className="h-2"
                />
                <div className="text-muted-foreground flex justify-between font-mono text-xs">
                  <span>{cacheUsedFormatted}</span>
                  <span>{cacheMaxFormatted}</span>
                </div>
              </CardContent>
            </Card>

            {/* Hit Rate */}
            <Card className="bg-muted/50">
              <CardContent className="p-component-md">
                <div className="flex items-center justify-between">
                  <div className="gap-component-sm flex items-center">
                    <Icon
                      icon={TrendingUp}
                      className="text-success h-5 w-5"
                    />
                    <span className="text-muted-foreground text-sm">Hit Rate</span>
                  </div>
                  <div className="text-success font-mono text-xl font-bold">{hitRateFormatted}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Domains */}
          {cacheStats?.topDomains && cacheStats.topDomains.length > 0 && (
            <div className="space-y-component-md">
              <h3 className="text-sm font-medium">Most Queried (Top 10)</h3>
              <div className="space-y-component-sm">
                {cacheStats.topDomains.slice(0, 10).map((domain, index) => (
                  <div
                    key={domain.domain}
                    className="p-component-md bg-muted gap-component-sm flex items-start justify-between rounded-[var(--semantic-radius-button)]"
                  >
                    <div className="gap-component-sm flex min-w-0 items-start">
                      <Badge
                        variant="outline"
                        className="flex-shrink-0 font-mono text-xs"
                      >
                        #{index + 1}
                      </Badge>
                      <span className="break-all font-mono text-sm font-medium">
                        {domain.domain}
                      </span>
                    </div>
                    <div className="text-muted-foreground whitespace-nowrap font-mono text-xs">
                      {domain.queryCount}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flush Button */}
          <Button
            variant="destructive"
            onClick={openFlushDialog}
            disabled={isLoading || !cacheStats || cacheStats.totalEntries === 0}
            className="gap-component-sm h-11 w-full"
            size="lg"
          >
            <Icon
              icon={Trash2}
              className="h-5 w-5"
            />
            Flush Cache
          </Button>
        </CardContent>
      </Card>

      {/* Flush Confirmation Dialog */}
      <Dialog
        open={isFlushDialogOpen}
        onOpenChange={closeFlushDialog}
      >
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Flush DNS Cache?</DialogTitle>
            <DialogDescription className="text-sm">
              This will remove all cached DNS entries. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* Before/After Stats Preview */}
          {cacheStats && !flushResult && (
            <div className="space-y-component-sm p-component-md bg-muted rounded-[var(--semantic-radius-button)]">
              <div className="text-sm font-medium">Current Cache:</div>
              <div className="space-y-component-xs font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries:</span>
                  <span>{cacheStats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{cacheUsedFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage:</span>
                  <span>{cacheStats.cacheUsagePercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {flushResult && (
            <Alert
              variant="default"
              className="border-success"
            >
              <Icon
                icon={CheckCircle2}
                className="text-success h-4 w-4"
              />
              <AlertDescription className="text-sm">
                Flushed {flushResult.entriesRemoved} entries successfully
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-component-sm flex-col sm:flex-row">
            <Button
              variant="outline"
              disabled={isFlushing}
              onClick={closeFlushDialog}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmFlush}
              disabled={isFlushing || !!flushResult}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              {isFlushing ? 'Flushing…' : 'Flush Cache'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

DnsCachePanelMobileComponent.displayName = 'DnsCachePanelMobile';

export { DnsCachePanelMobileComponent as DnsCachePanelMobile };
