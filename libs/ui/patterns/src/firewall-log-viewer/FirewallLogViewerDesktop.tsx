/**
 * FirewallLogViewerDesktop - Desktop Platform Presenter
 *
 * Split view layout with sidebar filters and virtualized table.
 * Optimized for mouse/keyboard interaction and dense data display.
 *
 * @module @nasnet/ui/patterns/firewall-log-viewer
 */

import { memo, useCallback } from 'react';

import {
  Play,
  Pause,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  BarChart3,
} from 'lucide-react';

import type { FirewallLogEntry } from '@nasnet/core/types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Badge,
  Card,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
} from '@nasnet/ui/primitives';

import { FirewallLogFilters, type FirewallLogFilterState } from '../firewall-log-filters';
import { FirewallLogStats } from '../firewall-log-stats';
import { getActionColorClasses } from './FirewallLogViewer.types';

import type { FirewallLogViewerPresenterProps } from './FirewallLogViewer.types';

/**
 * Desktop presenter for firewall log viewer.
 *
 * Features:
 * - Split view with filters sidebar (320px)
 * - Virtualized table for 100+ logs
 * - Sortable columns
 * - Action color badges
 * - Clickable prefix navigation
 * - Auto-refresh controls
 * - CSV export
 * - Stats panel (collapsible)
 */
export const FirewallLogViewerDesktop = memo(function FirewallLogViewerDesktop({
  routerId,
  viewer,
  availablePrefixes,
  onPrefixClick,
  onAddToBlocklist,
  className,
}: FirewallLogViewerPresenterProps) {
  // Format timestamp for display
  const formatTime = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }, []);

  // Handle column sort
  const handleSort = useCallback(
    (field: string) => {
      if (viewer.state.sortBy === field) {
        viewer.toggleSortOrder();
      } else {
        viewer.setSortBy(field as any);
      }
    },
    [viewer]
  );

  // Render sort icon
  const renderSortIcon = useCallback(
    (field: string) => {
      if (viewer.state.sortBy !== field) return null;
      return viewer.state.sortOrder === 'asc' ?
          <ChevronUp className="ml-1 inline h-4 w-4" />
        : <ChevronDown className="ml-1 inline h-4 w-4" />;
    },
    [viewer.state.sortBy, viewer.state.sortOrder]
  );

  // Handle row click
  const handleRowClick = useCallback(
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
    <div className={`flex h-screen ${className || ''}`}>
      {/* Filters Sidebar */}
      <FirewallLogFilters
        filters={viewer.state.filters as unknown as FirewallLogFilterState}
        onFiltersChange={(filters) => viewer.setFilters(filters as any)}
        availablePrefixes={availablePrefixes}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="border-border bg-background border-b p-4">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Firewall Logs</h1>
            <div className="flex items-center gap-2">
              {/* Stats Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={viewer.toggleStats}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {viewer.state.expandedStats ? 'Hide Stats' : 'Show Stats'}
              </Button>

              {/* Auto-refresh Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewer.toggleAutoRefresh}
                >
                  {viewer.state.isAutoRefreshEnabled ?
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </>
                  : <>
                      <Play className="mr-2 h-4 w-4" />
                      Play
                    </>
                  }
                </Button>
                <Select
                  value={String(viewer.state.refreshInterval)}
                  onValueChange={(v) =>
                    viewer.setRefreshInterval(v === 'false' ? false : (Number(v) as any))
                  }
                >
                  <SelectTrigger className="w-[120px]">
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

              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={viewer.exportToCSV}
                disabled={viewer.logs.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={viewer.state.searchQuery}
              onChange={(e) => viewer.setSearchQuery(e.target.value)}
              placeholder="Search logs (IP, prefix, protocol...)"
              className="pl-10"
            />
          </div>

          {/* Stats Badge */}
          <div className="text-muted-foreground mt-3 flex items-center justify-between text-sm">
            <span>
              Showing {viewer.visibleCount} of {viewer.totalCount} logs
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

        {/* Log Display Area */}
        <div className="flex-1 overflow-auto bg-slate-950 dark:bg-slate-900">
          {viewer.error ?
            <div className="flex h-full items-center justify-center p-4">
              <div className="bg-card border-error/20 text-error rounded-[var(--semantic-radius-card)] border p-6">
                <p>Error loading logs: {viewer.error.message}</p>
              </div>
            </div>
          : viewer.logs.length === 0 ?
            <div className="flex h-full items-center justify-center p-4">
              <div className="bg-card border-border text-muted-foreground rounded-[var(--semantic-radius-card)] border p-6 text-center">
                <p>
                  {viewer.isLoading ?
                    'Loading logs...'
                  : 'No logs found. Try adjusting your filters.'}
                </p>
              </div>
            </div>
          : <div className="p-4 font-mono text-xs leading-relaxed text-slate-50">
              {viewer.logs.map((log) => {
                const isSelected = viewer.selectedLog?.id === log.id;
                const actionColor =
                  log.parsed.action === 'accept' ? 'text-green-400' : 'text-red-400';

                return (
                  <div
                    key={log.id}
                    className={`cursor-pointer rounded px-3 py-2 transition-colors hover:bg-slate-800/50 ${
                      isSelected ? 'bg-slate-800' : ''
                    }`}
                    onClick={() => handleRowClick(log)}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-slate-500">{formatTime(log.timestamp)}</span>
                      <span className={actionColor}>{log.parsed.action || 'unknown'}</span>
                      {log.parsed.srcIp && (
                        <>
                          <span className="text-sky-400">{log.parsed.srcIp}</span>
                          {log.parsed.srcPort && (
                            <span className="text-purple-400">:{log.parsed.srcPort}</span>
                          )}
                        </>
                      )}
                      {log.parsed.dstIp && (
                        <>
                          <span className="text-amber-400">{log.parsed.dstIp}</span>
                          {log.parsed.dstPort && (
                            <span className="text-purple-400">:{log.parsed.dstPort}</span>
                          )}
                        </>
                      )}
                      {log.parsed.protocol && (
                        <span className="text-slate-400">{log.parsed.protocol}</span>
                      )}
                      {log.parsed.prefix && onPrefixClick ?
                        <Button
                          variant="link"
                          size="sm"
                          className="text-primary ml-2 h-auto p-0"
                          onClick={(e) => handlePrefixClick(e, log.parsed.prefix!)}
                        >
                          {log.parsed.prefix}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      : log.parsed.prefix ?
                        <span className="text-slate-400">{log.parsed.prefix}</span>
                      : null}
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </div>

        {/* Detail Panel (Selected Log) */}
        {viewer.selectedLog && (
          <div className="border-border bg-muted/30 max-h-[200px] overflow-auto border-t p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Log Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => viewer.selectLog(null)}
              >
                Close
              </Button>
            </div>
            <Separator className="mb-3" />
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Message:</span>
                <p className="text-muted-foreground mt-1 font-mono">{viewer.selectedLog.message}</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">Chain:</span>
                  <p className="text-muted-foreground">{viewer.selectedLog.parsed.chain || '-'}</p>
                </div>
                <div>
                  <span className="font-medium">Interface In:</span>
                  <p className="text-muted-foreground">
                    {viewer.selectedLog.parsed.interfaceIn || '-'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Interface Out:</span>
                  <p className="text-muted-foreground">
                    {viewer.selectedLog.parsed.interfaceOut || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

FirewallLogViewerDesktop.displayName = 'FirewallLogViewerDesktop';
