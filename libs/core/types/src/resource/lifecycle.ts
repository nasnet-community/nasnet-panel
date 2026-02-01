/**
 * Universal State v2 Lifecycle Types
 *
 * Types for resource lifecycle state management.
 * Reference: ADR-012 - Universal State v2
 */

// =============================================================================
// Lifecycle States
// =============================================================================

/**
 * Resource lifecycle states for state machine
 */
export const ResourceLifecycleState = {
  /** Initial creation, not yet validated */
  DRAFT: 'DRAFT',
  /** Backend validation in progress */
  VALIDATING: 'VALIDATING',
  /** Passed validation, ready to apply */
  VALID: 'VALID',
  /** Being applied to router */
  APPLYING: 'APPLYING',
  /** Successfully applied and running */
  ACTIVE: 'ACTIVE',
  /** Running but with issues */
  DEGRADED: 'DEGRADED',
  /** Failed state (validation or apply) */
  ERROR: 'ERROR',
  /** Marked for removal */
  DEPRECATED: 'DEPRECATED',
  /** Final state, no longer active */
  ARCHIVED: 'ARCHIVED',
} as const;

export type ResourceLifecycleState =
  (typeof ResourceLifecycleState)[keyof typeof ResourceLifecycleState];

// =============================================================================
// Lifecycle Events
// =============================================================================

/**
 * Events that trigger lifecycle state transitions
 */
export const ResourceLifecycleEvent = {
  /** Start validation process */
  VALIDATE: 'VALIDATE',
  /** Apply resource to router */
  APPLY: 'APPLY',
  /** Confirm apply succeeded */
  CONFIRM: 'CONFIRM',
  /** Resource has degraded */
  DEGRADE: 'DEGRADE',
  /** Resource recovered from degraded */
  RECOVER: 'RECOVER',
  /** Retry failed operation */
  RETRY: 'RETRY',
  /** Edit resource (go back to draft) */
  EDIT: 'EDIT',
  /** Deprecate resource */
  DEPRECATE: 'DEPRECATE',
  /** Restore deprecated resource */
  RESTORE: 'RESTORE',
  /** Archive resource permanently */
  ARCHIVE: 'ARCHIVE',
} as const;

export type ResourceLifecycleEvent =
  (typeof ResourceLifecycleEvent)[keyof typeof ResourceLifecycleEvent];

// =============================================================================
// State Transition Utilities
// =============================================================================

/**
 * Valid state transitions map
 */
export const LIFECYCLE_TRANSITIONS: Record<
  ResourceLifecycleState,
  Partial<Record<ResourceLifecycleEvent, ResourceLifecycleState>>
