/**
 * DNS Cache Panel - Mobile Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.4
 *
 * Mobile layout (<640px) with compact card layout
 */

import * as React from 'react';
import { Button } from '@nasnet/ui/primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@nasnet/ui/primitives/card';
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
import { Database, Trash2, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDnsCachePanel } from './useDnsCachePanel';
import type { DnsCachePanelProps } from './types';

export function DnsCachePanelMobile({
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
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error || 'Failed to load cache statistics'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">DNS Cache</CardTitle>
          <CardDescription className="text-sm">Monitor and manage DNS cache</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics Cards */}
          <div className="space-y-3">
            {/* Total Entries */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Entries</span>
                  </div>
                  <div className="text-xl font-bold">
                    {isLoading ? '...' : cacheStats?.totalEntries?.toLocaleString() || '0'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Usage */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cache Usage</span>
                  <Badge variant="secondary" className="text-xs">
                    {isLoading ? '...' : `${cacheStats?.cacheUsagePercent?.toFixed(1) || 0}%`}
                  </Badge>
                </div>
                <Progress value={cacheStats?.cacheUsagePercent || 0} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cacheUsedFormatted}</span>
                  <span>{cacheMaxFormatted}</span>
                </div>
              </CardContent>
            </Card>

            {/* Hit Rate */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-semantic-success" />
                    <span className="text-sm text-muted-foreground">Hit Rate</span>
                  </div>
                  <div className="text-xl font-bold text-semantic-success">{hitRateFormatted}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Domains */}
          {cacheStats?.topDomains && cacheStats.topDomains.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Most Queried (Top 10)</h3>
              <div className="space-y-2">
                {cacheStats.topDomains.slice(0, 10).map((domain, index) => (
                  <div
                    key={domain.domain}
                    className="flex items-start justify-between p-3 bg-muted rounded-md gap-2"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Badge variant="outline" className="font-mono text-xs flex-shrink-0">
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-medium break-all">{domain.domain}</span>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
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
            className="w-full gap-2 h-11"
            size="lg"
          >
            <Trash2 className="h-5 w-5" />
            Flush Cache
          </Button>
        </CardContent>
      </Card>

      {/* Flush Confirmation Dialog */}
      <Dialog open={isFlushDialogOpen} onOpenChange={closeFlushDialog}>
        <DialogContent className="max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-lg">Flush DNS Cache?</DialogTitle>
            <DialogDescription className="text-sm">
              This will remove all cached DNS entries. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* Before/After Stats Preview */}
          {cacheStats && !flushResult && (
            <div className="space-y-2 p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">Current Cache:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries:</span>
                  <span className="font-mono">{cacheStats.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-mono">{cacheUsedFormatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usage:</span>
                  <span className="font-mono">{cacheStats.cacheUsagePercent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {flushResult && (
            <Alert variant="default" className="border-semantic-success">
              <CheckCircle2 className="h-4 w-4 text-semantic-success" />
              <AlertDescription className="text-sm">
                Flushed {flushResult.entriesRemoved} entries
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
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
              className="bg-semantic-error hover:bg-semantic-error/90 w-full sm:w-auto"
            >
              {isFlushing ? 'Flushing...' : 'Flush Cache'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
