/**
 * ConflictList Component
 *
 * Displays a list of cross-resource validation conflicts
 * with filtering and summary.
 *
 * @module @nasnet/ui/patterns/cross-resource-validation
 */

import * as React from 'react';

import { AlertCircle, AlertTriangle, Info, CheckCircle2, Filter } from 'lucide-react';

import { Button, cn, Badge } from '@nasnet/ui/primitives';

import { ConflictCard } from './ConflictCard';
import type { ResourceConflict, ConflictSeverity } from './types';

export interface ConflictListProps {
  /** List of conflicts to display */
  conflicts: ResourceConflict[];
  /** Callback when a resolution is selected */
  onSelectResolution?: (conflictId: string, resolutionId: string) => void;
  /** Filter by severity (show only these severities) */
  severityFilter?: ConflictSeverity[];
  /** Title for the list */
  title?: string;
  /** Whether to show the summary header */
  showSummary?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a list of cross-resource conflicts with summary and filtering.
 *
 * @example
 * ```tsx
 * <ConflictList
 *   conflicts={validationConflicts}
 *   onSelectResolution={handleResolve}
 *   showSummary
 * />
 * ```
 */
export function ConflictList({
  conflicts,
  onSelectResolution,
  severityFilter,
  title = 'Cross-Resource Conflicts',
  showSummary = true,
  emptyMessage = 'No conflicts detected',
  className,
}: ConflictListProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [activeSeverityFilter, setActiveSeverityFilter] = React.useState<
    ConflictSeverity | 'all'
  >('all');

  // Filter conflicts by severity
  const filteredConflicts = React.useMemo(() => {
    let result = conflicts;

    // Apply prop-based filter
    if (severityFilter && severityFilter.length > 0) {
      result = result.filter((c) => severityFilter.includes(c.severity));
    }

    // Apply UI filter
    if (activeSeverityFilter !== 'all') {
      result = result.filter((c) => c.severity === activeSeverityFilter);
    }

    return result;
  }, [conflicts, severityFilter, activeSeverityFilter]);

  // Count by severity
  const counts = React.useMemo(() => {
    return conflicts.reduce(
      (acc, c) => {
        acc[c.severity]++;
        acc.total++;
        return acc;
      },
      { error: 0, warning: 0, info: 0, total: 0 }
    );
  }, [conflicts]);

  // Toggle expand/collapse for a card
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand all / Collapse all
  const expandAll = () => {
    setExpandedIds(new Set(filteredConflicts.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  if (conflicts.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center',
          className
        )}
        role="status"
        aria-label="No conflicts"
      >
        <CheckCircle2 className="h-12 w-12 text-success mb-4" aria-hidden="true" />
        <p className="text-lg font-medium text-foreground">All Clear</p>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {showSummary && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <div
              className="flex items-center gap-3 mt-1"
              role="status"
              aria-label="Conflict summary"
            >
              {counts.error > 0 && (
                <span className="flex items-center gap-1 text-sm text-error">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {counts.error} {counts.error === 1 ? 'error' : 'errors'}
                </span>
              )}
              {counts.warning > 0 && (
                <span className="flex items-center gap-1 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  {counts.warning} {counts.warning === 1 ? 'warning' : 'warnings'}
                </span>
              )}
              {counts.info > 0 && (
                <span className="flex items-center gap-1 text-sm text-info">
                  <Info className="h-4 w-4" aria-hidden="true" />
                  {counts.info} info
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Severity filter */}
            <div className="flex items-center gap-1" role="group" aria-label="Filter by severity">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Button
                variant={activeSeverityFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSeverityFilter('all')}
              >
                All ({counts.total})
              </Button>
              {counts.error > 0 && (
                <Button
                  variant={activeSeverityFilter === 'error' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSeverityFilter('error')}
                >
                  Errors
                </Button>
              )}
              {counts.warning > 0 && (
                <Button
                  variant={activeSeverityFilter === 'warning' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveSeverityFilter('warning')}
                >
                  Warnings
                </Button>
              )}
            </div>

            {/* Expand/Collapse all */}
            <div className="border-l pl-2 ml-2">
              <Button variant="ghost" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="ghost" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict cards */}
      <div className="space-y-3" role="list" aria-label="Conflicts">
        {filteredConflicts.map((conflict) => (
          <ConflictCard
            key={conflict.id}
            conflict={conflict}
            isExpanded={expandedIds.has(conflict.id)}
            onToggle={() => toggleExpand(conflict.id)}
            onSelectResolution={onSelectResolution}
          />
        ))}
      </div>

      {/* Filtered empty state */}
      {filteredConflicts.length === 0 && conflicts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No conflicts match the current filter</p>
          <Button
            variant="link"
            onClick={() => setActiveSeverityFilter('all')}
            className="mt-2"
          >
            Show all conflicts
          </Button>
        </div>
      )}
    </div>
  );
}

ConflictList.displayName = 'ConflictList';
