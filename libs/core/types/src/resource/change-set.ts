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

// =============================================================================
// Change Set Status
// =============================================================================

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
export const ChangeSetStatus = {
  /** Initial state - adding items, not yet validated */
  DRAFT: 'DRAFT',
  /** Running validation on all items */
  VALIDATING: 'VALIDATING',
  /** All items validated, ready to apply */
  READY: 'READY',
  /** Applying resources in dependency order */
  APPLYING: 'APPLYING',
  /** All resources applied successfully */
  COMPLETED: 'COMPLETED',
  /** Apply failed, may have partial application */
  FAILED: 'FAILED',
  /** Rolling back applied changes */
  ROLLING_BACK: 'ROLLING_BACK',
  /** Rollback completed successfully */
  ROLLED_BACK: 'ROLLED_BACK',
  /** Rollback partially failed - manual intervention needed */
  PARTIAL_FAILURE: 'PARTIAL_FAILURE',
  /** User cancelled the operation */
  CANCELLED: 'CANCELLED',
} as const;

/** Inferred type for change set status */
export type ChangeSetStatus = (typeof ChangeSetStatus)[keyof typeof ChangeSetStatus];

// =============================================================================
// Change Operation
// =============================================================================

/**
 * Type of operation to perform on a resource within a change set.
 *
 * @constant
 * @see ChangeSetItem.operation for inclusion
 * @see getOperationColor, getOperationLabel for UI helpers
 */
export const ChangeOperation = {
  /** Create a new resource */
  CREATE: 'CREATE',
  /** Update an existing resource */
  UPDATE: 'UPDATE',
  /** Delete an existing resource */
  DELETE: 'DELETE',
} as const;

/** Inferred type for change operations */
export type ChangeOperation = (typeof ChangeOperation)[keyof typeof ChangeOperation];

// =============================================================================
// Change Set Item Status
// =============================================================================

/**
 * Status of individual items within a change set.
 *
 * Tracks the progress and outcome of each operation in the change set.
 *
 * @constant
 * @see ChangeSetItem.status for inclusion
 * @see ChangeSetProgressEvent.currentItem for progress updates
 */
export const ChangeSetItemStatus = {
  /** Waiting to be applied */
  PENDING: 'PENDING',
  /** Currently being applied */
  APPLYING: 'APPLYING',
  /** Successfully applied */
  APPLIED: 'APPLIED',
  /** Application failed */
  FAILED: 'FAILED',
  /** Successfully rolled back */
  ROLLED_BACK: 'ROLLED_BACK',
  /** Rollback failed - manual intervention needed */
  ROLLBACK_FAILED: 'ROLLBACK_FAILED',
  /** Skipped due to dependency failure */
  SKIPPED: 'SKIPPED',
} as const;

/** Inferred type for change set item status */
export type ChangeSetItemStatus = (typeof ChangeSetItemStatus)[keyof typeof ChangeSetItemStatus];

// =============================================================================
// Change Set Item Interface
// =============================================================================

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

// =============================================================================
// Rollback Step Interface
// =============================================================================

/**
 * Type of rollback operation to undo applied changes.
 *
 * @constant
 * @see RollbackStep.operation for usage
 * @see ChangeSet.rollbackPlan for rollback sequence
 */
export const RollbackOperation = {
  /** Delete a created resource */
  DELETE: 'DELETE',
  /** Restore a deleted resource */
  RESTORE: 'RESTORE',
  /** Revert an updated resource */
  REVERT: 'REVERT',
} as const;

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

// =============================================================================
// Change Set Error Interface
// =============================================================================

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

// =============================================================================
// Validation Result for Change Set
// =============================================================================

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

// =============================================================================
// Change Set Interface
// =============================================================================

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

// =============================================================================
// Change Set Progress Event
// =============================================================================

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

// =============================================================================
// Change Set Summary (for list views)
// =============================================================================

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