> = {
  [ResourceLifecycleState.DRAFT]: {
    [ResourceLifecycleEvent.VALIDATE]: ResourceLifecycleState.VALIDATING,
  },
  [ResourceLifecycleState.VALIDATING]: {
    // Transitions handled by validation result (VALID or ERROR)
  },
  [ResourceLifecycleState.VALID]: {
    [ResourceLifecycleEvent.APPLY]: ResourceLifecycleState.APPLYING,
    [ResourceLifecycleEvent.EDIT]: ResourceLifecycleState.DRAFT,
  },
  [ResourceLifecycleState.APPLYING]: {
    // Transitions handled by apply result (ACTIVE or ERROR)
  },
  [ResourceLifecycleState.ACTIVE]: {
    [ResourceLifecycleEvent.DEGRADE]: ResourceLifecycleState.DEGRADED,
    [ResourceLifecycleEvent.DEPRECATE]: ResourceLifecycleState.DEPRECATED,
    [ResourceLifecycleEvent.EDIT]: ResourceLifecycleState.DRAFT,
  },
  [ResourceLifecycleState.DEGRADED]: {
    [ResourceLifecycleEvent.RECOVER]: ResourceLifecycleState.ACTIVE,
    [ResourceLifecycleEvent.DEPRECATE]: ResourceLifecycleState.DEPRECATED,
  },
  [ResourceLifecycleState.ERROR]: {
    [ResourceLifecycleEvent.RETRY]: ResourceLifecycleState.VALIDATING,
    [ResourceLifecycleEvent.EDIT]: ResourceLifecycleState.DRAFT,
  },
  [ResourceLifecycleState.DEPRECATED]: {
    [ResourceLifecycleEvent.ARCHIVE]: ResourceLifecycleState.ARCHIVED,
    [ResourceLifecycleEvent.RESTORE]: ResourceLifecycleState.ACTIVE,
  },
  [ResourceLifecycleState.ARCHIVED]: {
    // Final state - no transitions
  },
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(
  currentState: ResourceLifecycleState,
  event: ResourceLifecycleEvent
): boolean {
  const transitions = LIFECYCLE_TRANSITIONS[currentState];
  return event in transitions;
}

/**
 * Get the target state for a transition
 */
export function getNextState(
  currentState: ResourceLifecycleState,
  event: ResourceLifecycleEvent
): ResourceLifecycleState | null {
  const transitions = LIFECYCLE_TRANSITIONS[currentState];
  return transitions[event] ?? null;
}

/**
 * Get all valid events from a state
 */
export function getValidEvents(
  state: ResourceLifecycleState
): ResourceLifecycleEvent[] {
  const transitions = LIFECYCLE_TRANSITIONS[state];
  return Object.keys(transitions) as ResourceLifecycleEvent[];
}

// =============================================================================
// State Predicates
// =============================================================================

/**
 * States where the resource is considered "active" on the router
 */
export const ACTIVE_STATES: ResourceLifecycleState[] = [
  ResourceLifecycleState.ACTIVE,
  ResourceLifecycleState.DEGRADED,
];

/**
 * States where the resource can be edited
 */
export const EDITABLE_STATES: ResourceLifecycleState[] = [
  ResourceLifecycleState.DRAFT,
  ResourceLifecycleState.VALID,
  ResourceLifecycleState.ACTIVE,
  ResourceLifecycleState.ERROR,
];

/**
 * States where the resource is in a "pending" operation
 */
export const PENDING_STATES: ResourceLifecycleState[] = [
  ResourceLifecycleState.VALIDATING,
  ResourceLifecycleState.APPLYING,
];

/**
 * States where the resource has issues
 */
export const ERROR_STATES: ResourceLifecycleState[] = [
  ResourceLifecycleState.ERROR,
  ResourceLifecycleState.DEGRADED,
];

/**
 * Terminal states (no more transitions possible or only to archived)
 */
export const TERMINAL_STATES: ResourceLifecycleState[] = [
  ResourceLifecycleState.ARCHIVED,
];

/**
 * Check if resource is active on router
 */
export function isActiveOnRouter(state: ResourceLifecycleState): boolean {
  return ACTIVE_STATES.includes(state);
}

/**
 * Check if resource can be edited
 */
export function isEditable(state: ResourceLifecycleState): boolean {
  return EDITABLE_STATES.includes(state);
}

/**
 * Check if resource is in a pending operation
 */
export function isPending(state: ResourceLifecycleState): boolean {
  return PENDING_STATES.includes(state);
}

/**
 * Check if resource has errors
 */
export function hasErrors(state: ResourceLifecycleState): boolean {
  return ERROR_STATES.includes(state);
}

/**
 * Check if resource is in a terminal state
 */
export function isTerminal(state: ResourceLifecycleState): boolean {
  return TERMINAL_STATES.includes(state);
}

// =============================================================================
// State Display Helpers
// =============================================================================

/**
 * State display info for UI
 */
export interface StateDisplayInfo {
  /** Display label */
  label: string;
  /** Description */
  description: string;
  /** Color for status indicators */
  color: 'gray' | 'blue' | 'green' | 'amber' | 'red';
  /** Icon name hint */
  icon: 'draft' | 'spinner' | 'check' | 'warning' | 'error' | 'archive';
  /** Whether to show a spinner */
  showSpinner: boolean;
}

/**
 * Get display info for a lifecycle state
 */
export function getStateDisplayInfo(
  state: ResourceLifecycleState
): StateDisplayInfo {
  switch (state) {
    case ResourceLifecycleState.DRAFT:
      return {
        label: 'Draft',
        description: 'Not yet validated',
        color: 'gray',
        icon: 'draft',
        showSpinner: false,
      };
    case ResourceLifecycleState.VALIDATING:
      return {
        label: 'Validating',
        description: 'Checking configuration...',
        color: 'blue',
        icon: 'spinner',
        showSpinner: true,
      };
    case ResourceLifecycleState.VALID:
      return {
        label: 'Valid',
        description: 'Ready to apply',
        color: 'green',
        icon: 'check',
        showSpinner: false,
      };
    case ResourceLifecycleState.APPLYING:
      return {
        label: 'Applying',
        description: 'Applying to router...',
        color: 'amber',
        icon: 'spinner',
        showSpinner: true,
      };
    case ResourceLifecycleState.ACTIVE:
      return {
        label: 'Active',
        description: 'Running on router',
        color: 'green',
        icon: 'check',
        showSpinner: false,
      };
    case ResourceLifecycleState.DEGRADED:
      return {
        label: 'Degraded',
        description: 'Running with issues',
        color: 'amber',
        icon: 'warning',
        showSpinner: false,
      };
    case ResourceLifecycleState.ERROR:
      return {
        label: 'Error',
        description: 'Failed',
        color: 'red',
        icon: 'error',
        showSpinner: false,
      };
    case ResourceLifecycleState.DEPRECATED:
      return {
        label: 'Deprecated',
        description: 'Marked for removal',
        color: 'gray',
        icon: 'warning',
        showSpinner: false,
      };
    case ResourceLifecycleState.ARCHIVED:
      return {
        label: 'Archived',
        description: 'No longer active',
        color: 'gray',
        icon: 'archive',
        showSpinner: false,
      };
    default:
      return {
        label: 'Unknown',
        description: 'Unknown state',
        color: 'gray',
        icon: 'draft',
        showSpinner: false,
      };
  }
}
