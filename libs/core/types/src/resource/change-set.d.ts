/**
 * Change Set Types for Atomic Multi-Resource Operations
 *
 * Enables atomic multi-resource operations like "Create LAN Network"
 * which requires creating multiple resources (Bridge, DHCP, Firewall, Routing)
 * that either all succeed or all rollback together.
 *
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 * @see ADR-012: Universal State v2
 * @see FR-STM-013: Atomic multi-resource operations
 */
import type { ResourceCategory } from './resource';
/**
 * Change set lifecycle status values.
 *
 * Represents the progression of a change set through validation, application,
 * and optional rollback stages. Used to track progress and control UI workflows.
 *
 * @constant
 * @see ChangeSet.status for inclusion
 * @see ChangeSetProgressEvent.status for progress updates
 */
export declare const ChangeSetStatus: {
    /** Initial state - adding items, not yet validated */
    readonly DRAFT: "DRAFT";
    /** Running validation on all items */
    readonly VALIDATING: "VALIDATING";
    /** All items validated, ready to apply */
    readonly READY: "READY";
    /** Applying resources in dependency order */
    readonly APPLYING: "APPLYING";
    /** All resources applied successfully */
    readonly COMPLETED: "COMPLETED";
    /** Apply failed, may have partial application */
    readonly FAILED: "FAILED";
    /** Rolling back applied changes */
    readonly ROLLING_BACK: "ROLLING_BACK";
    /** Rollback completed successfully */
    readonly ROLLED_BACK: "ROLLED_BACK";
    /** Rollback partially failed - manual intervention needed */
    readonly PARTIAL_FAILURE: "PARTIAL_FAILURE";
    /** User cancelled the operation */
    readonly CANCELLED: "CANCELLED";
};
/** Inferred type for change set status */
export type ChangeSetStatus = (typeof ChangeSetStatus)[keyof typeof ChangeSetStatus];
/**
 * Type of operation to perform on a resource within a change set.
 *
 * @constant
 * @see ChangeSetItem.operation for inclusion
 * @see getOperationColor, getOperationLabel for UI helpers
 */
export declare const ChangeOperation: {
    /** Create a new resource */
    readonly CREATE: "CREATE";
    /** Update an existing resource */
    readonly UPDATE: "UPDATE";
    /** Delete an existing resource */
    readonly DELETE: "DELETE";
};
/** Inferred type for change operations */
export type ChangeOperation = (typeof ChangeOperation)[keyof typeof ChangeOperation];
/**
 * Status of individual items within a change set.
 *
 * Tracks the progress and outcome of each operation in the change set.
 *
 * @constant
 * @see ChangeSetItem.status for inclusion
 * @see ChangeSetProgressEvent.currentItem for progress updates
 */
export declare const ChangeSetItemStatus: {
    /** Waiting to be applied */
    readonly PENDING: "PENDING";
    /** Currently being applied */
    readonly APPLYING: "APPLYING";
    /** Successfully applied */
    readonly APPLIED: "APPLIED";
    /** Application failed */
    readonly FAILED: "FAILED";
    /** Successfully rolled back */
    readonly ROLLED_BACK: "ROLLED_BACK";
    /** Rollback failed - manual intervention needed */
    readonly ROLLBACK_FAILED: "ROLLBACK_FAILED";
    /** Skipped due to dependency failure */
    readonly SKIPPED: "SKIPPED";
};
/** Inferred type for change set item status */
export type ChangeSetItemStatus = (typeof ChangeSetItemStatus)[keyof typeof ChangeSetItemStatus];
/**
 * Individual item representing a single resource operation within a change set.
 *
 * Each item tracks the configuration to apply, previous state for rollback,
 * dependencies, and application status.
 *
 * @template TConfig The configuration type for this resource
 * @see ChangeSet.items for collection of items
 * @see ChangeSetStatus for overall progress
 */
