/**
 * FirewallLogViewerMobile - Mobile Platform Presenter
 *
 * Card-based layout with bottom sheet filters and 44px touch targets.
 * Optimized for touch interaction and limited screen space.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

import { memo, useCallback, useState } from 'react';

import {
  Play,
  Pause,
  Download,
  Search,
  Filter,
  ExternalLink,
  BarChart3,
  X,
} from 'lucide-react';

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
export const FirewallLogViewerMobile = memo(
  function FirewallLogViewerMobile({
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
      <div className={`flex flex-col h-screen bg-background ${className || ''}`}>
        {/* Header */}
        <div className="border-b border-border bg-background p-4 space-y-3">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={viewer.state.searchQuery}
              onChange={(e) => viewer.setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-10 h-11"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-2">
            {/* Filter Button with Badge */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-11 flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {viewer.activeFilterCount > 0 && (
                    <Badge className="ml-2 bg-primary text-primary-foreground">
                      {viewer.activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Filter Logs</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-auto h-[calc(80vh-80px)]">
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
              {viewer.state.isAutoRefreshEnabled ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            {/* Refresh Interval */}
            <Select
              value={String(viewer.state.refreshInterval)}
              onValueChange={(v) =>
                viewer.setRefreshInterval(
                  v === 'false' ? false : (Number(v) as any)
                )
              }
            >
              <SelectTrigger className="w-[100px] h-11">
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
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {viewer.visibleCount} of {viewer.totalCount} logs
            </span>
            {viewer.isLoading && (
              <span className="text-info">Refreshing...</span>
            )}
          </div>
        </div>

        {/* Stats Panel (Collapsible) */}
        {viewer.state.expandedStats && (
          <div className="border-b border-border bg-muted/30 p-4">
            <FirewallLogStats
              logs={viewer.logs}
              onAddToBlocklist={onAddToBlocklist}
            />
          </div>
        )}

        {/* Log Cards - Always Dark Background */}
        <div className="flex-1 overflow-auto bg-slate-950 dark:bg-slate-900 p-4 space-y-3">
          {viewer.error ? (
            <div className="bg-card border border-error/20 rounded-[var(--semantic-radius-card)] p-6 text-error text-center">
              <p>Error loading logs: {viewer.error.message}</p>
            </div>
          ) : viewer.logs.length === 0 ? (
            <div className="bg-card border border-border rounded-[var(--semantic-radius-card)] p-6 text-muted-foreground text-center">
              <p>
                {viewer.isLoading
                  ? 'Loading logs...'
                  : 'No logs found. Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            viewer.logs.map((log) => {
              const isSelected = viewer.selectedLog?.id === log.id;
              const actionColor = log.parsed.action === 'accept' ? 'text-green-400' : 'text-red-400';

              return (
                <div
                  key={log.id}
                  className={`bg-slate-800/30 border border-slate-700 rounded-[var(--semantic-radius-card)] cursor-pointer transition-colors p-3 ${
                    isSelected ? 'ring-2 ring-primary bg-slate-800/60' : 'hover:bg-slate-800/50'
                  }`}
                  onClick={() => handleLogClick(log)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${actionColor} bg-transparent border border-current`}>
                          {log.parsed.action || 'unknown'}
                        </Badge>
                        {log.parsed.prefix && (
                          <>
                            {onPrefixClick ? (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-primary min-h-[44px]"
                                onClick={(e) =>
                                  handlePrefixClick(e, log.parsed.prefix!)
                                }
                              >
                                {log.parsed.prefix}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400">
                                {log.parsed.prefix}
                              </span>
                            )}
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
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-2">
                    <div>
                      <div className="text-slate-500 mb-1">Source</div>
                      <div className="text-sky-400">
                        {log.parsed.srcIp || '-'}
                        {log.parsed.srcPort && (
                          <span className="text-purple-400">
                            :{log.parsed.srcPort}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Destination</div>
                      <div className="text-amber-400">
                        {log.parsed.dstIp || '-'}
                        {log.parsed.dstPort && (
                          <span className="text-purple-400">
                            :{log.parsed.dstPort}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Protocol and Chain */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <div className="text-slate-500 mb-1">Protocol</div>
                      <div className="text-slate-400">{log.parsed.protocol || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-1">Chain</div>
                      <div className="text-slate-400">{log.parsed.chain || '-'}</div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <>
                      <div className="border-t border-slate-700 pt-3 mt-3">
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="text-slate-500 mb-1">Message</div>
                            <p className="text-slate-400 font-mono break-words">
                              {log.message}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-slate-500 mb-1">Interface In</div>
                              <div className="text-slate-400">
                                {log.parsed.interfaceIn || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">Interface Out</div>
                              <div className="text-slate-400">
                                {log.parsed.interfaceOut || '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

FirewallLogViewerMobile.displayName = 'FirewallLogViewerMobile';
