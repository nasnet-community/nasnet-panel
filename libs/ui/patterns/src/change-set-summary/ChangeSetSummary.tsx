/**
 * Change Set Summary Component
 * Displays a summary of a change set with operation counts
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@nasnet/ui/primitives';
import type {
  ChangeSetSummary as ChangeSetSummaryData,
  ChangeSetStatus,
} from '@nasnet/core/types';
import {
  getChangeSetStatusDisplayInfo,
  isChangeSetProcessing,
} from '@nasnet/core/types';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

// =============================================================================
// Variants
// =============================================================================

const summaryVariants = cva(
  'rounded-lg border p-4 transition-all',
  {
    variants: {
      status: {
        DRAFT: 'border-border bg-card',
        VALIDATING: 'border-info/50 bg-info/5',
        READY: 'border-success/50 bg-success/5',
        APPLYING: 'border-warning/50 bg-warning/5',
        COMPLETED: 'border-success bg-success/10',
        FAILED: 'border-error bg-error/10',
        ROLLING_BACK: 'border-warning/50 bg-warning/5',
        ROLLED_BACK: 'border-muted bg-muted/50',
        PARTIAL_FAILURE: 'border-error bg-error/10',
        CANCELLED: 'border-muted bg-muted/50',
      },
      interactive: {
        true: 'cursor-pointer hover:shadow-md',
        false: '',
      },
    },
    defaultVariants: {
      status: 'DRAFT',
      interactive: false,
    },
  }
);

const operationBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      operation: {
        create: 'bg-success/10 text-success',
        update: 'bg-warning/10 text-warning',
        delete: 'bg-error/10 text-error',
      },
    },
  }
);

// =============================================================================
// Types
// =============================================================================

export interface ChangeSetSummaryProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof summaryVariants> {
  /** Change set summary data */
  summary: ChangeSetSummaryData;

  /** Whether the summary is clickable/interactive */
  interactive?: boolean;

  /** Optional click handler */
  onClick?: () => void;

  /** Show status badge */
  showStatus?: boolean;

  /** Show timestamp */
  showTimestamp?: boolean;

  /** Compact mode for list views */
  compact?: boolean;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Operation badge showing count of operations by type
 */
const OperationBadge = React.memo(function OperationBadge({
  operation,
  count,
  icon: Icon,
}: {
  operation: 'create' | 'update' | 'delete';
  count: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  if (count === 0) return null;

  return (
    <span className={operationBadgeVariants({ operation })}>
      <Icon className="h-3 w-3" />
      {count}
    </span>
  );
});

/**
 * Status badge for change set
 */
const StatusBadge = React.memo(function StatusBadge({
  status,
}: {
  status: ChangeSetStatus;
}) {
  const displayInfo = getChangeSetStatusDisplayInfo(status);
  const isProcessing = isChangeSetProcessing(status);

  const colorClasses: Record<string, string> = {
    gray: 'bg-muted text-muted-foreground',
    blue: 'bg-info/10 text-info',
    green: 'bg-success/10 text-success',
    amber: 'bg-warning/10 text-warning',
    red: 'bg-error/10 text-error',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colorClasses[displayInfo.color] || colorClasses.gray
      )}
    >
      {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
      {displayInfo.label}
    </span>
  );
});

/**
 * Change Set Summary Component
 *
 * @example
 * ```tsx
 * <ChangeSetSummary
 *   summary={changeSetSummary}
 *   interactive
 *   onClick={() => openChangeSet(id)}
 * />
 * ```
 */
const ChangeSetSummaryBase = React.forwardRef<
  HTMLDivElement,
  ChangeSetSummaryProps
>(
  (
    {
      className,
      summary,
      interactive = false,
      onClick,
      showStatus = true,
      showTimestamp = true,
      compact = false,
      ...props
    },
    ref
  ) => {
    const { id, name, status, operationCounts, totalItems, createdAt, hasErrors, hasWarnings } =
      summary;

    const handleClick = React.useCallback(() => {
      if (interactive && onClick) {
        onClick();
      }
    }, [interactive, onClick]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (interactive && onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      },
      [interactive, onClick]
    );

    // Format timestamp
    const formattedDate = React.useMemo(() => {
      const date = new Date(createdAt);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }, [createdAt]);

    return (
      <div
        ref={ref}
        className={cn(
          summaryVariants({ status, interactive }),
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={
          interactive ? `View change set: ${name}` : undefined
        }
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{name}</h4>
            {showTimestamp && !compact && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Created {formattedDate}
              </p>
            )}
          </div>
          {showStatus && <StatusBadge status={status} />}
        </div>

        {/* Operation counts */}
        <div className="flex items-center gap-2 mt-3">
          <OperationBadge
            operation="create"
            count={operationCounts.create}
            icon={Plus}
          />
          <OperationBadge
            operation="update"
            count={operationCounts.update}
            icon={Pencil}
          />
          <OperationBadge
            operation="delete"
            count={operationCounts.delete}
            icon={Trash2}
          />
          <span className="text-xs text-muted-foreground ml-auto">
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Warnings/Errors indicator */}
        {(hasErrors || hasWarnings) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {hasErrors && (
              <span className="text-error">Has validation errors</span>
            )}
            {hasWarnings && !hasErrors && (
              <span className="text-warning">Has warnings</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

ChangeSetSummaryBase.displayName = 'ChangeSetSummary';

export const ChangeSetSummary = React.memo(ChangeSetSummaryBase);

export { summaryVariants, operationBadgeVariants };