export interface ChangeSetItem<TConfig = Record<string, unknown>> {
    /**
     * Unique identifier for this item within the change set
     */
    readonly id: string;
    /**
     * Resource type identifier (e.g., 'network.bridge', 'dhcp.server')
     */
    readonly resourceType: string;
    /**
     * Resource category
     */
    readonly resourceCategory: ResourceCategory;
    /**
     * Existing resource UUID (null for create operations)
     */
    readonly resourceUuid: string | null;
    /**
     * User-friendly name for display
     */
    readonly name: string;
    /**
     * Optional description
     */
    readonly description?: string;
    /**
     * Operation to perform
     */
    readonly operation: ChangeOperation;
    /**
     * New/updated configuration
     */
    readonly configuration: TConfig;
    /**
     * Previous state before changes (for update/delete rollback)
     */
    readonly previousState: TConfig | null;
    /**
     * Item IDs this depends on (must be applied first)
     * References other items in the same change set
     */
    readonly dependencies: readonly string[];
    /**
     * Current status of this item
     */
    readonly status: ChangeSetItemStatus;
    /**
     * Error message if failed
     */
    readonly error: string | null;
    /**
     * Timestamp when apply started
     */
    readonly applyStartedAt: Date | null;
    /**
     * Timestamp when apply completed
     */
    readonly applyCompletedAt: Date | null;
    /**
     * Router-confirmed state after apply (for verification)
     */
    readonly confirmedState: TConfig | null;
    /**
     * Order in which this item will be applied (computed from dependencies)
     */
    readonly applyOrder: number;
}
/**
 * Type of rollback operation to undo applied changes.
 *
 * @constant
 * @see RollbackStep.operation for usage
 * @see ChangeSet.rollbackPlan for rollback sequence
 */
export declare const RollbackOperation: {
    /** Delete a created resource */
    readonly DELETE: "DELETE";
    /** Restore a deleted resource */
    readonly RESTORE: "RESTORE";
    /** Revert an updated resource */
    readonly REVERT: "REVERT";
};
/** Inferred type for rollback operations */
export type RollbackOperation = (typeof RollbackOperation)[keyof typeof RollbackOperation];
/**
 * Individual step in a rollback sequence.
 *
 * Describes how to undo a single applied change. Steps are executed
 * in reverse order of application (LIFO - Last In First Out).
 *
 * @template TConfig The configuration type for this resource
 * @see ChangeSet.rollbackPlan for the full rollback plan
 */
export interface RollbackStep<TConfig = Record<string, unknown>> {
    /**
     * Reference to the change set item being rolled back
     */
    readonly itemId: string;
    /**
     * Rollback operation to perform
     */
    readonly operation: RollbackOperation;
    /**
     * State to restore (for RESTORE and REVERT operations)
     */
    readonly restoreState: TConfig | null;
    /**
     * Resource UUID on router (for DELETE operations)
     */
    readonly resourceUuid: string | null;
    /**
     * Whether rollback succeeded
     */
    readonly success: boolean;
    /**
     * Error message if rollback failed
     */
    readonly error: string | null;
    /**
     * Order in rollback sequence (reverse of apply order)
     */
    readonly rollbackOrder: number;
}
/**
 * Detailed error information for a failed change set.
 *
 * Provides comprehensive error details including which item failed,
 * what was partially applied, and what manual cleanup may be needed.
 *
 * @see ChangeSet.error for inclusion
 * @see ChangeSetStatus.FAILED for when this is populated
 */
export interface ChangeSetError {
    /**
     * Error message
     */
    readonly message: string;
    /**
     * Item ID that caused the failure
     */
    readonly failedItemId: string;
    /**
     * Error code for programmatic handling
     */
    readonly code?: string;
    /**
     * Items that were applied before failure
     */
    readonly partiallyAppliedItemIds: readonly string[];
    /**
     * Items that failed rollback (require manual intervention)
     */
    readonly failedRollbackItemIds: readonly string[];
    /**
     * Whether manual intervention is required
     */
    readonly requiresManualIntervention: boolean;
    /**
     * Stack trace for debugging (dev only)
     */
    readonly stack?: string;
}
/**
 * Single validation error for a change set item.
 *
 * @see ChangeSetValidationResult.errors for blocking errors
 * @see ChangeSetValidationResult.warnings for non-blocking warnings
 */
export interface ChangeSetValidationError {
    /**
     * Item ID with validation error
     */
    readonly itemId: string;
    /**
     * Field path within the item configuration (dot-notation)
     */
    readonly field: string;
    /**
     * Error message
     */
    readonly message: string;
    /**
     * Severity level (error blocks apply, warning is informational)
     */
    readonly severity: 'error' | 'warning';
    /**
     * Error code for programmatic handling
     */
    readonly code?: string;
}
/**
 * Conflict detected between change set items or with existing resources.
 *
 * @see ChangeSetValidationResult.conflicts for validation results
 */
export interface ChangeSetConflict {
    /**
     * First conflicting item ID
     */
    readonly itemId1: string;
    /**
     * Second conflicting item ID (or existing resource UUID)
     */
    readonly itemId2OrResourceUuid: string;
    /**
     * Whether the conflict is with an existing resource (vs another item)
     */
    readonly isExternalConflict: boolean;
    /**
     * Description of the conflict
     */
    readonly description: string;
    /**
     * Suggested resolution
     */
    readonly resolution?: string;
}
/**
 * Complete validation result for a change set.
 *
 * Contains all validation issues, conflicts, and dependency problems detected
 * during the validation phase. Determines if the change set can be applied.
 *
 * @see ChangeSet.validation for inclusion
 * @see ChangeSetStatus.VALIDATING, READY for validation flow
 */
