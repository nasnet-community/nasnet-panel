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
 * Change set lifecycle status values
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

export type ChangeSetStatus =
  (typeof ChangeSetStatus)[keyof typeof ChangeSetStatus];

// =============================================================================
// Change Operation
// =============================================================================

/**
 * Type of operation to perform on a resource
 */
export const ChangeOperation = {
  /** Create a new resource */
  CREATE: 'CREATE',
  /** Update an existing resource */
  UPDATE: 'UPDATE',
  /** Delete an existing resource */
  DELETE: 'DELETE',
} as const;

export type ChangeOperation =
  (typeof ChangeOperation)[keyof typeof ChangeOperation];

// =============================================================================
// Change Set Item Status
// =============================================================================

/**
 * Status of individual items within a change set
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

export type ChangeSetItemStatus =
  (typeof ChangeSetItemStatus)[keyof typeof ChangeSetItemStatus];

// =============================================================================
// Change Set Item Interface
// =============================================================================

/**
 * Individual item within a change set
 */
export interface ChangeSetItem<TConfig = Record<string, unknown>> {
  /**
   * Unique identifier for this item within the change set
   */
  id: string;

  /**
   * Resource type identifier (e.g., 'network.bridge', 'dhcp.server')
   */
  resourceType: string;

  /**
   * Resource category
   */
  resourceCategory: ResourceCategory;

  /**
   * Existing resource UUID (null for create operations)
   */
  resourceUuid: string | null;

  /**
   * User-friendly name for display
   */
  name: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Operation to perform
   */
  operation: ChangeOperation;

  /**
   * New/updated configuration
   */
  configuration: TConfig;

  /**
   * Previous state before changes (for update/delete rollback)
   */
  previousState: TConfig | null;

  /**
   * Item IDs this depends on (must be applied first)
   * References other items in the same change set
   */
  dependencies: string[];

  /**
   * Current status of this item
   */
  status: ChangeSetItemStatus;

  /**
   * Error message if failed
   */
  error: string | null;

  /**
   * Timestamp when apply started
   */
  applyStartedAt: Date | null;

  /**
   * Timestamp when apply completed
   */
  applyCompletedAt: Date | null;

  /**
   * Router-confirmed state after apply (for verification)
   */
  confirmedState: TConfig | null;

  /**
   * Order in which this item will be applied (computed from dependencies)
   */
  applyOrder: number;
}

// =============================================================================
// Rollback Step Interface
// =============================================================================

/**
 * Rollback operation type
 */
export const RollbackOperation = {
  /** Delete a created resource */
  DELETE: 'DELETE',
  /** Restore a deleted resource */
  RESTORE: 'RESTORE',
  /** Revert an updated resource */
  REVERT: 'REVERT',
} as const;

export type RollbackOperation =
  (typeof RollbackOperation)[keyof typeof RollbackOperation];

/**
 * Individual rollback step
 */
export interface RollbackStep<TConfig = Record<string, unknown>> {
  /**
   * Reference to the change set item being rolled back
   */
  itemId: string;

  /**
   * Rollback operation to perform
   */
  operation: RollbackOperation;

  /**
   * State to restore (for RESTORE and REVERT operations)
   */
  restoreState: TConfig | null;

  /**
   * Resource UUID on router (for DELETE operations)
   */
  resourceUuid: string | null;

  /**
   * Whether rollback succeeded
   */
  success: boolean;

  /**
   * Error message if rollback failed
   */
  error: string | null;

  /**
   * Order in rollback sequence (reverse of apply order)
   */
  rollbackOrder: number;
}

// =============================================================================
// Change Set Error Interface
// =============================================================================

/**
 * Detailed error information for failed change sets
 */
export interface ChangeSetError {
  /**
   * Error message
   */
  message: string;

  /**
   * Item ID that caused the failure
   */
  failedItemId: string;

  /**
   * Error code for programmatic handling
   */
  code?: string;

  /**
   * Items that were applied before failure
   */
  partiallyAppliedItemIds: string[];

  /**
   * Items that failed rollback (require manual intervention)
   */
  failedRollbackItemIds: string[];

  /**
   * Whether manual intervention is required
   */
  requiresManualIntervention: boolean;

  /**
   * Stack trace for debugging (dev only)
   */
  stack?: string;
}

// =============================================================================
// Validation Result for Change Set
// =============================================================================

/**
 * Validation error for a change set item
 */
export interface ChangeSetValidationError {
  /**
   * Item ID with validation error
   */
  itemId: string;

  /**
   * Field path within the item configuration
   */
  field: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Severity level
   */
  severity: 'error' | 'warning';

  /**
   * Error code
   */
  code?: string;
}

/**
 * Conflict between change set items or with existing resources
 */
export interface ChangeSetConflict {
  /**
   * First conflicting item ID
   */
  itemId1: string;

  /**
   * Second conflicting item ID (or existing resource UUID)
   */
  itemId2OrResourceUuid: string;

  /**
   * Whether the conflict is with an existing resource
   */
  isExternalConflict: boolean;

  /**
   * Description of the conflict
   */
  description: string;

  /**
   * Suggested resolution
   */
  resolution?: string;
}

/**
 * Full validation result for a change set
 */
export interface ChangeSetValidationResult {
  /**
   * Whether the change set can be applied
   */
  canApply: boolean;

  /**
   * Validation errors (blocking)
   */
  errors: ChangeSetValidationError[];

