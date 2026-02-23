/**
 * RuleStatisticsPanelMobile Component
 *
 * Mobile presenter for rule statistics (full-screen sheet from bottom).
 */

import { useState, useMemo, memo } from 'react';

import { Download, X } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button, Tabs, TabsList, TabsTrigger } from '@nasnet/ui/primitives';

import { TrafficHistoryChart } from './TrafficHistoryChart';

import type { RuleStatisticsPanelMobileProps, TimeRange, CounterHistoryEntry } from './types';

/**
 * Filter history data by time range
 */
function filterByTimeRange(data: CounterHistoryEntry[], range: TimeRange): CounterHistoryEntry[] {
  const now = Date.now();
  const cutoffs: Record<TimeRange, number> = {
    '1h': now - 60 * 60 * 1000,
    '24h': now - 24 * 60 * 60 * 1000,
    '7d': now - 7 * 24 * 60 * 60 * 1000,
  };

  return data.filter((entry) => entry.timestamp >= cutoffs[range]);
}

/**
 * Format bytes with SI units
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

/**
 * RuleStatisticsPanelMobile - Mobile layout (full-screen bottom sheet)
 */
export const RuleStatisticsPanelMobile = memo(function RuleStatisticsPanelMobile({
  isOpen,
  onClose,
  rule,
  historyData,
  onExportCsv,
}: RuleStatisticsPanelMobileProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Filter data based on selected time range
  const filteredData = useMemo(
    () => filterByTimeRange(historyData, timeRange),
    [historyData, timeRange]
  );

  // Calculate total stats from filtered data
  const totalBytes = useMemo(
    () => filteredData.reduce((sum, entry) => sum + entry.bytes, 0),
    [filteredData]
  );

  const totalPackets = useMemo(
    () => filteredData.reduce((sum, entry) => sum + entry.packets, 0),
    [filteredData]
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Rule Statistics</SheetTitle>
          <SheetDescription>
            Traffic history for rule #{rule.id}
          </SheetDescription>
        </SheetHeader>

        {/* Time Range Selector */}
        <div className="mt-4">
          <label htmlFor="time-range-tabs" className="text-sm font-medium text-foreground mb-2 block">
            Time Range
          </label>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Traffic Chart - Compact for mobile */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Traffic Over Time</h3>
          <TrafficHistoryChart data={filteredData} height={200} />
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Bytes</p>
            <p className="text-lg font-semibold text-foreground">{formatBytes(totalBytes)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Total Packets</p>
            <p className="text-lg font-semibold text-foreground">
              {totalPackets.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Rule Details - Compact */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Rule Details</h3>
          <div className="space-y-2 bg-muted/30 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-medium text-foreground">#{rule.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chain:</span>
              <span className="font-medium text-foreground">{rule.chain}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Action:</span>
              <span className="font-medium text-foreground">{rule.action}</span>
            </div>
            {rule.comment && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comment:</span>
                <span className="font-medium text-foreground">{rule.comment}</span>
              </div>
            )}
          </div>
        </div>

        {/* Export Button - Full width with larger touch target */}
        <div className="mt-4">
          <Button onClick={onExportCsv} className="w-full h-11" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});

RuleStatisticsPanelMobile.displayName = 'RuleStatisticsPanelMobile';
