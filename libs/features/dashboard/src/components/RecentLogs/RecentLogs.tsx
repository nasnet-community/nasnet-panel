/**
 * RecentLogs component - Dashboard widget for recent system logs
 * Displays 10 most recent logs with topic filtering and real-time updates
 * Story NAS-5.6: Recent Logs with Filtering
 */

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

import { LogEntryItem } from './LogEntryItem';
import { RecentLogsSkeleton } from './RecentLogsSkeleton';
import { TopicFilter } from './TopicFilter';
import { useLogStream } from './useLogStream';
import { useLogFilterPreferencesStore } from '../../stores/log-filter-preferences.store';

import type { RecentLogsProps } from './types';

/**
 * Recent logs dashboard widget
 * Shows 10 most recent logs with filtering and real-time updates
 *
 * @param deviceId - Router device ID or IP address
 * @param className - Optional CSS classes
 */
export function RecentLogs({ deviceId, className }: RecentLogsProps) {
  const platform = usePlatform();
  const { selectedTopics, setSelectedTopics } = useLogFilterPreferencesStore();

  const { logs, loading, error, refetch } = useLogStream({
    deviceId,
    topics: selectedTopics,
    maxEntries: 10,
  });

  // Build search params for View All link (TanStack Router uses search object)
  const viewAllSearch =
    selectedTopics.length > 0 ? { topics: selectedTopics.join(',') } : undefined;

  if (loading) {
    return <RecentLogsSkeleton className={className} />;
  }

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
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Recent Logs</CardTitle>
        <div className="flex items-center gap-2">
          <TopicFilter
            selectedTopics={selectedTopics}
            onSelectionChange={setSelectedTopics}
          />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="min-h-[44px]"
          >
            <Link to="/logs" search={viewAllSearch}>
              View All
              <ExternalLink className="ml-1 h-3 w-3" />
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
                  onClick={() => setSelectedTopics([])}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            logs.map((log, index) => (
              <LogEntryItem
                key={log.id}
                entry={log}
                isNew={index === 0}
                compact={platform === 'mobile'}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
