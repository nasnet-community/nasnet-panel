/**
 * RuleStatisticsPanelDesktop Component
 *
 * Desktop presenter for rule statistics (side sheet, 500px width).
 */

import { useState, useMemo, memo } from 'react';

import { Download, X } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@nasnet/ui/primitives';

import { TrafficHistoryChart } from './TrafficHistoryChart';

import type { RuleStatisticsPanelDesktopProps, TimeRange, CounterHistoryEntry } from './types';

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
 * RuleStatisticsPanelDesktop - Desktop layout (side sheet)
 */
export const RuleStatisticsPanelDesktop = memo(function RuleStatisticsPanelDesktop({
  isOpen,
  onClose,
  rule,
  historyData,
  onExportCsv,
}: RuleStatisticsPanelDesktopProps) {
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
    <Sheet
      open={isOpen}
      onOpenChange={onClose}
    >
      <SheetContent
        side="right"
        className="w-[500px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Rule Statistics</SheetTitle>
          <SheetDescription>
            Traffic history and counter details for rule #{rule.id}
          </SheetDescription>
        </SheetHeader>

        {/* Time Range Selector */}
        <div className="mt-6">
          <label
            htmlFor="time-range-tabs"
            className="text-foreground mb-2 block text-sm font-medium"
          >
            Time Range
          </label>
          <Tabs
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as TimeRange)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1h">1 Hour</TabsTrigger>
              <TabsTrigger value="24h">24 Hours</TabsTrigger>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Traffic Chart */}
        <div className="mt-6">
          <h3 className="text-foreground mb-3 text-sm font-medium">Traffic Over Time</h3>
          <TrafficHistoryChart
            data={filteredData}
            height={300}
          />
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-muted-foreground mb-1 text-sm">Total Bytes</p>
            <p className="text-foreground text-2xl font-semibold">{formatBytes(totalBytes)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-muted-foreground mb-1 text-sm">Total Packets</p>
            <p className="text-foreground text-2xl font-semibold">
              {totalPackets.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Rule Details */}
        <div className="mt-6">
          <h3 className="text-foreground mb-3 text-sm font-medium">Rule Details</h3>
          <div className="bg-muted/30 space-y-2 rounded-lg p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Rule ID:</span>
              <span className="text-foreground text-sm font-medium">#{rule.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Chain:</span>
              <span className="text-foreground text-sm font-medium">{rule.chain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Action:</span>
              <span className="text-foreground text-sm font-medium">{rule.action}</span>
            </div>
            {rule.comment && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Comment:</span>
                <span className="text-foreground text-sm font-medium">{rule.comment}</span>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6">
          <Button
            onClick={onExportCsv}
            className="w-full"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});

RuleStatisticsPanelDesktop.displayName = 'RuleStatisticsPanelDesktop';
