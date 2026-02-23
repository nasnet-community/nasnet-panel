/**
 * LogViewer Component
 * Main component for displaying system logs with all enhanced features
 * @description Real-time system logs viewer with search, filtering, grouping, bookmarks, and detail panel
 * Epic 0.8: System Logs - Full Feature Set
 */

import * as React from 'react';
import { AlertCircle, List, Layers, Pin, RefreshCw } from 'lucide-react';
import { useSystemLogs } from '@nasnet/api-client/queries';
import { useConnectionStore } from '@nasnet/state/stores';
import {
  LogEntry,
  LogFilters,
  NewEntriesIndicator,
  LogSearch,
  LogControls,
  LogStats,
  LogDetailPanel,
  LogGroupList,
  type LogGroupData,
} from '@nasnet/ui/patterns';
import {
  Skeleton,
  Button,
  cn,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  Icon,
} from '@nasnet/ui/primitives';
import { useAutoScroll } from '@nasnet/core/utils';
import type { LogTopic, LogSeverity, LogEntry as LogEntryType } from '@nasnet/core/types';
import {
  useLogBookmarks,
  useLogCorrelation,
  useLogAlerts,
  useLogCache,
  LogSettingsDialog,
  AlertSettingsDialog,
} from '@nasnet/features/logs';

export interface LogViewerProps {
  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Maximum number of log entries to fetch
   * @default 100
   */
  limit?: number;
}

/**
 * LogViewer Component
 *
 * Enhanced features:
 * - Text search with highlighting
 * - Pause/Resume live updates
 * - Export to CSV/JSON
 * - Copy log entries
 * - Statistics summary
 * - Responsive layout
 * - Log grouping/correlation
 * - Bookmarked logs
 * - Detail panel
 * - Real-time alerts
 * - Local caching
 */
