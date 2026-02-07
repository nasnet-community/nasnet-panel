/**
 * TypeScript types for RecentLogs dashboard widget
 * Story NAS-5.6: Recent Logs with Filtering
 */

import type { LogEntry, LogTopic } from '@nasnet/core/types';

export interface UseLogStreamConfig {
  deviceId: string;
  topics: LogTopic[];
  maxEntries?: number;
}

export interface UseLogStreamReturn {
  logs: LogEntry[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  totalCount: number;
  hasMore: boolean;
}

export interface LogEntryItemProps {
  entry: LogEntry;
  isNew?: boolean;
  compact?: boolean;
}

export interface TopicFilterProps {
  selectedTopics: LogTopic[];
  onSelectionChange: (topics: LogTopic[]) => void;
}

export interface RecentLogsProps {
  deviceId: string;
  className?: string;
}

export interface RecentLogsSkeletonProps {
  className?: string;
}
