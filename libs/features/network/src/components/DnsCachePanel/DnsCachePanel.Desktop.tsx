/**
 * DNS Cache Panel - Desktop Presenter
 * NAS-6.12: DNS Cache & Diagnostics - Task 6.3
 *
 * Desktop layout (>=640px) with stats cards and flush button
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

export function DnsCachePanelDesktop({
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
            <AlertDescription>{error || 'Failed to load cache statistics'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>DNS Cache</CardTitle>
              <CardDescription>Monitor and manage DNS cache</CardDescription>
            </div>
            <Button
              variant="destructive"
              onClick={openFlushDialog}
              disabled={isLoading || !cacheStats || cacheStats.totalEntries === 0}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Flush Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Entries */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {isLoading ? '...' : cacheStats?.totalEntries?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Entries</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Usage */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Cache Usage</div>
                  <Badge variant="secondary">
                    {isLoading ? '...' : `${cacheStats?.cacheUsagePercent?.toFixed(1) || 0}%`}
                  </Badge>
                </div>
                <Progress value={cacheStats?.cacheUsagePercent || 0} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">
                  {cacheUsedFormatted} / {cacheMaxFormatted}
                </div>
              </CardContent>
            </Card>

            {/* Hit Rate */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-semantic-success" />
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
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Most Queried Domains (Top 10)</h3>
              <div className="space-y-2">
                {cacheStats.topDomains.slice(0, 10).map((domain, index) => (
                  <div
                    key={domain.domain}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{domain.domain}</span>
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
      <Dialog open={isFlushDialogOpen} onOpenChange={closeFlushDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flush DNS Cache?</DialogTitle>
            <DialogDescription>
              This will remove all cached DNS entries. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* Before/After Stats Preview */}
          {cacheStats && !flushResult && (
            <div className="space-y-2 p-4 bg-muted rounded-md">
              <div className="text-sm font-medium">Current Cache Status:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Entries:</div>
                <div className="text-right font-mono">{cacheStats.totalEntries}</div>
                <div>Size:</div>
                <div className="text-right font-mono">{cacheUsedFormatted}</div>
                <div>Usage:</div>
                <div className="text-right font-mono">{cacheStats.cacheUsagePercent.toFixed(1)}%</div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {flushResult && (
            <Alert variant="default" className="border-semantic-success">
              <CheckCircle2 className="h-4 w-4 text-semantic-success" />
              <AlertDescription>
                Successfully flushed {flushResult.entriesRemoved} entries from DNS cache
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={isFlushing} onClick={closeFlushDialog}>
              Cancel
            </Button>
            <Button
              onClick={confirmFlush}
              disabled={isFlushing || !!flushResult}
              className="bg-semantic-error hover:bg-semantic-error/90"
            >
              {isFlushing ? 'Flushing...' : 'Flush Cache'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
