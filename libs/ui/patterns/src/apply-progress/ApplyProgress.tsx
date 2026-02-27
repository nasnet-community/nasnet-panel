/**
 * Apply Progress Component
 * Displays progress during change set application with resource-by-resource status
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import * as React from 'react';

import { Clock, Loader2, CheckCircle, XCircle, RotateCcw, AlertTriangle, X } from 'lucide-react';
import type {
  ChangeSet,
  ChangeSetItem,
  ChangeSetStatus,
  ChangeSetItemStatus,
} from '@nasnet/core/types';
import { getChangeSetStatusDisplayInfo, isChangeSetProcessing } from '@nasnet/core/types';
import { cn, Progress, Button, Icon } from '@nasnet/ui/primitives';

// =============================================================================
// Types
// =============================================================================

export interface ApplyProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Change set being applied */
  changeSet: ChangeSet;

  /** Current applying item (if any) */
  currentItem?: ChangeSetItem | null;

  /** Number of items applied */
  appliedCount: number;

  /** Estimated time remaining in milliseconds */
  estimatedRemainingMs?: number | null;

  /** Callback to cancel the operation */
  onCancel?: () => void;

  /** Callback to retry after failure */
  onRetry?: () => void;

  /** Callback to force rollback */
  onForceRollback?: () => void;

  /** Show individual item status */
  showItemStatus?: boolean;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Status icon for items
 */
const ItemStatusIcon = React.memo(function ItemStatusIcon({
  status,
  className,
}: {
  status: ChangeSetItemStatus;
  className?: string;
}) {
  switch (status) {
    case 'PENDING':
      return (
        <Icon
          icon={Clock}
          className={cn('text-muted-foreground', className)}
        />
      );
    case 'APPLYING':
      return (
        <Icon
          icon={Loader2}
          className={cn('text-warning animate-spin', className)}
        />
      );
    case 'APPLIED':
      return (
        <Icon
          icon={CheckCircle}
          className={cn('text-success', className)}
        />
      );
    case 'FAILED':
      return (
        <Icon
          icon={XCircle}
          className={cn('text-error', className)}
        />
      );
    case 'ROLLED_BACK':
      return (
        <Icon
          icon={RotateCcw}
          className={cn('text-muted-foreground', className)}
        />
      );
    case 'ROLLBACK_FAILED':
      return (
        <Icon
          icon={AlertTriangle}
          className={cn('text-error', className)}
        />
      );
    case 'SKIPPED':
      return (
        <Icon
          icon={Clock}
          className={cn('text-muted-foreground opacity-50', className)}
        />
      );
    default:
      return (
        <Icon
          icon={Clock}
          className={cn('text-muted-foreground', className)}
        />
      );
  }
});

ItemStatusIcon.displayName = 'ItemStatusIcon';

/**
 * Format time remaining
 */
function formatTimeRemaining(ms: number): string {
  if (ms < 1000) return 'Less than a second';
  if (ms < 60000) return `${Math.ceil(ms / 1000)} seconds`;
  if (ms < 3600000) return `${Math.ceil(ms / 60000)} minutes`;
  return `${Math.ceil(ms / 3600000)} hours`;
}

/**
 * Apply Progress Component
 *
 * Features:
 * - Progress bar with percentage
 * - Current item indicator
 * - Item-by-item status list
 * - ETA display
 * - Cancel/Retry actions
 * - Accessible live regions for screen readers
 *
 * @example
 * ```tsx
 * <ApplyProgress
 *   changeSet={changeSet}
 *   currentItem={currentItem}
 *   appliedCount={5}
 *   estimatedRemainingMs={30000}
 *   onCancel={() => send({ type: 'CANCEL' })}
 * />
 * ```
 */