  /**
   * Validation warnings (non-blocking)
   */
  warnings: ChangeSetValidationError[];

  /**
   * Detected conflicts
   */
  conflicts: ChangeSetConflict[];

  /**
   * Missing dependencies (items depend on resources that don't exist)
   */
  missingDependencies: Array<{
    itemId: string;
    missingResourceType: string;
    missingResourceId: string;
  }>;

  /**
   * Circular dependencies detected
   */
  circularDependencies: string[][] | null;
}

// =============================================================================
// Change Set Interface
// =============================================================================

/**
 * A change set representing an atomic multi-resource operation
 */
export interface ChangeSet<TConfig = Record<string, unknown>> {
  /**
   * Unique identifier (ULID)
   */
  id: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Router ID this change set applies to
   */
  routerId: string;

  /**
   * Items in this change set
   */
  items: ChangeSetItem<TConfig>[];

  /**
   * Current status
   */
  status: ChangeSetStatus;

  /**
   * Validation result (populated after validation)
   */
  validation: ChangeSetValidationResult | null;

  /**
   * Rollback plan (populated during/after apply)
   */
  rollbackPlan: RollbackStep<TConfig>[];

  /**
   * Error information (if failed)
   */
  error: ChangeSetError | null;

  /**
   * Timestamp when created
   */
  createdAt: Date;

  /**
   * Timestamp when apply started
   */
  applyStartedAt: Date | null;

  /**
   * Timestamp when completed (success or failure)
   */
  completedAt: Date | null;

  /**
   * User who created the change set
   */
  createdBy?: string;

  /**
   * Source wizard/feature that created this change set
   */
  source?: string;

  /**
   * Version for optimistic concurrency
   */
  version: number;
}

// =============================================================================
// Change Set Progress Event
// =============================================================================

/**
 * Progress event for real-time updates during apply
 */
export interface ChangeSetProgressEvent {
  /**
   * Change set ID
   */
  changeSetId: string;

  /**
   * Current status
   */
  status: ChangeSetStatus;

  /**
   * Currently processing item (if applicable)
   */
  currentItem: {
    id: string;
    name: string;
    operation: ChangeOperation;
    status: ChangeSetItemStatus;
  } | null;

  /**
   * Number of items applied
   */
  appliedCount: number;

  /**
   * Total number of items
   */
  totalCount: number;

  /**
   * Progress percentage (0-100)
   */
  progressPercent: number;

  /**
   * Estimated time remaining in milliseconds
   */
  estimatedRemainingMs: number | null;

  /**
   * Error if failed
   */
  error: ChangeSetError | null;

  /**
   * Timestamp of this event
   */
  timestamp: Date;
}

// =============================================================================
// Change Set Summary (for list views)
// =============================================================================

/**
 * Summary of a change set for list displays
 */
export interface ChangeSetSummary {
  /**
   * Change set ID
   */
  id: string;

  /**
   * Name
   */
  name: string;

  /**
   * Current status
   */
  status: ChangeSetStatus;

  /**
   * Number of items by operation type
   */
  operationCounts: {
    create: number;
    update: number;
    delete: number;
  };

  /**
   * Total items
   */
  totalItems: number;

  /**
   * Created at
   */
  createdAt: Date;

  /**
   * Has errors
   */
  hasErrors: boolean;

  /**
   * Has warnings
   */
  hasWarnings: boolean;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if change set is in a pending (not yet applied) state
 */
export function isChangeSetPending(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.DRAFT,
    ChangeSetStatus.VALIDATING,
    ChangeSetStatus.READY,
  ].includes(status);
}

/**
 * Check if change set is currently processing
 */
export function isChangeSetProcessing(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.VALIDATING,
    ChangeSetStatus.APPLYING,
    ChangeSetStatus.ROLLING_BACK,
  ].includes(status);
}

/**
 * Check if change set is in a final state
 */
export function isChangeSetFinal(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.COMPLETED,
    ChangeSetStatus.FAILED,
    ChangeSetStatus.ROLLED_BACK,
    ChangeSetStatus.PARTIAL_FAILURE,
    ChangeSetStatus.CANCELLED,
  ].includes(status);
}

/**
 * Check if change set can be cancelled
 */
export function isChangeSetCancellable(status: ChangeSetStatus): boolean {
  return [
    ChangeSetStatus.DRAFT,
    ChangeSetStatus.VALIDATING,
    ChangeSetStatus.READY,
    ChangeSetStatus.APPLYING, // Will stop after current item
  ].includes(status);
}

/**
 * Check if change set requires manual intervention
 */
export function requiresManualIntervention(status: ChangeSetStatus): boolean {
  return status === ChangeSetStatus.PARTIAL_FAILURE;
}

/**
 * Get display information for a change set status
 */
export interface ChangeSetStatusDisplayInfo {
  label: string;
  description: string;
  color: 'gray' | 'blue' | 'green' | 'amber' | 'red';
  icon: 'draft' | 'spinner' | 'check' | 'warning' | 'error' | 'rollback';
  showSpinner: boolean;
}

export function getChangeSetStatusDisplayInfo(
  status: ChangeSetStatus
): ChangeSetStatusDisplayInfo {
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
 * Get display color for a change operation
 */
export function getOperationColor(
  operation: ChangeOperation
): 'green' | 'amber' | 'red' {
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
 * Get display label for a change operation
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
