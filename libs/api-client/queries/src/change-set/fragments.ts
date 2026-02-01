/**
 * Change Set GraphQL Fragments
 *
 * Reusable GraphQL fragments for change set queries.
 * @module @nasnet/api-client/queries/change-set
 * @see NAS-4.14: Implement Change Sets (Atomic Multi-Resource Operations)
 */

import { gql } from '@apollo/client';

// ============================================================================
// Base Fragments
// ============================================================================

/**
 * Minimal change set item fields
 */
export const CHANGE_SET_ITEM_LIGHT_FRAGMENT = gql`
  fragment ChangeSetItemLight on ChangeSetItem {
    id
    name
    resourceType
    resourceCategory
    operation
    status
    applyOrder
    error
  }
`;

/**
 * Full change set item with configuration
 */
export const CHANGE_SET_ITEM_FULL_FRAGMENT = gql`
  fragment ChangeSetItemFull on ChangeSetItem {
    id
    name
    description
    resourceType
    resourceCategory
    resourceUuid
    operation
    status
    configuration
    previousState
    dependencies
    error
    applyOrder
    applyStartedAt
    applyCompletedAt
  }
`;

/**
 * Validation error fragment
 */
export const CHANGE_SET_VALIDATION_ERROR_FRAGMENT = gql`
  fragment ChangeSetValidationError on ChangeSetValidationError {
    itemId
    field
    message
    severity
    code
  }
`;

/**
 * Conflict fragment
 */
export const CHANGE_SET_CONFLICT_FRAGMENT = gql`
  fragment ChangeSetConflict on ChangeSetConflict {
    itemId1
    itemId2OrResourceUuid
    isExternalConflict
    description
    resolution
  }
`;

/**
 * Missing dependency fragment
 */
export const MISSING_DEPENDENCY_FRAGMENT = gql`
  fragment MissingDependency on MissingDependency {
    itemId
    missingResourceType
    missingResourceId
  }
`;

/**
 * Validation result fragment
 */
export const CHANGE_SET_VALIDATION_RESULT_FRAGMENT = gql`
  fragment ChangeSetValidationResult on ChangeSetValidationResult {
    canApply
    errors {
      ...ChangeSetValidationError
    }
    warnings {
      ...ChangeSetValidationError
    }
    conflicts {
      ...ChangeSetConflict
    }
    missingDependencies {
      ...MissingDependency
    }
    circularDependencies
  }
  ${CHANGE_SET_VALIDATION_ERROR_FRAGMENT}
  ${CHANGE_SET_CONFLICT_FRAGMENT}
  ${MISSING_DEPENDENCY_FRAGMENT}
`;

/**
 * Rollback step fragment
 */
export const ROLLBACK_STEP_FRAGMENT = gql`
  fragment RollbackStep on RollbackStep {
    itemId
    operation
    restoreState
    resourceUuid
    success
    error
    rollbackOrder
  }
`;

/**
 * Change set error fragment
 */
export const CHANGE_SET_ERROR_FRAGMENT = gql`
  fragment ChangeSetError on ChangeSetError {
    message
    failedItemId
    code
    partiallyAppliedItemIds
    failedRollbackItemIds
    requiresManualIntervention
  }
`;

// ============================================================================
// Change Set Fragments
// ============================================================================

/**
 * Change set summary for list views
 */
export const CHANGE_SET_SUMMARY_FRAGMENT = gql`
  fragment ChangeSetSummary on ChangeSetSummary {
    id
    name
    status
    operationCounts {
      create
      update
      delete
    }
    totalItems
    createdAt
    hasErrors
    hasWarnings
  }
`;

/**
 * Full change set with all details
 */
export const CHANGE_SET_FULL_FRAGMENT = gql`
  fragment ChangeSetFull on ChangeSet {
    id
    name
    description
    routerId
    status
    version
    createdAt
    applyStartedAt
    completedAt
    createdBy
    source
    items {
      ...ChangeSetItemFull
    }
    validation {
      ...ChangeSetValidationResult
    }
    rollbackPlan {
      ...RollbackStep
    }
    error {
      ...ChangeSetError
    }
  }
  ${CHANGE_SET_ITEM_FULL_FRAGMENT}
  ${CHANGE_SET_VALIDATION_RESULT_FRAGMENT}
  ${ROLLBACK_STEP_FRAGMENT}
  ${CHANGE_SET_ERROR_FRAGMENT}
`;

/**
 * Change set with light item details (for progress tracking)
 */
export const CHANGE_SET_PROGRESS_FRAGMENT = gql`
  fragment ChangeSetProgress on ChangeSet {
    id
    name
    status
    version
    items {
      ...ChangeSetItemLight
    }
    error {
      ...ChangeSetError
    }
  }
  ${CHANGE_SET_ITEM_LIGHT_FRAGMENT}
  ${CHANGE_SET_ERROR_FRAGMENT}
`;

// ============================================================================
// Subscription Event Fragments
// ============================================================================

/**
 * Current item info in progress event
 */
export const CURRENT_ITEM_INFO_FRAGMENT = gql`
  fragment CurrentItemInfo on CurrentItemInfo {
    id
    name
    operation
    status
  }
`;

/**
 * Progress event fragment
 */
export const CHANGE_SET_PROGRESS_EVENT_FRAGMENT = gql`
  fragment ChangeSetProgressEvent on ChangeSetProgressEvent {
    changeSetId
    status
    currentItem {
      ...CurrentItemInfo
    }
    appliedCount
    totalCount
    progressPercent
    estimatedRemainingMs
    error {
      ...ChangeSetError
    }
    timestamp
  }
  ${CURRENT_ITEM_INFO_FRAGMENT}
  ${CHANGE_SET_ERROR_FRAGMENT}
`;

/**
 * Status change event fragment
 */
export const CHANGE_SET_STATUS_EVENT_FRAGMENT = gql`
  fragment ChangeSetStatusEvent on ChangeSetStatusEvent {
    changeSetId
    previousStatus
    newStatus
    error {
      ...ChangeSetError
    }
    timestamp
  }
  ${CHANGE_SET_ERROR_FRAGMENT}
`;
