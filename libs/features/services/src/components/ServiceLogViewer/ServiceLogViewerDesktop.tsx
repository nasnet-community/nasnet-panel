/**
 * ServiceLogViewer Desktop Presenter
 *
 * Desktop-optimized presenter for ServiceLogViewer pattern.
 * Features virtual scrolling with @tanstack/react-virtual for performance.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  X,
  Filter,
  Copy,
  RefreshCw,
  Trash2,
  ChevronDown,
} from 'lucide-react';

import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Label,
  Switch,
} from '@nasnet/ui/primitives';

import {
  useServiceLogViewer,
  formatLogTimestamp,
  getLogLevelColor,
  getLogLevelBgColor,
  type ServiceLogViewerProps,
} from './useServiceLogViewer';
import type { LogLevel, LogEntry } from '@nasnet/api-client/queries';
import { cn } from '@nasnet/ui/utils';

/**
 * Height of each log row in pixels
 */
const ROW_HEIGHT = 32;

/**
 * Desktop presenter for ServiceLogViewer
 *
 * Features:
 * - Virtual scrolling with @tanstack/react-virtual
 * - Searchable with live filtering
 * - Log level filtering with counts
 * - Auto-scroll toggle
 * - Copy to clipboard
 * - JetBrains Mono font for logs
 *
 * @description High-performance presenter with virtual scrolling for 1000+ log lines
 */
function ServiceLogViewerDesktopComponent(props: ServiceLogViewerProps) {
  const { className, onEntryClick } = props;

  const {
    searchResults,
    levelFilter,
    setLevelFilter,
    searchQuery,
    setSearchQuery,
    hasSearch,
    isLoading,
    error,
    clearLogs,
    refreshLogs,
    copyToClipboard,
    autoScroll,
    setAutoScroll,
    levelCounts,
    totalEntries,
  } = useServiceLogViewer(props);

  const [copySuccess, setCopySuccess] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Setup virtualizer
  const rowVirtualizer = useVirtualizer({
    count: searchResults.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [copyToClipboard]);

  const handleClearFilter = useCallback(() => {
    setLevelFilter(null);
  }, [setLevelFilter]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const handleEntryClick = useCallback(
    (entry: LogEntry) => {
      onEntryClick?.(entry);
    },
    [onEntryClick]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Service Logs</CardTitle>
          <div className="flex items-center gap-2">
            {/* Total count */}
            <span className="text-sm text-muted-foreground">
              {searchResults.length} / {totalEntries} lines
            </span>

            {/* Auto-scroll toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
                aria-label="Auto-scroll to bottom"
              />
              <Label htmlFor="auto-scroll" className="text-sm cursor-pointer">
                Auto-scroll
              </Label>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={refreshLogs}>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Refresh Logs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearLogs} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Clear Logs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Search logs"
            />
            {hasSearch && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Level filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
                {levelFilter || 'All Levels'}
                <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClearFilter}>
                All Levels
                <Badge variant="secondary" className="ml-auto">
                  {totalEntries}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(['DEBUG', 'INFO', 'WARN', 'ERROR'] as LogLevel[]).map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  disabled={levelCounts[level] === 0}
                >
                  <span className={getLogLevelColor(level)}>{level}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {levelCounts[level]}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Error state */}
        {error && (
          <div className="p-4 text-sm text-destructive">
            Error loading logs: {error.message}
          </div>
        )}

        {/* Loading state */}
        {isLoading && !searchResults.length && (
          <div className="p-4 text-sm text-muted-foreground" role="status">Loading logs...</div>
        )}

        {/* Empty state */}
        {!isLoading && !searchResults.length && (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {hasSearch || levelFilter
              ? 'No logs match your filters'
              : 'No logs available yet'}
          </div>
        )}

        {/* Virtual scrolling log list */}
        {searchResults.length > 0 && (
          <div
            ref={parentRef}
            role="log"
            aria-label="Service log entries"
            className="h-[500px] border-t border-border overflow-auto scrollbar-thin"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const entry = searchResults[virtualRow.index];
                const bgColor = getLogLevelBgColor(entry.level);
                const textColor = getLogLevelColor(entry.level);

                return (
                  <div
                    key={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      'flex items-center px-3 border-b border-border',
                      'font-mono text-xs leading-none',
                      'cursor-pointer hover:bg-accent/50 transition-colors',
                      bgColor
                    )}
                    onClick={() => handleEntryClick(entry)}
                    role="row"
                    tabIndex={0}
                    aria-label={`Log entry: ${entry.level} - ${entry.message}`}
                  >
                    <span className="text-muted-foreground w-24 shrink-0">
                      {formatLogTimestamp(entry.timestamp)}
                    </span>
                    <span className={`w-16 shrink-0 font-bold ${textColor}`}>
                      [{entry.level}]
                    </span>
                    <span className="text-muted-foreground w-32 shrink-0 truncate">
                      {entry.source}
                    </span>
                    <span className="flex-1 truncate">{entry.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const ServiceLogViewerDesktop = React.memo(ServiceLogViewerDesktopComponent);
ServiceLogViewerDesktop.displayName = 'ServiceLogViewerDesktop';
