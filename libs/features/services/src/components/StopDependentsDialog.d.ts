/**
 * StopDependentsDialog Component
 *
 * Warning dialog when stopping a service with dependents.
 * Displays affected services and offers options for handling dependents.
 *
 * Part of NAS-8.19 Feature Dependencies implementation.
 */
import * as React from 'react';
import type { ServiceDependency } from '@nasnet/api-client/queries';
/**
 * Stop action mode
 */
export type StopMode = 'stop-dependents-first' | 'force-stop';
export interface StopDependentsDialogProps {
    /** Dialog open state */
    open: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
    /** Service instance name being stopped */
    instanceName: string;
    /** Feature ID of the instance being stopped */
    featureId: string;
    /** List of dependents (services that depend on this instance) */
    dependents: ServiceDependency[];
    /** Callback when user confirms stop action */
    onConfirm: (mode: StopMode) => void;
    /** Whether the action is loading */
    isLoading?: boolean;
}
/**
 * Stop Dependents Dialog Component
 *
 * Displays a warning when attempting to stop a service that other services depend on.
 * Offers two options:
 * 1. Stop dependents first (graceful, recommended)
 * 2. Force stop (may cause dependent services to fail)
 *
 * @example
 * ```tsx
 * <StopDependentsDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   instanceName="Tor Gateway"
 *   featureId="tor"
 *   dependents={dependentsList}
 *   onConfirm={(mode) => handleStop(mode)}
 * />
 * ```
 */
export declare const StopDependentsDialog: React.NamedExoticComponent<StopDependentsDialogProps>;
//# sourceMappingURL=StopDependentsDialog.d.ts.map