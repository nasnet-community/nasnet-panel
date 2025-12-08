/**
 * Log correlation and grouping hook
 * Epic 0.8: System Logs - Log Correlation/Grouping
 */

import * as React from 'react';
import type { LogEntry, LogTopic } from '@nasnet/core/types';

/**
 * A group of related log entries
 */
export interface LogGroup {
  id: string;
  startTime: Date;
  endTime: Date;
  entries: LogEntry[];
  primaryTopic: string;
  severityLevel: 'debug' | 'info' | 'warning' | 'error' | 'critical';
}

export interface UseLogCorrelationOptions {
  /**
   * Time window in milliseconds for grouping logs (default: 1000ms)
   */
  windowMs?: number;
  /**
   * Group by topic instead of time window
   */
  groupByTopic?: boolean;
  /**
   * Minimum entries to form a group
   */
  minGroupSize?: number;
}

export interface UseLogCorrelationReturn {
  /**
   * Grouped log entries
   */
  groups: LogGroup[];
  /**
   * Flat list of logs (ungrouped)
   */
  flatLogs: LogEntry[];
  /**
   * Whether grouping is enabled
   */
  isGrouped: boolean;
  /**
   * Toggle grouping on/off
   */
  toggleGrouping: () => void;
  /**
   * Set grouping mode
   */
  setGroupByTopic: (value: boolean) => void;
}

/**
 * Get the highest severity in a list of entries
 */
function getHighestSeverity(
  entries: LogEntry[]
): 'debug' | 'info' | 'warning' | 'error' | 'critical' {
  const severityOrder = ['debug', 'info', 'warning', 'error', 'critical'];
  let highest = 0;

  for (const entry of entries) {
    const index = severityOrder.indexOf(entry.severity);
    if (index > highest) {
      highest = index;
    }
  }

  return severityOrder[highest] as LogEntry['severity'];
}

/**
 * Get the most common topic in a list of entries
 */
function getPrimaryTopic(entries: LogEntry[]): LogTopic {
  const topicCounts = new Map<LogTopic, number>();

  for (const entry of entries) {
    const count = topicCounts.get(entry.topic) || 0;
    topicCounts.set(entry.topic, count + 1);
  }

  let maxCount = 0;
  let primaryTopic: LogTopic = entries[0]?.topic || 'system';

  for (const [topic, count] of topicCounts) {
    if (count > maxCount) {
      maxCount = count;
      primaryTopic = topic;
    }
  }

  return primaryTopic;
}

/**
 * Group logs by time window
 */
function groupByTimeWindow(
  logs: LogEntry[],
  windowMs: number,
  minGroupSize: number
): LogGroup[] {
  if (logs.length === 0) return [];

  // Sort by timestamp
  const sorted = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const groups: LogGroup[] = [];
  let currentGroup: LogEntry[] = [sorted[0]];
  let groupStartTime = new Date(sorted[0].timestamp).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const entryTime = new Date(sorted[i].timestamp).getTime();

    if (entryTime - groupStartTime <= windowMs) {
      currentGroup.push(sorted[i]);
    } else {
      // Finalize current group
      if (currentGroup.length >= minGroupSize) {
        groups.push({
          id: `group-${groupStartTime}`,
          startTime: new Date(groupStartTime),
          endTime: new Date(
            Math.max(...currentGroup.map((e) => new Date(e.timestamp).getTime()))
          ),
          entries: currentGroup,
          primaryTopic: getPrimaryTopic(currentGroup),
          severityLevel: getHighestSeverity(currentGroup),
        });
      } else {
        // Add as individual entries in their own groups
        for (const entry of currentGroup) {
          groups.push({
            id: `single-${entry.id}`,
            startTime: new Date(entry.timestamp),
            endTime: new Date(entry.timestamp),
            entries: [entry],
            primaryTopic: entry.topic,
            severityLevel: entry.severity,
          });
        }
      }

      // Start new group
      currentGroup = [sorted[i]];
      groupStartTime = entryTime;
    }
  }

  // Handle last group
  if (currentGroup.length >= minGroupSize) {
    groups.push({
      id: `group-${groupStartTime}`,
      startTime: new Date(groupStartTime),
      endTime: new Date(
        Math.max(...currentGroup.map((e) => new Date(e.timestamp).getTime()))
      ),
      entries: currentGroup,
      primaryTopic: getPrimaryTopic(currentGroup),
      severityLevel: getHighestSeverity(currentGroup),
    });
  } else {
    for (const entry of currentGroup) {
      groups.push({
        id: `single-${entry.id}`,
        startTime: new Date(entry.timestamp),
        endTime: new Date(entry.timestamp),
        entries: [entry],
        primaryTopic: entry.topic,
        severityLevel: entry.severity,
      });
    }
  }

  return groups;
}

/**
 * Group logs by topic
 */
function groupByTopicFn(logs: LogEntry[], minGroupSize: number): LogGroup[] {
  const topicMap = new Map<string, LogEntry[]>();

  for (const log of logs) {
    const existing = topicMap.get(log.topic) || [];
    existing.push(log);
    topicMap.set(log.topic, existing);
  }

  const groups: LogGroup[] = [];

  for (const [topic, entries] of topicMap) {
    // Sort entries by timestamp
    entries.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (entries.length >= minGroupSize) {
      groups.push({
        id: `topic-${topic}`,
        startTime: new Date(entries[0].timestamp),
        endTime: new Date(entries[entries.length - 1].timestamp),
        entries,
        primaryTopic: topic,
        severityLevel: getHighestSeverity(entries),
      });
    } else {
      for (const entry of entries) {
        groups.push({
          id: `single-${entry.id}`,
          startTime: new Date(entry.timestamp),
          endTime: new Date(entry.timestamp),
          entries: [entry],
          primaryTopic: entry.topic,
          severityLevel: entry.severity,
        });
      }
    }
  }

  // Sort groups by start time
  groups.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return groups;
}

/**
 * Hook for log correlation and grouping
 */
export function useLogCorrelation(
  logs: LogEntry[],
  options: UseLogCorrelationOptions = {}
): UseLogCorrelationReturn {
  const { windowMs = 1000, groupByTopic: initialGroupByTopic = false, minGroupSize = 2 } = options;

  const [isGrouped, setIsGrouped] = React.useState(true);
  const [groupByTopic, setGroupByTopic] = React.useState(initialGroupByTopic);

  const groups = React.useMemo(() => {
    if (!isGrouped) {
      // Return each log as its own group
      return logs.map((log) => ({
        id: `single-${log.id}`,
        startTime: new Date(log.timestamp),
        endTime: new Date(log.timestamp),
        entries: [log],
        primaryTopic: log.topic,
        severityLevel: log.severity,
      }));
    }

    if (groupByTopic) {
      return groupByTopicFn(logs, minGroupSize);
    }

    return groupByTimeWindow(logs, windowMs, minGroupSize);
  }, [logs, isGrouped, groupByTopic, windowMs, minGroupSize]);

  const toggleGrouping = React.useCallback(() => {
    setIsGrouped((prev) => !prev);
  }, []);

  return {
    groups,
    flatLogs: logs,
    isGrouped,
    toggleGrouping,
    setGroupByTopic,
  };
}


