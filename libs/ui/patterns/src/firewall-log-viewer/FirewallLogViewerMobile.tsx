/**
 * FirewallLogViewerMobile - Mobile Platform Presenter
 *
 * Card-based layout with bottom sheet filters and 44px touch targets.
 * Optimized for touch interaction and limited screen space.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

import { memo, useCallback, useState } from 'react';

import { Play, Pause, Download, Search, Filter, ExternalLink, BarChart3, X } from 'lucide-react';

import type { FirewallLogEntry } from '@nasnet/core/types';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from '@nasnet/ui/primitives';

import { FirewallLogFilters, type FirewallLogFilterState } from '../firewall-log-filters';
import { FirewallLogStats } from '../firewall-log-stats';
import { getActionColorClasses } from './FirewallLogViewer.types';

import type { FirewallLogViewerPresenterProps } from './FirewallLogViewer.types';

/**
 * Mobile presenter for firewall log viewer.
 *
 * Features:
 * - Card-based log entries
 * - Bottom sheet for filters
 * - 44px minimum touch targets (WCAG AAA)
 * - Collapsible detail views
 * - Auto-refresh controls
 * - CSV export
 * - Stats panel (collapsible)
 */
export const FirewallLogViewerMobile = memo(function FirewallLogViewerMobile({
  routerId,
  viewer,
  availablePrefixes,
  onPrefixClick,
  onAddToBlocklist,
  className,
}: FirewallLogViewerPresenterProps) {
  // Local state for filter sheet
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Format timestamp for display
  const formatTime = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }, []);

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }, []);

  // Handle log card click
  const handleLogClick = useCallback(
    (log: FirewallLogEntry) => {
      viewer.selectLog(viewer.selectedLog?.id === log.id ? null : log);
    },
    [viewer]
  );

  // Handle prefix click
  const handlePrefixClick = useCallback(
    (e: React.MouseEvent, prefix: string) => {
      e.stopPropagation();
      if (onPrefixClick) {
        onPrefixClick(prefix);
      }
    },
    [onPrefixClick]
  );

  return (
    <div className={`bg-background flex h-screen flex-col ${className || ''}`}>
      {/* Header */}
      <div className="border-border bg-background space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Firewall Logs</h1>
          <div className="flex items-center gap-2">
            {/* Stats Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={viewer.toggleStats}
              className="h-11"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={viewer.exportToCSV}
              disabled={viewer.logs.length === 0}
              className="h-11"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            value={viewer.state.searchQuery}
            onChange={(e) => viewer.setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="h-11 pl-10"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-2">
          {/* Filter Button with Badge */}
          <Sheet
            open={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-11 flex-1"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {viewer.activeFilterCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground ml-2">
                    {viewer.activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="h-[80vh]"
            >
              <SheetHeader>
                <SheetTitle>Filter Logs</SheetTitle>
              </SheetHeader>
              <div className="mt-4 h-[calc(80vh-80px)] overflow-auto">
                <FirewallLogFilters
                  filters={viewer.state.filters as unknown as FirewallLogFilterState}
                  onFiltersChange={(filters) => viewer.setFilters(filters as any)}
                  availablePrefixes={availablePrefixes}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Auto-refresh Toggle */}
          <Button
            variant={viewer.state.isAutoRefreshEnabled ? 'default' : 'outline'}
            onClick={viewer.toggleAutoRefresh}
            className="h-11 min-w-[44px]"
          >
            {viewer.state.isAutoRefreshEnabled ?
              <Pause className="h-4 w-4" />
            : <Play className="h-4 w-4" />}
          </Button>

          {/* Refresh Interval */}
          <Select
            value={String(viewer.state.refreshInterval)}
            onValueChange={(v) =>
              viewer.setRefreshInterval(v === 'false' ? false : (Number(v) as any))
            }
          >
            <SelectTrigger className="h-11 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1000">1s</SelectItem>
              <SelectItem value="3000">3s</SelectItem>
              <SelectItem value="5000">5s</SelectItem>
              <SelectItem value="10000">10s</SelectItem>
              <SelectItem value="30000">30s</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Badge */}
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>
            {viewer.visibleCount} of {viewer.totalCount} logs
          </span>
          {viewer.isLoading && <span className="text-info">Refreshing...</span>}
        </div>
      </div>

      {/* Stats Panel (Collapsible) */}
      {viewer.state.expandedStats && (
        <div className="border-border bg-muted/30 border-b p-4">
          <FirewallLogStats
            logs={viewer.logs}
            onAddToBlocklist={onAddToBlocklist}
          />
        </div>
      )}

      {/* Log Cards - Always Dark Background */}
      <div className="flex-1 space-y-3 overflow-auto bg-slate-950 p-4 dark:bg-slate-900">
        {viewer.error ?
          <div className="bg-card border-error/20 text-error rounded-[var(--semantic-radius-card)] border p-6 text-center">
            <p>Error loading logs: {viewer.error.message}</p>
          </div>
        : viewer.logs.length === 0 ?
          <div className="bg-card border-border text-muted-foreground rounded-[var(--semantic-radius-card)] border p-6 text-center">
            <p>
              {viewer.isLoading ? 'Loading logs...' : 'No logs found. Try adjusting your filters.'}
            </p>
          </div>
        : viewer.logs.map((log) => {
            const isSelected = viewer.selectedLog?.id === log.id;
            const actionColor = log.parsed.action === 'accept' ? 'text-green-400' : 'text-red-400';

            return (
              <div
                key={log.id}
                className={`cursor-pointer rounded-[var(--semantic-radius-card)] border border-slate-700 bg-slate-800/30 p-3 transition-colors ${
                  isSelected ? 'ring-primary bg-slate-800/60 ring-2' : 'hover:bg-slate-800/50'
                }`}
                onClick={() => handleLogClick(log)}
              >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${actionColor} border border-current bg-transparent`}>
                        {log.parsed.action || 'unknown'}
                      </Badge>
                      {log.parsed.prefix && (
                        <>
                          {onPrefixClick ?
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary h-auto min-h-[44px] p-0"
                              onClick={(e) => handlePrefixClick(e, log.parsed.prefix!)}
                            >
                              {log.parsed.prefix}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          : <span className="text-xs text-slate-400">{log.parsed.prefix}</span>}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                    </div>
                  </div>
                  {isSelected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        viewer.selectLog(null);
                      }}
                      className="min-h-[44px] min-w-[44px] text-slate-400"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Connection Info */}
                <div className="mb-2 grid grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <div className="mb-1 text-slate-500">Source</div>
                    <div className="text-sky-400">
                      {log.parsed.srcIp || '-'}
                      {log.parsed.srcPort && (
                        <span className="text-purple-400">:{log.parsed.srcPort}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-500">Destination</div>
                    <div className="text-amber-400">
                      {log.parsed.dstIp || '-'}
                      {log.parsed.dstPort && (
                        <span className="text-purple-400">:{log.parsed.dstPort}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Protocol and Chain */}
                <div className="mb-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="mb-1 text-slate-500">Protocol</div>
                    <div className="text-slate-400">{log.parsed.protocol || '-'}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-500">Chain</div>
                    <div className="text-slate-400">{log.parsed.chain || '-'}</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <>
                    <div className="mt-3 border-t border-slate-700 pt-3">
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="mb-1 text-slate-500">Message</div>
                          <p className="break-words font-mono text-slate-400">{log.message}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="mb-1 text-slate-500">Interface In</div>
                            <div className="text-slate-400">{log.parsed.interfaceIn || '-'}</div>
                          </div>
                          <div>
                            <div className="mb-1 text-slate-500">Interface Out</div>
                            <div className="text-slate-400">{log.parsed.interfaceOut || '-'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
});

FirewallLogViewerMobile.displayName = 'FirewallLogViewerMobile';
