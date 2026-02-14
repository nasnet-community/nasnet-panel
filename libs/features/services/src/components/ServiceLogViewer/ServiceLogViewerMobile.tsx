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

/**
 * Mobile presenter for ServiceLogViewer
 *
 * Features:
 * - Touch-optimized with 44px tap targets
 * - Bottom sheet for filters and actions
 * - Simplified layout for small screens
 * - Auto-scroll support
 * - JetBrains Mono font for logs
 */
export function ServiceLogViewerMobile(props: ServiceLogViewerProps) {
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

  const [copySuccess, setCopySuccess] = React.useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = React.useState(false);

  const handleCopy = async () => {
    try {
      await copyToClipboard();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      setActionsSheetOpen(false);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleLevelSelect = (level: LogLevel | null) => {
    setLevelFilter(level);
    setFilterSheetOpen(false);
  };

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
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11"
            aria-label="Search logs"
          />
          {hasSearch && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Filter and Actions buttons */}
        <div className="flex items-center gap-2 mt-4">
          {/* Filter button */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 h-11" size="default">
                <Filter className="mr-2 h-5 w-5" />
                {levelFilter || 'All Levels'}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Filter by Level</SheetTitle>
              </SheetHeader>
              <div className="space-y-2 mt-4">
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
              <div className="space-y-4 mt-4">
                {/* Auto-scroll toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-scroll-mobile" className="text-base">
                    Auto-scroll to bottom
                  </Label>
                  <Switch
                    id="auto-scroll-mobile"
                    checked={autoScroll}
                    onCheckedChange={setAutoScroll}
                  />
                </div>

                {/* Action buttons */}
                <Button
                  variant="outline"
                  className="w-full h-11 justify-start"
                  onClick={handleCopy}
                >
                  <Copy className="mr-2 h-5 w-5" />
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
                  <RefreshCw className="mr-2 h-5 w-5" />
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
                  <Trash2 className="mr-2 h-5 w-5" />
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
          <div className="p-4 text-sm text-destructive">
            Error loading logs: {error.message}
          </div>
        )}

        {/* Loading state */}
        {isLoading && !searchResults.length && (
          <div className="p-4 text-sm text-muted-foreground">Loading logs...</div>
        )}

        {/* Empty state */}
        {!isLoading && !searchResults.length && (
          <div className="p-4 text-sm text-muted-foreground text-center">
            {hasSearch || levelFilter
              ? 'No logs match your filters'
              : 'No logs available yet'}
          </div>
        )}

        {/* Log entries list */}
        {searchResults.length > 0 && (
          <div className="max-h-[500px] overflow-y-auto">
            {searchResults.map((entry, index) => {
              const bgColor = getLogLevelBgColor(entry.level);
              const textColor = getLogLevelColor(entry.level);

              return (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className={`
                    p-3 border-b border-border
                    font-mono text-xs
                    active:bg-accent
                    min-h-[44px]
                    ${bgColor}
                  `}
                  onClick={() => onEntryClick?.(entry)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Log entry: ${entry.level} - ${entry.message}`}
                >
                  {/* Timestamp and level */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">
                      {formatLogTimestamp(entry.timestamp)}
                    </span>
                    <span className={`font-bold ${textColor}`}>
                      {entry.level}
                    </span>
                  </div>

                  {/* Source */}
                  <div className="text-muted-foreground mb-1 truncate">
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
