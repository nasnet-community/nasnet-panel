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
import { FirewallLogFilters } from '../firewall-log-filters';
import { FirewallLogStats } from '../firewall-log-stats';
import type { FirewallLogViewerPresenterProps } from './FirewallLogViewer.types';
import { getActionColorClasses } from './FirewallLogViewer.types';
import type { FirewallLogEntry } from '@nasnet/core/types';

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
export const FirewallLogViewerDesktop = memo(
  function FirewallLogViewerDesktop({
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
        return viewer.state.sortOrder === 'asc' ? (
          <ChevronUp className="h-4 w-4 inline ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 inline ml-1" />
        );
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
          filters={viewer.state.filters}
          onFiltersChange={viewer.setFilters}
          availablePrefixes={availablePrefixes}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-border bg-background p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Firewall Logs</h1>
              <div className="flex items-center gap-2">
                {/* Stats Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewer.toggleStats}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {viewer.state.expandedStats ? 'Hide Stats' : 'Show Stats'}
                </Button>

                {/* Auto-refresh Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={viewer.toggleAutoRefresh}
                  >
                    {viewer.state.isAutoRefreshEnabled ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Select
                    value={String(viewer.state.refreshInterval)}
                    onValueChange={(v) =>
                      viewer.setRefreshInterval(
                        v === 'false' ? false : (Number(v) as any)
                      )
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
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={viewer.state.searchQuery}
                onChange={(e) => viewer.setSearchQuery(e.target.value)}
                placeholder="Search logs (IP, prefix, protocol...)"
                className="pl-10"
              />
            </div>

            {/* Stats Badge */}
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {viewer.visibleCount} of {viewer.totalCount} logs
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
                routerId={routerId}
                onAddToBlocklist={onAddToBlocklist}
              />
            </div>
          )}

          {/* Log Table */}
          <div className="flex-1 overflow-auto">
            {viewer.error ? (
              <div className="flex items-center justify-center h-full">
                <Card className="p-6 bg-error/10 border-error/20">
                  <p className="text-error">
                    Error loading logs: {viewer.error.message}
                  </p>
                </Card>
              </div>
            ) : viewer.logs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Card className="p-6">
                  <p className="text-muted-foreground">
                    {viewer.isLoading
                      ? 'Loading logs...'
                      : 'No logs found. Try adjusting your filters.'}
                  </p>
                </Card>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleSort('timestamp')}
                    >
                      Time {renderSortIcon('timestamp')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleSort('action')}
                    >
                      Action {renderSortIcon('action')}
                    </TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleSort('srcIp')}
                    >
                      Source {renderSortIcon('srcIp')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleSort('dstIp')}
                    >
                      Destination {renderSortIcon('dstIp')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => handleSort('protocol')}
                    >
                      Protocol {renderSortIcon('protocol')}
                    </TableHead>
                    <TableHead>Prefix</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewer.logs.map((log) => {
                    const colors = getActionColorClasses(
                      log.parsed.action || 'unknown'
                    );
                    const isSelected = viewer.selectedLog?.id === log.id;

                    return (
                      <TableRow
                        key={log.id}
                        className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                        onClick={() => handleRowClick(log)}
                      >
                        <TableCell className="font-mono text-xs">
                          {formatTime(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${colors.bg} ${colors.text} ${colors.border} border`}
                          >
                            {log.parsed.action || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {log.parsed.chain || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.parsed.srcIp ? (
                            <div>
                              <div>{log.parsed.srcIp}</div>
                              {log.parsed.srcPort && (
                                <div className="text-muted-foreground">
                                  :{log.parsed.srcPort}
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.parsed.dstIp ? (
                            <div>
                              <div>{log.parsed.dstIp}</div>
                              {log.parsed.dstPort && (
                                <div className="text-muted-foreground">
                                  :{log.parsed.dstPort}
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">
                            {log.parsed.protocol || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.parsed.prefix && onPrefixClick ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary"
                              onClick={(e) =>
                                handlePrefixClick(e, log.parsed.prefix!)
                              }
                            >
                              {log.parsed.prefix}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          ) : log.parsed.prefix ? (
                            <span className="text-muted-foreground">
                              {log.parsed.prefix}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Detail Panel (Selected Log) */}
          {viewer.selectedLog && (
            <div className="border-t border-border bg-muted/30 p-4 max-h-[200px] overflow-auto">
              <div className="flex items-center justify-between mb-2">
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
                  <p className="text-muted-foreground font-mono mt-1">
                    {viewer.selectedLog.message}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <span className="font-medium">Chain:</span>
                    <p className="text-muted-foreground">
                      {viewer.selectedLog.parsed.chain || '-'}
                    </p>
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
  }
);

FirewallLogViewerDesktop.displayName = 'FirewallLogViewerDesktop';
