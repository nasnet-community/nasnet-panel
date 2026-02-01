/**
 * Change Set Item Card Component
 * Displays an individual item in a change set with expand/collapse
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, Button } from '@nasnet/ui/primitives';
import type {
  ChangeSetItem,
  ChangeOperation,
  ChangeSetItemStatus,
} from '@nasnet/core/types';
import {
  getOperationColor,
  getOperationLabel,
} from '@nasnet/core/types';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeftRight,
  AlertTriangle,
} from 'lucide-react';

// =============================================================================
// Variants
// =============================================================================

const cardVariants = cva(
  'rounded-lg border transition-all',
  {
    variants: {
      status: {
        PENDING: 'border-border bg-card',
        APPLYING: 'border-warning bg-warning/5',
        APPLIED: 'border-success bg-success/5',
        FAILED: 'border-error bg-error/5',
        ROLLED_BACK: 'border-muted bg-muted/50',
        ROLLBACK_FAILED: 'border-error bg-error/10',
        SKIPPED: 'border-muted bg-muted/30',
      },
    },
    defaultVariants: {
      status: 'PENDING',
    },
  }
);

const operationIndicatorVariants = cva(
  'flex items-center justify-center w-8 h-8 rounded-full',
  {
    variants: {
      operation: {
        CREATE: 'bg-success/10 text-success',
        UPDATE: 'bg-warning/10 text-warning',
        DELETE: 'bg-error/10 text-error',
      },
    },
  }
);

// =============================================================================
// Types
// =============================================================================

export interface ChangeSetItemCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>,
    VariantProps<typeof cardVariants> {
  /** Change set item data */
  item: ChangeSetItem;

  /** Whether the card is expanded */
  expanded?: boolean;

  /** Callback when expand/collapse is toggled */
  onToggleExpand?: () => void;

  /** Callback when remove is clicked */
  onRemove?: () => void;

  /** Whether the item can be removed */
  removable?: boolean;

  /** Show dependency information */
  showDependencies?: boolean;

  /** Dependency names for display */
  dependencyNames?: Record<string, string>;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Operation icon based on operation type
 */
const OperationIcon = React.memo(function OperationIcon({
  operation,
  className,
}: {
  operation: ChangeOperation;
  className?: string;
}) {
  const icons: Record<ChangeOperation, React.ComponentType<{ className?: string }>> = {
    CREATE: Plus,
    UPDATE: Pencil,
    DELETE: Trash2,
  };

  const Icon = icons[operation] || Pencil;
  return <Icon className={className} />;
});

/**
 * Status icon based on item status
 */
const StatusIcon = React.memo(function StatusIcon({
  status,
  className,
}: {
  status: ChangeSetItemStatus;
  className?: string;
}) {
  switch (status) {
    case 'PENDING':
      return <Clock className={cn('text-muted-foreground', className)} />;
    case 'APPLYING':
      return <Loader2 className={cn('text-warning animate-spin', className)} />;
    case 'APPLIED':
      return <CheckCircle className={cn('text-success', className)} />;
    case 'FAILED':
      return <XCircle className={cn('text-error', className)} />;
    case 'ROLLED_BACK':
      return <ArrowLeftRight className={cn('text-muted-foreground', className)} />;
    case 'ROLLBACK_FAILED':
      return <AlertTriangle className={cn('text-error', className)} />;
    case 'SKIPPED':
      return <Clock className={cn('text-muted-foreground opacity-50', className)} />;
    default:
      return null;
  }
});

/**
 * Status label
 */
function getStatusLabel(status: ChangeSetItemStatus): string {
  const labels: Record<ChangeSetItemStatus, string> = {
    PENDING: 'Pending',
    APPLYING: 'Applying...',
    APPLIED: 'Applied',
    FAILED: 'Failed',
    ROLLED_BACK: 'Rolled Back',
    ROLLBACK_FAILED: 'Rollback Failed',
    SKIPPED: 'Skipped',
  };
  return labels[status] || status;
}

/**
 * Change Set Item Card Component
 *
 * @example
 * ```tsx
 * <ChangeSetItemCard
 *   item={changeSetItem}
 *   expanded={isExpanded}
 *   onToggleExpand={() => setIsExpanded(!isExpanded)}
 *   onRemove={() => removeItem(item.id)}
 *   removable
 * />
 * ```
 */
const ChangeSetItemCardBase = React.forwardRef<
  HTMLDivElement,
  ChangeSetItemCardProps
>(
  (
    {
      className,
      item,
      expanded = false,
      onToggleExpand,
      onRemove,
      removable = false,
      showDependencies = true,
      dependencyNames = {},
      ...props
    },
    ref
  ) => {
    const {
      id,
      name,
      description,
      operation,
      resourceType,
      status,
      dependencies,
      error,
      configuration,
      previousState,
    } = item;

    const canRemove = removable && status === 'PENDING';

    return (
      <div
        ref={ref}
        className={cn(cardVariants({ status }), className)}
        {...props}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            {/* Operation indicator */}
            <div className={operationIndicatorVariants({ operation })}>
              <OperationIcon operation={operation} className="h-4 w-4" />
            </div>

            {/* Name and type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground truncate">{name}</h4>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {getOperationLabel(operation)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {resourceType}
              </p>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <StatusIcon status={status} className="h-4 w-4" />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {getStatusLabel(status)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {canRemove && onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  aria-label={`Remove ${name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {onToggleExpand && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleExpand}
                  aria-expanded={expanded}
                  aria-label={expanded ? 'Collapse details' : 'Expand details'}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-2 p-2 rounded bg-error/10 text-error text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-border px-4 py-3 space-y-3">
            {/* Description */}
            {description && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1">
                  Description
                </h5>
                <p className="text-sm text-foreground">{description}</p>
              </div>
            )}

            {/* Dependencies */}
            {showDependencies && dependencies.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1">
                  Depends On
                </h5>
                <div className="flex flex-wrap gap-1">
                  {dependencies.map((depId) => (
                    <span
                      key={depId}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {dependencyNames[depId] || depId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration preview */}
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-1">
                Configuration
              </h5>
              <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-40">
                {JSON.stringify(configuration, null, 2)}
              </pre>
            </div>

            {/* Previous state for updates */}
            {previousState && operation === 'UPDATE' && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1">
                  Previous State
                </h5>
                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-40">
                  {JSON.stringify(previousState, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ChangeSetItemCardBase.displayName = 'ChangeSetItemCard';

export const ChangeSetItemCard = React.memo(ChangeSetItemCardBase);

export { cardVariants, operationIndicatorVariants };