export interface ChangeSetValidationResult {
    /**
     * Whether the change set can be applied (no blocking errors)
     */
    readonly canApply: boolean;
    /**
     * Validation errors (blocking, must be fixed before apply)
     */
    readonly errors: readonly ChangeSetValidationError[];
    /**
     * Validation warnings (non-blocking, informational)
     */
    readonly warnings: readonly ChangeSetValidationError[];
    /**
     * Detected conflicts
     */
    readonly conflicts: readonly ChangeSetConflict[];
    /**
     * Missing dependencies (items depend on resources that don't exist)
     */
    readonly missingDependencies: ReadonlyArray<{
        readonly itemId: string;
        readonly missingResourceType: string;
        readonly missingResourceId: string;
    }>;
    /**
     * Circular dependencies detected
     */
    readonly circularDependencies: ReadonlyArray<readonly string[]> | null;
}
/**
 * Atomic multi-resource operation container.
 *
 * Bundles multiple resource changes (create, update, delete) that must either
 * all succeed or all rollback together. Ensures consistency when operations
 * depend on each other (e.g., creating a bridge, DHCP server, firewall rules).
 *
 * @template TConfig The configuration type for items in this change set
 * @see ChangeSetItem for individual operations
 * @see ChangeSetStatus for lifecycle progression
 * @see ChangeSetProgressEvent for progress notifications
 */
export interface ChangeSet<TConfig = Record<string, unknown>> {
    /**
     * Unique identifier (ULID)
     */
    readonly id: string;
    /**
     * Human-readable name
     */
    readonly name: string;
    /**
     * Optional description
     */
    readonly description?: string;
    /**
     * Router ID this change set applies to
     */
    readonly routerId: string;
    /**
     * Items in this change set
     */
    readonly items: readonly ChangeSetItem<TConfig>[];
    /**
     * Current status (draft, validating, ready, applying, etc.)
     */
    readonly status: ChangeSetStatus;
    /**
     * Validation result (populated after validation phase)
     */
    readonly validation: ChangeSetValidationResult | null;
    /**
     * Rollback plan (populated during/after apply for failure recovery)
     */
    readonly rollbackPlan: readonly RollbackStep<TConfig>[];
    /**
     * Error information (if failed)
     */
    readonly error: ChangeSetError | null;
    /**
     * Timestamp when created
     */
    readonly createdAt: Date;
    /**
     * Timestamp when apply started
     */
    readonly applyStartedAt: Date | null;
    /**
     * Timestamp when completed (success or failure)
     */
    readonly completedAt: Date | null;
    /**
     * User who created the change set
     */
    readonly createdBy?: string;
    /**
     * Source wizard/feature that created this change set
     */
    readonly source?: string;
    /**
     * Version number for optimistic concurrency control
     */
    readonly version: number;
}
/**
 * Real-time progress event streamed during change set application.
 *
 * Sent via WebSocket or subscription to provide live updates on change set
 * progress, including current item, completion percentage, and ETA.
 *
 * @see ChangeSet for the change set being applied
 * @see ChangeSetStatus for status values
 */
export interface ChangeSetProgressEvent {
    /**
     * Change set ID
     */
    readonly changeSetId: string;
    /**
     * Current status
     */
    readonly status: ChangeSetStatus;
    /**
     * Currently processing item (if applicable)
     */
    readonly currentItem: {
        readonly id: string;
        readonly name: string;
        readonly operation: ChangeOperation;
        readonly status: ChangeSetItemStatus;
    } | null;
    /**
     * Number of items applied so far
     */
    readonly appliedCount: number;
    /**
     * Total number of items
     */
    readonly totalCount: number;
    /**
     * Progress percentage (0-100)
     */
    readonly progressPercent: number;
    /**
     * Estimated time remaining in milliseconds
     */
    readonly estimatedRemainingMs: number | null;
    /**
     * Error if failed
     */
    readonly error: ChangeSetError | null;
    /**
     * Timestamp of this event
     */
    readonly timestamp: Date;
}
/**
 * Lightweight summary of a change set for list displays.
 *
 * Contains essential information for rendering change set lists without
 * the full details of items and validation results.
 *
 * @see ChangeSet for the full change set interface
 */