const ApplyProgressBase = React.forwardRef<HTMLDivElement, ApplyProgressProps>(
  (
    {
      className,
      changeSet,
      currentItem,
      appliedCount,
      estimatedRemainingMs,
      onCancel,
      onRetry,
      onForceRollback,
      showItemStatus = true,
      ...props
    },
    ref
  ) => {
    const { status, items, error } = changeSet;
    const totalCount = items.length;
    const progressPercent = totalCount > 0 ? (appliedCount / totalCount) * 100 : 0;
    const displayInfo = getChangeSetStatusDisplayInfo(status);
    const isProcessing = isChangeSetProcessing(status);

    // Focus management refs
    const successRef = React.useRef<HTMLDivElement>(null);
    const errorRef = React.useRef<HTMLDivElement>(null);

    // Focus management on status change
    React.useEffect(() => {
      if (status === 'COMPLETED') {
        successRef.current?.focus();
      } else if (status === 'FAILED' || status === 'PARTIAL_FAILURE') {
        errorRef.current?.focus();
      }
    }, [status]);

    return (
      <div
        ref={ref}
        className={cn('bg-card rounded-lg border p-6', className)}
        {...props}
      >
        {/* Screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {currentItem && isProcessing && (
            <>
              Applying change {appliedCount + 1} of {totalCount}: {currentItem.name}
            </>
          )}
          {status === 'COMPLETED' && <>All {totalCount} changes applied successfully</>}
          {status === 'ROLLING_BACK' && <>Rolling back {appliedCount} applied changes</>}
        </div>

        {/* Error announcement */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="sr-only"
          >
            Error: {error.message}.{' '}
            {error.requiresManualIntervention && 'Manual intervention required.'}
          </div>
        )}

        {/* Header with status */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isProcessing && (
              <Icon
                icon={Loader2}
                className="text-primary h-5 w-5 animate-spin"
                role="status"
                aria-label="Applying changes"
              />
            )}
            {status === 'COMPLETED' && (
              <Icon
                icon={CheckCircle}
                className="text-success h-5 w-5"
              />
            )}
            {(status === 'FAILED' || status === 'PARTIAL_FAILURE') && (
              <Icon
                icon={XCircle}
                className="text-error h-5 w-5"
              />
            )}
            {status === 'ROLLED_BACK' && (
              <Icon
                icon={RotateCcw}
                className="text-muted-foreground h-5 w-5"
              />
            )}
            <h3 className="text-foreground font-semibold">{displayInfo.label}</h3>
          </div>
          <span className="text-muted-foreground text-sm">
            {appliedCount} / {totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <Progress
            value={progressPercent}
            className="h-2"
            aria-label={`Applying changes: ${Math.round(progressPercent)}% complete`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPercent)}
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-xs">
            <span>{Math.round(progressPercent)}% complete</span>
            {estimatedRemainingMs != null && isProcessing && (
              <span>ETA: {formatTimeRemaining(estimatedRemainingMs)}</span>
            )}
          </div>
        </div>

        {/* Current item */}
        {currentItem && isProcessing && (
          <div className="bg-muted/50 mb-4 rounded p-3">
            <div className="flex items-center gap-2">
              <Icon
                icon={Loader2}
                className="text-warning h-4 w-4 animate-spin"
              />
              <span className="text-sm font-medium">{currentItem.name}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{currentItem.resourceType}</p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            ref={errorRef}
            tabIndex={-1}
            className="bg-error/10 border-error/20 mb-4 rounded border p-3"
          >
            <div className="flex items-start gap-2">
              <Icon
                icon={XCircle}
                className="text-error mt-0.5 h-5 w-5 flex-shrink-0"
              />
              <div>
                <p className="text-error text-sm font-medium">{error.message}</p>
                {error.requiresManualIntervention && (
                  <p className="text-error/80 mt-1 text-xs">
                    Manual intervention required. Some changes could not be rolled back.
                  </p>
                )}
                {error.partiallyAppliedItemIds.length > 0 && !error.requiresManualIntervention && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {error.partiallyAppliedItemIds.length} items were applied before failure.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {status === 'COMPLETED' && (
          <div
            ref={successRef}
            tabIndex={-1}
            className="bg-success/10 border-success/20 mb-4 rounded border p-3"
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={CheckCircle}
                className="text-success h-5 w-5"
              />
              <p className="text-success text-sm font-medium">
                All {totalCount} changes applied successfully
              </p>
            </div>
          </div>
        )}

        {/* Rolled back message */}
        {status === 'ROLLED_BACK' && (
          <div className="bg-muted mb-4 rounded border p-3">
            <div className="flex items-center gap-2">
              <Icon
                icon={RotateCcw}
                className="text-muted-foreground h-5 w-5"
              />
              <p className="text-muted-foreground text-sm font-medium">
                All applied changes have been rolled back
              </p>
            </div>
          </div>
        )}

        {/* Item status list */}
        {showItemStatus && items.length > 0 && (
          <div className="mt-4">
            <h4 className="text-muted-foreground mb-2 text-xs font-medium">Items</h4>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {[...items]
                .sort((a: ChangeSetItem, b: ChangeSetItem) => a.applyOrder - b.applyOrder)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <ItemStatusIcon
                      status={item.status}
                      className="h-4 w-4 flex-shrink-0"
                    />
                    <span
                      className={cn(
                        'truncate',
                        item.status === 'APPLIED' && 'text-success',
                        item.status === 'FAILED' && 'text-error',
                        item.status === 'SKIPPED' && 'text-muted-foreground opacity-50'
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          {/* Cancel button during processing */}
          {isProcessing && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              aria-label="Cancel applying changes"
            >
              <Icon
                icon={X}
                className="mr-1 h-4 w-4"
              />
              Cancel
            </Button>
          )}

          {/* Retry button after failure */}
          {status === 'FAILED' && onRetry && (
            <Button
              variant="default"
              size="sm"
              onClick={onRetry}
              aria-label="Retry applying changes"
            >
              <Icon
                icon={RotateCcw}
                className="mr-1 h-4 w-4"
              />
              Retry
            </Button>
          )}

          {/* Force rollback button */}
          {status === 'FAILED' && onForceRollback && (
            <Button
              variant="outline"
              size="sm"
              onClick={onForceRollback}
              aria-label="Force rollback of all changes"
            >
              <Icon
                icon={RotateCcw}
                className="mr-1 h-4 w-4"
              />
              Force Rollback
            </Button>
          )}
        </div>
      </div>
    );
  }
);

ApplyProgressBase.displayName = 'ApplyProgress';

export const ApplyProgress = React.memo(ApplyProgressBase);
