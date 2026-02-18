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

        {/* Log Cards */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {viewer.error ? (
            <Card className="p-6 bg-error/10 border-error/20">
              <p className="text-error text-center">
                Error loading logs: {viewer.error.message}
              </p>
            </Card>
          ) : viewer.logs.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground text-center">
                {viewer.isLoading
                  ? 'Loading logs...'
                  : 'No logs found. Try adjusting your filters.'}
              </p>
            </Card>
          ) : (
            viewer.logs.map((log) => {
              const colors = getActionColorClasses(
                log.parsed.action || 'unknown'
              );
              const isSelected = viewer.selectedLog?.id === log.id;

              return (
                <Card
                  key={log.id}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleLogClick(log)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${colors.bg} ${colors.text} ${colors.border} border`}
                          >
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
                                <span className="text-sm text-muted-foreground">
                                  {log.parsed.prefix}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
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
                          className="min-h-[44px] min-w-[44px]"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {/* Connection Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">
                          Source
                        </div>
                        <div className="font-mono text-xs">
                          {log.parsed.srcIp || '-'}
                          {log.parsed.srcPort && (
                            <span className="text-muted-foreground">
                              :{log.parsed.srcPort}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">
                          Destination
                        </div>
                        <div className="font-mono text-xs">
                          {log.parsed.dstIp || '-'}
                          {log.parsed.dstPort && (
                            <span className="text-muted-foreground">
                              :{log.parsed.dstPort}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Protocol and Chain */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">
                          Protocol
                        </div>
                        <div className="text-xs">
                          {log.parsed.protocol || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-1">
                          Chain
                        </div>
                        <div className="text-xs">{log.parsed.chain || '-'}</div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">
                              Message
                            </div>
                            <p className="text-xs font-mono text-muted-foreground">
                              {log.message}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">
                                Interface In
                              </div>
                              <div className="text-xs">
                                {log.parsed.interfaceIn || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs mb-1">
                                Interface Out
                              </div>
                              <div className="text-xs">
                                {log.parsed.interfaceOut || '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

FirewallLogViewerMobile.displayName = 'FirewallLogViewerMobile';
