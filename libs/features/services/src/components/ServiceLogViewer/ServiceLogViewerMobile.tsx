/**
 * ServiceLogViewer Mobile Presenter
 *
 * Mobile-optimized presenter for ServiceLogViewer pattern.
 * Touch-first interface with 44px targets and simplified UI.
 *
 * @see NAS-8.12: Service Logs & Diagnostics
 * @see ADR-018: Headless Platform Presenters
 */

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Search, X, Filter, Copy, RefreshCw, Trash2 } from 'lucide-react';

import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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
 * Mobile presenter for ServiceLogViewer
 *
 * Features:
 * - Touch-optimized with 44px tap targets
 * - Bottom sheet for filters and actions
 * - Simplified layout for small screens
 * - Auto-scroll support
 * - JetBrains Mono font for logs
 *
 * @description Touch-first interface with bottom sheets for filters and actions
 */
function ServiceLogViewerMobileComponent(props: ServiceLogViewerProps) {
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      setActionsSheetOpen(false);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, [copyToClipboard]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const handleLevelSelect = useCallback(
    (level: LogLevel | null) => {
      setLevelFilter(level);
      setFilterSheetOpen(false);
    },
    [setLevelFilter]
  );

  const handleEntryClick = useCallback(
    (entry: LogEntry) => {
      onEntryClick?.(entry);
    },
    [onEntryClick]
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Service Logs</span>
          <span className="text-sm font-normal text-muted-foreground">
            {searchResults.length} / {totalEntries}
          </span>
        </CardTitle>

        {/* Search bar */}
        <div className="relative mt-component-md">
          <Search className="absolute left-component-sm top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-component-lg pr-component-lg min-h-[44px]"
            aria-label="Search logs"
          />
          {hasSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-component-sm top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[var(--semantic-radius-button)]"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter and Actions buttons */}
        <div className="flex items-center gap-component-sm mt-component-md">
          {/* Filter button */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 h-11" size="default">
                <Filter className="mr-2 h-5 w-5" aria-hidden="true" />
                {levelFilter || 'All Levels'}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filter by Level</SheetTitle>
              </SheetHeader>
              <div className="space-y-component-sm mt-component-md">
                <Button
                  variant={!levelFilter ? 'default' : 'outline'}
                  className="w-full h-11 justify-between"
                  onClick={() => handleLevelSelect(null)}
                >
                  <span>All Levels</span>
                  <Badge variant="secondary">{totalEntries}</Badge>
                </Button>
                {(['DEBUG', 'INFO', 'WARN', 'ERROR'] as LogLevel[]).map((level) => (
                  <Button
                    key={level}
                    variant={levelFilter === level ? 'default' : 'outline'}
                    className="w-full h-11 justify-between"
                    onClick={() => handleLevelSelect(level)}
                    disabled={levelCounts[level] === 0}
                  >
                    <span className={getLogLevelColor(level)}>{level}</span>
                    <Badge variant="secondary">{levelCounts[level]}</Badge>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Actions button */}
          <Sheet open={actionsSheetOpen} onOpenChange={setActionsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 h-11" size="default">
                Actions
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Log Actions</SheetTitle>
              </SheetHeader>
              <div className="space-y-component-md mt-component-md">
                {/* Auto-scroll toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-scroll-mobile" className="text-base">
                    Auto-scroll to bottom
                  </Label>
                  <Switch
                    id="auto-scroll-mobile"
                    checked={autoScroll}
                    onCheckedChange={setAutoScroll}
                    aria-label="Auto-scroll to bottom"
                  />
                </div>

                {/* Action buttons */}
                <Button
                  variant="outline"
                  className="w-full h-11 justify-start"
                  onClick={handleCopy}
                >
                  <Copy className="mr-2 h-5 w-5" aria-hidden="true" />
                  {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-start"
                  onClick={() => {
                    refreshLogs();
                    setActionsSheetOpen(false);
                  }}
                >
                  <RefreshCw className="mr-2 h-5 w-5" aria-hidden="true" />
                  Refresh Logs
                </Button>
                <Button
                  variant="destructive"
                  className="w-full h-11 justify-start"
                  onClick={() => {
                    clearLogs();
                    setActionsSheetOpen(false);
                  }}
                >
                  <Trash2 className="mr-2 h-5 w-5" aria-hidden="true" />
                  Clear Logs
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Error state */}
        {error && (
          <div className="p-component-md text-sm text-error">
            Error loading logs: {error.message}
          </div>
        )}

        {/* Loading state */}
        {isLoading && !searchResults.length && (
          <div className="p-component-md text-sm text-muted-foreground" role="status">Loading logs...</div>
        )}

        {/* Empty state */}
        {!isLoading && !searchResults.length && (
          <div className="p-component-md text-sm text-muted-foreground text-center">
            {hasSearch || levelFilter
              ? 'No logs match your filters'
              : 'No logs available yet'}
          </div>
        )}

        {/* Log entries list */}
        {searchResults.length > 0 && (
          <div className="max-h-[500px] overflow-y-auto" role="log" aria-label="Service log entries">
            {searchResults.map((entry, index) => {
              const bgColor = getLogLevelBgColor(entry.level);
              const textColor = getLogLevelColor(entry.level);

              return (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className={cn(
                    'p-component-sm border-b border-border',
                    'font-mono text-xs',
                    'active:bg-accent',
                    'min-h-[44px]',
                    bgColor,
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                  onClick={() => handleEntryClick(entry)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Log entry: ${entry.level} - ${entry.message}`}
                >
                  {/* Timestamp and level */}
                  <div className="flex items-center justify-between gap-component-sm mb-component-sm">
                    <span className="text-muted-foreground font-mono">
                      {formatLogTimestamp(entry.timestamp)}
                    </span>
                    <span className={`font-bold ${textColor}`}>
                      {entry.level}
                    </span>
                  </div>

                  {/* Source */}
                  <div className="text-muted-foreground mb-component-sm truncate font-mono">
                    {entry.source}
                  </div>

                  {/* Message */}
                  <div className="break-words">{entry.message}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const ServiceLogViewerMobile = React.memo(ServiceLogViewerMobileComponent);
ServiceLogViewerMobile.displayName = 'ServiceLogViewerMobile';