export interface ChangeSetSummary {
    /**
     * Change set ID
     */
    readonly id: string;
    /**
     * Name
     */
    readonly name: string;
    /**
     * Current status
     */
    readonly status: ChangeSetStatus;
    /**
     * Number of items by operation type
     */
    readonly operationCounts: {
        readonly create: number;
        readonly update: number;
        readonly delete: number;
    };
    /**
     * Total items
     */
    readonly totalItems: number;
    /**
     * Created at
     */
    readonly createdAt: Date;
    /**
     * Has errors
     */
    readonly hasErrors: boolean;
    /**
     * Has warnings
     */
    readonly hasWarnings: boolean;
}
/**
 * Check if change set is in a pending (not yet applied) state.
 *
 * @param status Change set status
 * @returns true if the change set hasn't been applied yet
 *
 * @example
 * ```ts
 * if (isChangeSetPending(status)) {
 *   showValidateAndApplyButtons();
 * }
 * ```
 *
 * @see ChangeSetStatus for status values
 */
export declare function isChangeSetPending(status: ChangeSetStatus): boolean;
/**
 * Check if change set is currently processing (validating, applying, or rolling back).
 *
 * @param status Change set status
 * @returns true if the change set is in progress
 *
 * @example
 * ```ts
 * if (isChangeSetProcessing(status)) {
 *   showProgressSpinner();
 * }
 * ```
 *
 * @see ChangeSetStatus for status values
 */
export declare function isChangeSetProcessing(status: ChangeSetStatus): boolean;
/**
 * Check if change set is in a final state (no more changes possible).
 *
 * @param status Change set status
 * @returns true if the change set has completed (successfully or not)
 *
 * @example
 * ```ts
 * if (isChangeSetFinal(status)) {
 *   disableAllActionButtons();
 * }
 * ```
 *
 * @see ChangeSetStatus for status values
 */
export declare function isChangeSetFinal(status: ChangeSetStatus): boolean;
/**
 * Check if change set can be cancelled by the user.
 *
 * @param status Change set status
 * @returns true if the change set can be cancelled (will stop after current item if applying)
 *
 * @example
 * ```ts
 * if (isChangeSetCancellable(status)) {
 *   enableCancelButton();
 * }
 * ```
 *
 * @see ChangeSetStatus for status values
 */
export declare function isChangeSetCancellable(status: ChangeSetStatus): boolean;
/**
 * Check if change set requires manual intervention.
 *
 * @param status Change set status
 * @returns true if the change set failed partially and needs manual cleanup
 *
 * @example
 * ```ts
 * if (requiresManualIntervention(status)) {
 *   showManualInterventionWarning();
 * }
 * ```
 *
 * @see ChangeSetError.requiresManualIntervention for details
 */
export declare function requiresManualIntervention(status: ChangeSetStatus): boolean;
/**
 * Display information for rendering a change set status in the UI.
 *
 * @see getChangeSetStatusDisplayInfo for populating this interface
 */
export interface ChangeSetStatusDisplayInfo {
    /** Display label */
    readonly label: string;
    /** Description of the status */
    readonly description: string;
    /** Color for status indicators (semantic colors) */
    readonly color: 'gray' | 'blue' | 'green' | 'amber' | 'red';
    /** Icon name hint */
    readonly icon: 'draft' | 'spinner' | 'check' | 'warning' | 'error' | 'rollback';
    /** Whether to show a spinner animation */
    readonly showSpinner: boolean;
}
/**
 * Get UI display information for a change set status.
 *
 * @param status Change set status
 * @returns Display information (label, color, icon, spinner flag)
 *
 * @example
 * ```ts
 * const displayInfo = getChangeSetStatusDisplayInfo(ChangeSetStatus.APPLYING);
 * return <Badge color={displayInfo.color}>{displayInfo.label}</Badge>;
 * ```
 *
 * @see ChangeSetStatusDisplayInfo for the returned interface
 */
export declare function getChangeSetStatusDisplayInfo(status: ChangeSetStatus): ChangeSetStatusDisplayInfo;
/**
 * Get display color for a change operation.
 *
 * Maps operations to semantic colors: create (green), update (amber), delete (red).
 *
 * @param operation Change operation type
 * @returns Color for rendering
 *
 * @example
 * ```ts
 * const color = getOperationColor(ChangeOperation.CREATE);
 * return <span className={`text-${color}-500`}>Create</span>;
 * ```
 *
 * @see ChangeOperation for operation types
 */
export declare function getOperationColor(operation: ChangeOperation): 'green' | 'amber' | 'red';
/**
 * Get display label for a change operation.
 *
 * Maps operations to human-readable labels for UI display.
 *
 * @param operation Change operation type
 * @returns Localized display label
 *
 * @example
 * ```ts
 * const label = getOperationLabel(ChangeOperation.UPDATE);
 * return <span>{label}</span>; // "Update"
 * ```
 *
 * @see ChangeOperation for operation types
 */
export declare function getOperationLabel(operation: ChangeOperation): string;
//# sourceMappingURL=change-set.d.ts.map