export const LogViewer = React.memo(function LogViewer({ className, limit = 100 }: LogViewerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // State
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isPaused, setIsPaused] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date>();
  const [selectedEntry, setSelectedEntry] = React.useState<LogEntryType | null>(null);
  const [viewMode, setViewMode] = React.useState<'flat' | 'grouped' | 'bookmarked'>('flat');
  const [useCompactMode, setUseCompactMode] = React.useState(false);

  // Topic filter state with sessionStorage persistence
  const [selectedTopics, setSelectedTopics] = React.useState<LogTopic[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = sessionStorage.getItem('log-filter-topics');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Severity filter state with sessionStorage persistence
  const [selectedSeverities, setSelectedSeverities] = React.useState<LogSeverity[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = sessionStorage.getItem('log-filter-severities');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist filters to sessionStorage
  React.useEffect(() => {
    sessionStorage.setItem('log-filter-topics', JSON.stringify(selectedTopics));
  }, [selectedTopics]);

  React.useEffect(() => {
    sessionStorage.setItem('log-filter-severities', JSON.stringify(selectedSeverities));
  }, [selectedSeverities]);

  // Get router IP from connection store
  const routerIp = useConnectionStore((state) => state.currentRouterIp) || '';

  // Bookmarks hook
  const {
    bookmarkedLogs,
    isBookmarked,
    toggleBookmark,
  } = useLogBookmarks();

  // Alerts hook
  const { processLogs } = useLogAlerts();

  // Cache hook
  const { storeLogs, isOffline, cachedLogs } = useLogCache({
    routerIp,
    enabled: true,
  });

  // Fetch logs using TanStack Query hook
  const {
    data: logs,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useSystemLogs(routerIp, {
    topics: selectedTopics.length > 0 ? selectedTopics : undefined,
    severities: selectedSeverities.length > 0 ? selectedSeverities : undefined,
    limit,
    refetchInterval: isPaused ? undefined : 5000,
  });

  // Update last updated timestamp
  React.useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Store logs in cache and process for alerts
  React.useEffect(() => {
    if (logs && logs.length > 0) {
      storeLogs(logs);
      processLogs(logs);
    }
  }, [logs, storeLogs, processLogs]);

  // Use cached logs when offline
  const displayLogs = isOffline && cachedLogs.length > 0 ? cachedLogs : logs || [];

  // Filter logs by search term
  const filteredLogs = React.useMemo(() => {
    if (!searchTerm.trim()) return displayLogs;
    const term = searchTerm.toLowerCase();
    return displayLogs.filter((log) =>
      log.message.toLowerCase().includes(term)
    );
  }, [displayLogs, searchTerm]);

  // Log correlation/grouping
  const { groups, isGrouped, toggleGrouping } = useLogCorrelation(filteredLogs, {
    windowMs: 1000,
    minGroupSize: 2,
  });

  // Auto-scroll hook
  const { isAtBottom, newEntriesCount, scrollToBottom } = useAutoScroll({
    scrollRef: scrollContainerRef,
    data: filteredLogs,
    enabled: !isLoading && !isError && !isPaused,
  });

  // Detect mobile for compact mode
  React.useEffect(() => {
    const checkMobile = () => {
      setUseCompactMode(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get logs to display based on view mode
  const logsToDisplay = React.useMemo(() => {
    if (viewMode === 'bookmarked') {
      return bookmarkedLogs;
    }
    return filteredLogs;
  }, [viewMode, filteredLogs, bookmarkedLogs]);

  // Navigation for detail panel
  const currentEntryIndex = selectedEntry
    ? logsToDisplay.findIndex((l) => l.id === selectedEntry.id)
    : -1;

  const handlePrevious = () => {
    if (currentEntryIndex > 0) {
      setSelectedEntry(logsToDisplay[currentEntryIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentEntryIndex < logsToDisplay.length - 1) {
      setSelectedEntry(logsToDisplay[currentEntryIndex + 1]);
    }
  };

  // Get related entries for detail panel
  const relatedEntries = React.useMemo(() => {
    if (!selectedEntry) return [];
    return logsToDisplay
      .filter(
        (log) =>
          log.id !== selectedEntry.id && log.topic === selectedEntry.topic
      )
      .slice(0, 5);
  }, [selectedEntry, logsToDisplay]);

  return (
    <div className={cn('flex flex-col h-full gap-3', className)}>
      {/* Offline Banner */}
      {isOffline && (
        <div className="flex items-center gap-2 px-3 py-2 bg-semantic-warning-bg border border-semantic-warning-border rounded-card-sm text-sm text-semantic-warning">
          <Icon icon={AlertCircle} className="h-4 w-4" aria-hidden="true" />
          <span>You're offline. Showing cached logs.</span>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <LogSearch
          value={searchTerm}
          onChange={setSearchTerm}
          matchCount={searchTerm ? filteredLogs.length : undefined}
          totalCount={displayLogs.length}
          className="flex-1"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <LogControls
            isPaused={isPaused}
            onPauseToggle={() => setIsPaused(!isPaused)}
            lastUpdated={lastUpdated}
            logs={logsToDisplay}
            routerIp={routerIp}
          />

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center border rounded-button">
            <Button
              variant={viewMode === 'flat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('flat')}
              className="rounded-r-none"
              aria-label="Flat view"
            >
              <Icon icon={List} className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className="rounded-none border-x"
              aria-label="Grouped view"
            >
              <Icon icon={Layers} className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === 'bookmarked' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('bookmarked')}
              className="rounded-l-none"
              aria-label="Bookmarked"
            >
              <Icon icon={Pin} className="h-4 w-4" aria-hidden="true" />
              {bookmarkedLogs.length > 0 && (
                <span className="ml-1 text-xs font-mono">{bookmarkedLogs.length}</span>
              )}
            </Button>
          </div>

          {/* Settings dialogs */}
          <AlertSettingsDialog />
          <LogSettingsDialog />
        </div>
      </div>

      {/* Filter Controls */}
      <LogFilters
        topics={selectedTopics}
        onTopicsChange={setSelectedTopics}
        severities={selectedSeverities}
        onSeveritiesChange={setSelectedSeverities}
      />

      {/* Stats Summary */}
      {!isLoading && !isError && logsToDisplay.length > 0 && (
        <LogStats
          logs={logsToDisplay}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
        />
      )}

      {/* Loading State */}
      {isLoading && <LogViewerSkeleton />}

      {/* Error State */}
      {isError && (
        <LogViewerError error={error} onRetry={() => refetch()} />
      )}

      {/* Logs Display */}
      {!isLoading && !isError && (
        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto border rounded-lg bg-card"
          >
            {logsToDisplay.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 gap-2">
                {viewMode === 'bookmarked' ? (
                  <>
                    <Icon icon={Pin} className="h-8 w-8 opacity-50" aria-hidden="true" />
                    <p>No bookmarked entries</p>
                    <p className="text-xs">Click the pin icon on any log entry to bookmark it</p>
                  </>
                ) : searchTerm ? (
                  <>
                    <p>No logs match <span className="font-mono">"{searchTerm}"</span></p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <p>No log entries found</p>
                )}
              </div>
            ) : viewMode === 'grouped' ? (
              <div className="p-2">
                <LogGroupList
                  groups={groups as LogGroupData[]}
                  searchTerm={searchTerm}
                  onEntryClick={setSelectedEntry}
                  isBookmarked={(id: string) => isBookmarked(id)}
                  onToggleBookmark={toggleBookmark}
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logsToDisplay.map((log) => (
                  <LogEntry
                    key={log.id}
                    entry={log}
                    searchTerm={searchTerm}
                    isBookmarked={isBookmarked(log.id)}
                    onToggleBookmark={toggleBookmark}
                    compact={useCompactMode}
                    onClick={() => setSelectedEntry(log)}
                    className="cursor-pointer"
                  />
                ))}
              </div>
            )}
          </div>

          {/* New Entries Indicator */}
          {!isAtBottom && newEntriesCount > 0 && !isPaused && (
            <NewEntriesIndicator count={newEntriesCount} onClick={scrollToBottom} />
          )}
        </div>
      )}

      {/* Detail Panel */}
      <LogDetailPanel
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        relatedEntries={relatedEntries}
        onPrevious={handlePrevious}
        onNext={handleNext}
        hasPrevious={currentEntryIndex > 0}
        hasNext={currentEntryIndex < logsToDisplay.length - 1}
      />
    </div>
  );
});

LogViewer.displayName = 'LogViewer';

/**
 * Skeleton loading state for LogViewer
 */
function LogViewerSkeleton() {
  return (
    <div className="border rounded-lg bg-card p-3 space-y-2 flex-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-6 w-16 shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

/**
 * Error state for LogViewer
 */
interface LogViewerErrorProps {
  error: Error | null;
  onRetry: () => void;
}

const LogViewerError = React.memo(function LogViewerError({ error, onRetry }: LogViewerErrorProps) {
  return (
    <Card className="border-semantic-error-border bg-semantic-error-bg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-semantic-error text-base">
          <Icon icon={AlertCircle} className="h-4 w-4" aria-hidden="true" />
          Failed to load logs
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        <p className="text-sm text-muted-foreground">
          {error?.message || 'An unknown error occurred'}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="w-fit">
          <Icon icon={RefreshCw} className="h-4 w-4 mr-2" aria-hidden="true" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
});

LogViewerError.displayName = 'LogViewerError';
