/**
 * DNS Cache Panel - Desktop Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.3
 *
 * @description Desktop layout (>=640px) with stats cards, flush button, and
 * confirmation dialog with before/after preview. Shows top domains list.
 */

import * as React from 'react';
import { AlertCircle, Trash2, Database, TrendingUp, CheckCircle2 } from 'lucide-react';
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
import { cn } from '@nasnet/ui/utils';
import { useDnsCachePanel } from './useDnsCachePanel';
import type { DnsCachePanelProps } from './types';

/**
 * Desktop presenter for DNS Cache Panel component
 *
 * @internal Platform presenter - use DnsCachePanel wrapper for auto-detection
 */
function DnsCachePanelDesktopComponent({
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

  const handleOpenFlushDialog = React.useCallback(() => {
    openFlushDialog();
  }, [openFlushDialog]);

  const handleCloseFlushDialog = React.useCallback(() => {
    closeFlushDialog();
  }, [closeFlushDialog]);

  const handleConfirmFlush = React.useCallback(() => {
    confirmFlush();
  }, [confirmFlush]);

  if (isError) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="pt-component-lg">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertDescription>
              {error || 'Failed to load cache statistics'}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>DNS Cache</CardTitle>
              <CardDescription>Monitor and manage DNS cache</CardDescription>
            </div>
            <Button
              variant="destructive"
              onClick={handleOpenFlushDialog}
              disabled={
                isLoading || !cacheStats || cacheStats.totalEntries === 0
              }
              className="gap-component-sm"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Flush Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-component-lg">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-component-md">
            {/* Total Entries */}
            <Card>
              <CardContent className="pt-component-lg">
                <div className="flex items-center gap-component-md">
                  <Database
                    className="h-8 w-8 text-muted-foreground"
                    aria-hidden
                  />
                  <div>
                    <div className="text-2xl font-bold">
                      {isLoading
                        ? '...'
                        : cacheStats?.totalEntries?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Entries
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Usage */}
            <Card>
              <CardContent className="pt-component-lg space-y-component-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Cache Usage
                  </div>
                  <Badge variant="secondary">
                    {isLoading
                      ? '...'
                      : `${cacheStats?.cacheUsagePercent?.toFixed(1) || 0}%`}
                  </Badge>
                </div>
                <Progress
                  value={cacheStats?.cacheUsagePercent || 0}
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground text-right font-mono">
                  {cacheUsedFormatted} / {cacheMaxFormatted}
                </div>
              </CardContent>
            </Card>

            {/* Hit Rate */}
            <Card>
              <CardContent className="pt-component-lg">
                <div className="flex items-center gap-component-md">
                  <TrendingUp
                    className="h-8 w-8 text-success"
                    aria-hidden
                  />
                  <div>
                    <div className="text-2xl font-bold">{hitRateFormatted}</div>
                    <div className="text-sm text-muted-foreground">Hit Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Domains */}
          {cacheStats?.topDomains && cacheStats.topDomains.length > 0 && (
            <div className="space-y-component-md">
              <h3 className="text-sm font-medium">
                Most Queried Domains (Top 10)
              </h3>
              <div className="space-y-component-sm">
                {cacheStats.topDomains.slice(0, 10).map((domain, index) => (
                  <div
                    key={domain.domain}
                    className="flex items-center justify-between p-component-md bg-muted rounded-[var(--semantic-radius-button)]"
                  >
                    <div className="flex items-center gap-component-md">
                      <Badge variant="outline" className="font-mono">
                        #{index + 1}
                      </Badge>
                      <span className="font-mono text-sm break-all">
                        {domain.domain}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {domain.queryCount.toLocaleString()} queries
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flush Confirmation Dialog */}
      <Dialog open={isFlushDialogOpen} onOpenChange={handleCloseFlushDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flush DNS Cache?</DialogTitle>
            <DialogDescription>
              This will remove all cached DNS entries. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {/* Before/After Stats Preview */}
          {cacheStats && !flushResult && (
            <div className="space-y-component-sm p-component-md bg-muted rounded-[var(--semantic-radius-button)]">
              <div className="text-sm font-medium">Current Cache Status:</div>
              <div className="grid grid-cols-2 gap-component-sm text-sm">
                <div>Entries:</div>
                <div className="text-right font-mono">
                  {cacheStats.totalEntries}
                </div>
                <div>Size:</div>
                <div className="text-right font-mono">
                  {cacheUsedFormatted}
                </div>
                <div>Usage:</div>
                <div className="text-right font-mono">
                  {cacheStats.cacheUsagePercent.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {flushResult && (
            <Alert variant="default" className="border-success">
              <CheckCircle2
                className="h-4 w-4 text-success"
                aria-hidden
              />
              <AlertDescription>
                Successfully flushed {flushResult.entriesRemoved} entries from
                DNS cache
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={isFlushing}
              onClick={handleCloseFlushDialog}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmFlush}
              disabled={isFlushing || !!flushResult}
              variant="destructive"
            >
              {isFlushing ? 'Flushing...' : 'Flush Cache'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

DnsCachePanelDesktopComponent.displayName = 'DnsCachePanelDesktop';

export const DnsCachePanelDesktop = React.memo(
  DnsCachePanelDesktopComponent
);
