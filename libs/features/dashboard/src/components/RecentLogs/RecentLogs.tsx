/**
 * RecentLogs component - Dashboard widget for recent system logs
 * Displays 10 most recent logs with topic filtering and real-time updates
 * Story NAS-5.6: Recent Logs with Filtering
 *
 * @component
 * @see https://docs.nasnet.io/design/ux-design/6-component-library#recent-logs
 *
 * @example
 * <RecentLogs deviceId="router1" />
 *
 * @example
 * <RecentLogs deviceId="router1" className="col-span-2" />
 */

import React, { useCallback, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { ExternalLink } from 'lucide-react';

import { usePlatform } from '@nasnet/ui/layouts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  cn,
} from '@nasnet/ui/primitives';

import type { LogTopic } from '@nasnet/core/types';
import { LogEntryItem } from './LogEntryItem';
import { RecentLogsSkeleton } from './RecentLogsSkeleton';
import { TopicFilter } from './TopicFilter';
import { useLogStream } from './useLogStream';
import { useLogFilterPreferencesStore } from '../../stores/log-filter-preferences.store';

import type { RecentLogsProps } from './types';

/**
 * Recent logs dashboard widget component
 * Shows 10 most recent system logs with filtering and real-time updates via subscriptions
 *
 * @component
 * @param {RecentLogsProps} props - Component props
 * @param {string} props.deviceId - Router device ID or IP address
 * @param {string} [props.className] - Optional CSS classes for styling
 *
 * @returns {React.ReactElement} Rendered component
 *
 * Features:
 * - Real-time log streaming via GraphQL subscriptions
 * - Topic-based filtering with persistent preferences
 * - Loading skeleton, error state, and empty state handling
 * - Link to full logs view with filter preservation
 * - Platform-aware sizing (mobile: 280px, desktop: 320px max height)
 * - WCAG AAA compliant with proper ARIA live region
 *
 * @see useLogStream - Custom hook for log fetching
 * @see useLogFilterPreferencesStore - Zustand store for filter preferences
 */
function RecentLogsComponent({ deviceId, className }: RecentLogsProps) {
  const platform = usePlatform();
  const { selectedTopics, setSelectedTopics } = useLogFilterPreferencesStore();

  const { logs, loading, error, refetch } = useLogStream({
    deviceId,
    topics: selectedTopics,
    maxEntries: 10,
  });

  /**
   * Memoized search params for View All link
   * TanStack Router uses search object instead of query string
   */
  const viewAllSearch = useMemo(
    () =>
      selectedTopics.length > 0
        ? { topics: selectedTopics.join(',') }
        : undefined,
    [selectedTopics]
  );

  /**
   * Memoized callback to clear all filters
   */
  const handleClearFilters = useCallback(() => {
    setSelectedTopics([]);
  }, [setSelectedTopics]);

  /**
   * Memoized callback to update topic selection
   */
  const handleTopicChange = useCallback(
    (newTopics: LogTopic[]) => {
      setSelectedTopics(newTopics);
    },
    [setSelectedTopics]
  );

  /**
   * Memoized callback for retry action on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Memoized log items to prevent unnecessary re-renders
   */
  const renderedLogs = useMemo(
    () =>
      logs.map((log, index) => (
        <LogEntryItem
          key={log.id}
          entry={log}
          isNew={index === 0}
          compact={platform === 'mobile'}
        />
      )),
    [logs, platform]
  );

  /**
   * Render loading state
   */
  if (loading) {
    return <RecentLogsSkeleton className={className} />;
  }

  /**
   * Render error state with retry action
   */
  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-error">Failed to load logs</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              aria-label="Retry loading recent logs"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render main content with logs or empty state
   */
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent Logs</CardTitle>
        <div className="flex items-center gap-2">
          <TopicFilter
            selectedTopics={selectedTopics}
            onSelectionChange={handleTopicChange}
          />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="min-h-[44px]"
            aria-label="View all system logs"
          >
            <Link
              to={'/logs' as string}
              search={viewAllSearch as Record<string, string>}
            >
              View All
              <ExternalLink className="ml-1 h-3 w-3" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          role="log"
          aria-label="Recent system logs"
          aria-live="polite"
          aria-atomic="false"
          className={cn(
            'space-y-1 overflow-hidden',
            platform === 'mobile' ? 'max-h-[280px]' : 'max-h-[320px]'
          )}
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No logs found for selected topics
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try selecting different topics or check router connection
              </p>
              {selectedTopics.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={handleClearFilters}
                  aria-label="Clear all log topic filters"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            renderedLogs
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * RecentLogs export with React.memo for performance optimization
 * Prevents unnecessary re-renders when parent component updates
 */
export const RecentLogs = React.memo(RecentLogsComponent);
RecentLogs.displayName = 'RecentLogs';
