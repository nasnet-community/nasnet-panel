/**
 * Log Group Component
 * Displays a collapsible group of related log entries
 * Epic 0.8: System Logs - Log Correlation/Grouping
 */

import * as React from 'react';

import { ChevronDown, ChevronRight, Layers } from 'lucide-react';

import type { LogEntry } from '@nasnet/core/types';
import { formatTimestamp } from '@nasnet/core/utils';
import { cn, Button } from '@nasnet/ui/primitives';

import { LogEntry as LogEntryComponent } from '../log-entry';
import { SeverityBadge } from '../severity-badge';

export interface LogGroupData {
  id: string;
  startTime: Date;
  endTime: Date;
  entries: LogEntry[];
  primaryTopic: string;
  severityLevel: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}

export interface LogGroupProps {
  /**
   * The group data
   */
  group: LogGroupData;
  /**
   * Search term for highlighting
   */
  searchTerm?: string;
  /**
   * Click handler for individual entries
   */
  onEntryClick?: (entry: LogEntry) => void;
  /**
   * Whether an entry is bookmarked
   */
  isBookmarked?: (entryId: string) => boolean;
  /**
   * Toggle bookmark handler
   */
  onToggleBookmark?: (entry: LogEntry) => void;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * LogGroup Component
 */
function LogGroupComponent({
  group,
  searchTerm,
  onEntryClick,
  isBookmarked,
  onToggleBookmark,
  className,
}: LogGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isSingleEntry = group.entries.length === 1;

  const handleExpand = React.useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleEntryClick = React.useCallback(
    (entry: LogEntry) => {
      onEntryClick?.(entry);
    },
    [onEntryClick]
  );

  // Single entry - render directly
  if (isSingleEntry) {
    return (
      <LogEntryComponent
        entry={group.entries[0]}
        className={className}
      />
    );
  }

  return (
    <div className={cn('rounded-card-sm overflow-hidden border', className)}>
      {/* Group header */}
      <button
        onClick={handleExpand}
        className={cn(
          'flex w-full items-center gap-3 p-3 text-left',
          'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800',
          'transition-colors'
        )}
        aria-expanded={isExpanded}
      >
        {/* Expand icon */}
        {isExpanded ?
          <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
        : <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />}

        {/* Group icon */}
        <Layers className="text-muted-foreground h-4 w-4 shrink-0" />

        {/* Time range */}
        <span className="text-muted-foreground shrink-0 font-mono text-xs">
          {formatTimestamp(group.startTime)}
          {group.startTime.getTime() !== group.endTime.getTime() && (
            <> - {formatTimestamp(group.endTime)}</>
          )}
        </span>

        {/* Severity badge */}
        <SeverityBadge severity={group.severityLevel} />

        {/* Topic */}
        <span className="text-muted-foreground text-sm capitalize">{group.primaryTopic}</span>

        {/* Entry count */}
        <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium dark:bg-slate-700">
          {group.entries.length} entries
        </span>
      </button>

      {/* Expanded entries */}
      {isExpanded && (
        <div className="divide-border divide-y">
          {group.entries.map((entry) => (
            <LogEntryComponent
              key={entry.id}
              entry={entry}
              onClick={() => handleEntryClick(entry)}
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const LogGroup = React.memo(LogGroupComponent);
LogGroup.displayName = 'LogGroup';

/**
 * Props for LogGroupList
 */
export interface LogGroupListProps {
  /**
   * Groups to display
   */
  groups: LogGroupData[];
  /**
   * Search term for highlighting
   */
  searchTerm?: string;
  /**
   * Entry click handler
   */
  onEntryClick?: (entry: LogEntry) => void;
  /**
   * Check if entry is bookmarked
   */
  isBookmarked?: (entryId: string) => boolean;
  /**
   * Toggle bookmark
   */
  onToggleBookmark?: (entry: LogEntry) => void;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * LogGroupList Component
 * Renders a list of log groups
 */
function LogGroupListComponent({
  groups,
  searchTerm,
  onEntryClick,
  isBookmarked,
  onToggleBookmark,
  className,
}: LogGroupListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {groups.map((group) => (
        <LogGroup
          key={group.id}
          group={group}
          searchTerm={searchTerm}
          onEntryClick={onEntryClick}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  );
}

export const LogGroupList = React.memo(LogGroupListComponent);
LogGroupList.displayName = 'LogGroupList';