// =============================================================================
// Utility Functions
// =============================================================================

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
export function isChangeSetPending(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.DRAFT,
    ChangeSetStatus.VALIDATING,
    ChangeSetStatus.READY,
    // Note: includes() check requires full type assertion due to TS limitation with const objects
    // The status parameter is guaranteed to be a valid ChangeSetStatus type at runtime
  ].includes(status as never);
}

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
export function isChangeSetProcessing(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.VALIDATING,
    ChangeSetStatus.APPLYING,
    ChangeSetStatus.ROLLING_BACK,
    // Note: includes() check requires full type assertion due to TS limitation with const objects
    // The status parameter is guaranteed to be a valid ChangeSetStatus type at runtime
  ].includes(status as never);
}

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
export function isChangeSetFinal(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.COMPLETED,
    ChangeSetStatus.FAILED,
    ChangeSetStatus.ROLLED_BACK,
    ChangeSetStatus.PARTIAL_FAILURE,
    ChangeSetStatus.CANCELLED,
    // Note: includes() check requires full type assertion due to TS limitation with const objects
    // The status parameter is guaranteed to be a valid ChangeSetStatus type at runtime
  ].includes(status as never);
}

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
export function isChangeSetCancellable(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.DRAFT,
    ChangeSetStatus.VALIDATING,
    ChangeSetStatus.READY,
    ChangeSetStatus.APPLYING, // Will stop after current item
    // Note: includes() check requires full type assertion due to TS limitation with const objects
    // The status parameter is guaranteed to be a valid ChangeSetStatus type at runtime
  ].includes(status as never);
}

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
export function requiresManualIntervention(status: ChangeSetStatus): boolean {
  return status === ChangeSetStatus.PARTIAL_FAILURE;
}

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
export function getChangeSetStatusDisplayInfo(status: ChangeSetStatus): ChangeSetStatusDisplayInfo {
  switch (status) {
    case ChangeSetStatus.DRAFT:
      return {
        label: 'Draft',
        description: 'Adding items to change set',
        color: 'gray',
        icon: 'draft',
        showSpinner: false,
      };
    case ChangeSetStatus.VALIDATING:
      return {
        label: 'Validating',
        description: 'Checking all items...',
        color: 'blue',
        icon: 'spinner',
        showSpinner: true,
      };
    case ChangeSetStatus.READY:
      return {
        label: 'Ready',
        description: 'Ready to apply',
        color: 'green',
        icon: 'check',
        showSpinner: false,
      };
    case ChangeSetStatus.APPLYING:
      return {
        label: 'Applying',
        description: 'Applying changes...',
        color: 'amber',
        icon: 'spinner',
        showSpinner: true,
      };
    case ChangeSetStatus.COMPLETED:
      return {
        label: 'Completed',
        description: 'All changes applied',
        color: 'green',
        icon: 'check',
        showSpinner: false,
      };
    case ChangeSetStatus.FAILED:
      return {
        label: 'Failed',
        description: 'Apply failed',
        color: 'red',
        icon: 'error',
        showSpinner: false,
      };
    case ChangeSetStatus.ROLLING_BACK:
      return {
        label: 'Rolling Back',
        description: 'Reverting changes...',
        color: 'amber',
        icon: 'rollback',
        showSpinner: true,
      };
    case ChangeSetStatus.ROLLED_BACK:
      return {
        label: 'Rolled Back',
        description: 'Changes reverted',
        color: 'gray',
        icon: 'rollback',
        showSpinner: false,
      };
    case ChangeSetStatus.PARTIAL_FAILURE:
      return {
        label: 'Partial Failure',
        description: 'Manual intervention required',
        color: 'red',
        icon: 'warning',
        showSpinner: false,
      };
    case ChangeSetStatus.CANCELLED:
      return {
        label: 'Cancelled',
        description: 'Operation cancelled',
        color: 'gray',
        icon: 'warning',
        showSpinner: false,
      };
    default:
      return {
        label: 'Unknown',
        description: 'Unknown status',
        color: 'gray',
        icon: 'draft',
        showSpinner: false,
      };
  }
}

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
export function getOperationColor(operation: ChangeOperation): 'green' | 'amber' | 'red' {
  switch (operation) {
    case ChangeOperation.CREATE:
      return 'green';
    case ChangeOperation.UPDATE:
      return 'amber';
    case ChangeOperation.DELETE:
      return 'red';
    default:
      return 'amber';
  }
}

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
export function getOperationLabel(operation: ChangeOperation): string {
  switch (operation) {
    case ChangeOperation.CREATE:
      return 'Create';
    case ChangeOperation.UPDATE:
      return 'Update';
    case ChangeOperation.DELETE:
      return 'Delete';
    default:
      return 'Unknown';
  }
}
