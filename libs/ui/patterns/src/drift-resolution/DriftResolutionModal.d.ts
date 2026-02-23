import * as React from 'react';
import type { DriftResult, DriftResolutionRequest } from '@nasnet/state/stores';
/**
 * Drift Resolution Modal Component
 *
 * Modal dialog for resolving configuration drift with three actions:
 * 1. Re-apply: Overwrite router state with desired configuration
 * 2. Accept: Update configuration to match router's actual state
 * 3. View diff: Detailed side-by-side comparison before deciding
 *
 * Includes confirmation dialogs for destructive actions.
 *
 * @see NAS-4.13: Implement Drift Detection Foundation
 */
export interface DriftResolutionModalProps {
    /**
     * Whether the modal is open
     */
    open: boolean;
    /**
     * Callback to close the modal
     */
    onOpenChange: (open: boolean) => void;
    /**
     * Drift detection result
     */
    result: DriftResult;
    /**
     * Resource name for display
     */
    resourceName: string;
    /**
     * Resource UUID for API calls
     */
    resourceUuid: string;
    /**
     * Callback when resolution action is selected
     */
    onResolve: (request: DriftResolutionRequest) => Promise<void>;
    /**
     * Whether a resolution action is in progress
     */
    isResolving?: boolean;
    /**
     * Error message from last resolution attempt
     */
    error?: string;
}
export declare const DriftResolutionModal: React.MemoExoticComponent<React.ForwardRefExoticComponent<DriftResolutionModalProps & React.RefAttributes<HTMLDivElement>>>;
//# sourceMappingURL=DriftResolutionModal.d.ts.map