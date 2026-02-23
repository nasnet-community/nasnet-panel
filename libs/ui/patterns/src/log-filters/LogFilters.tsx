/**
 * LogFilters Component
 * Multi-select filters for log topics and severities
 * Epic 0.8: System Logs - Stories 0.8.2 & 0.8.3
 */

import * as React from 'react';

import { X, Filter } from 'lucide-react';

import type { LogTopic, LogSeverity } from '@nasnet/core/types';
import { Button, cn } from '@nasnet/ui/primitives';

import { topicBadgeVariants } from '../log-entry';
import { SeverityBadge } from '../severity-badge';

const ALL_TOPICS: LogTopic[] = [
  'system',
  'firewall',
  'wireless',
  'dhcp',
  'dns',
  'ppp',
  'vpn',
  'interface',
  'route',
  'script',
  'critical',
  'info',
  'warning',
  'error',
];

const ALL_SEVERITIES: LogSeverity[] = [
  'debug',
  'info',
  'warning',
  'error',
  'critical',
];

export interface LogFiltersProps {
  /**
   * Currently selected topics
   */
  topics: LogTopic[];

  /**
   * Callback when topics change
   */
  onTopicsChange: (topics: LogTopic[]) => void;

  /**
   * Currently selected severities
   */
  severities: LogSeverity[];

  /**
   * Callback when severities change
   */
  onSeveritiesChange: (severities: LogSeverity[]) => void;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * Helper function to format topic labels
 */
function formatTopicLabel(topic: LogTopic): string {
  // Uppercase first letter
  return topic.charAt(0).toUpperCase() + topic.slice(1);
}

/**
 * LogFilters Component
 *
 * Provides multi-select filtering for log topics and severities with:
 * - Dropdown to select multiple topics
 * - Dropdown to select multiple severities
 * - Dismissible badges for selected items
 * - Clear all filters button
 * - Keyboard accessible
 * - AND logic between topics and severities
 *
 * @example
 * ```tsx
 * <LogFilters
 *   topics={['firewall', 'wireless']}
 *   onTopicsChange={(topics) => setTopics(topics)}
 *   severities={['error', 'critical']}
 *   onSeveritiesChange={(severities) => setSeverities(severities)}
 * />
 * ```
 */
function LogFiltersComponent({
  topics,
  onTopicsChange,
  severities,
  onSeveritiesChange,
  className,
}: LogFiltersProps) {
  const [isTopicOpen, setIsTopicOpen] = React.useState(false);
  const [isSeverityOpen, setIsSeverityOpen] = React.useState(false);
  const topicDropdownRef = React.useRef<HTMLDivElement>(null);
  const severityDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close topic dropdown when clicking outside
  React.useEffect(() => {
    if (!isTopicOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        topicDropdownRef.current &&
        !topicDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTopicOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTopicOpen]);

  // Close severity dropdown when clicking outside
  React.useEffect(() => {
    if (!isSeverityOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        severityDropdownRef.current &&
        !severityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSeverityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSeverityOpen]);

  // Toggle topic selection
  const toggleTopic = React.useCallback((topic: LogTopic) => {
    if (topics.includes(topic)) {
      onTopicsChange(topics.filter((t) => t !== topic));
    } else {
      onTopicsChange([...topics, topic]);
    }
  }, [topics, onTopicsChange]);

  // Toggle severity selection
  const toggleSeverity = React.useCallback((severity: LogSeverity) => {
    if (severities.includes(severity)) {
      onSeveritiesChange(severities.filter((s) => s !== severity));
    } else {
      onSeveritiesChange([...severities, severity]);
    }
  }, [severities, onSeveritiesChange]);

  // Remove specific topic
  const removeTopic = React.useCallback((topic: LogTopic) => {
    onTopicsChange(topics.filter((t) => t !== topic));
  }, [topics, onTopicsChange]);

  // Remove specific severity
  const removeSeverity = React.useCallback((severity: LogSeverity) => {
    onSeveritiesChange(severities.filter((s) => s !== severity));
  }, [severities, onSeveritiesChange]);

  // Clear all filters (both topics and severities)
  const clearAll = React.useCallback(() => {
    onTopicsChange([]);
    onSeveritiesChange([]);
  }, [onTopicsChange, onSeveritiesChange]);

  const hasFilters = topics.length > 0 || severities.length > 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Filter Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Topic Filter Dropdown */}
        <div className="relative" ref={topicDropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTopicOpen(!isTopicOpen)}
            className="gap-2 rounded-button"
          >
            <Filter className="h-4 w-4" />
            Filter by Topic
            {topics.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-500 px-2 py-0.5 text-xs text-slate-900 font-semibold">
                {topics.length}
              </span>
            )}
          </Button>

          {/* Topic Dropdown Menu */}
          {isTopicOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 min-w-[200px] rounded-card-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg animate-in fade-in-0 zoom-in-95">
              <div className="max-h-[300px] overflow-y-auto">
                {ALL_TOPICS.map((topic) => {
                  const isSelected = topics.includes(topic);
                  return (
                    <label
                      key={topic}
                      className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-button text-sm transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTopic(topic)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className={cn(topicBadgeVariants({ topic }), 'shrink-0 text-xs')}>
                        {formatTopicLabel(topic)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Severity Filter Dropdown */}
        <div className="relative" ref={severityDropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSeverityOpen(!isSeverityOpen)}
            className="gap-2 rounded-button"
          >
            <Filter className="h-4 w-4" />
            Filter by Severity
            {severities.length > 0 && (
              <span className="ml-1 rounded-full bg-primary-500 px-2 py-0.5 text-xs text-slate-900 font-semibold">
                {severities.length}
              </span>
            )}
          </Button>

          {/* Severity Dropdown Menu */}
          {isSeverityOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 min-w-[180px] rounded-card-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg animate-in fade-in-0 zoom-in-95">
              <div className="max-h-[250px] overflow-y-auto">
                {ALL_SEVERITIES.map((severity) => {
                  const isSelected = severities.includes(severity);
                  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
                  return (
                    <label
                      key={severity}
                      className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 rounded-button text-sm transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSeverity(severity)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                        aria-label={severityLabel}
                      />
                      <SeverityBadge severity={severity} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Clear All Button */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
            Clear filters
          </Button>
        )}
      </div>

      {/* Selected Filter Badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {/* Topic Badges */}
          {topics.map((topic) => (
            <button
              key={`topic-${topic}`}
              onClick={() => removeTopic(topic)}
              className={cn(
                topicBadgeVariants({ topic }),
                'group flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity'
              )}
              aria-label={`Remove ${topic} filter`}
            >
              <span>{formatTopicLabel(topic)}</span>
              <X className="h-3 w-3 opacity-70 group-hover:opacity-100" />
            </button>
          ))}

          {/* Severity Badges */}
          {severities.map((severity) => (
            <SeverityBadge
              key={`severity-${severity}`}
              severity={severity}
              onRemove={() => removeSeverity(severity)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const LogFilters = React.memo(LogFiltersComponent);
LogFilters.displayName = 'LogFilters';
