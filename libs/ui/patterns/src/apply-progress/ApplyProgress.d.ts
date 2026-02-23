/**
 * Apply Progress Component
 * Displays progress during change set application with resource-by-resource status
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */
import * as React from 'react';
import type { ChangeSet, ChangeSetItem } from '@nasnet/core/types';
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
export declare const ApplyProgress: React.MemoExoticComponent<React.ForwardRefExoticComponent<ApplyProgressProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=ApplyProgress.d.ts.map