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
 * Resource lifecycle states for the state machine.
 *
 * Represents all possible states a resource can be in, from creation
 * through validation, deployment, operation, deprecation, and archival.
 *
 * @constant
 * @see ResourceLifecycleEvent for triggering transitions
 * @see LIFECYCLE_TRANSITIONS for valid state transitions
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

/** Inferred type for resource lifecycle states */
export type ResourceLifecycleState =
  (typeof ResourceLifecycleState)[keyof typeof ResourceLifecycleState];

// =============================================================================
// Lifecycle Events
// =============================================================================

/**
 * Events that trigger resource lifecycle state transitions.
 *
 * Events are dispatched in response to user actions, validation results,
 * operational changes, or system events.
 *
 * @constant
 * @see ResourceLifecycleState for target states
 * @see LIFECYCLE_TRANSITIONS for valid transitions
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

/** Inferred type for resource lifecycle events */
export type ResourceLifecycleEvent =
  (typeof ResourceLifecycleEvent)[keyof typeof ResourceLifecycleEvent];

// =============================================================================
// State Transition Utilities
// =============================================================================

/**
 * State transition table defining valid lifecycle state transitions.
 *
 * Maps each state to the events that can be triggered from that state
 * and their target states. Enforces the state machine invariants.
 *
 * @constant
 * @see isValidTransition for validation helper
 * @see getNextState for transition lookup
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
 * Check if a state transition is valid.
 *
 * @param currentState Current lifecycle state
 * @param event Event to trigger
 * @returns true if the event is allowed from the current state
 *
 * @example
 * ```ts
 * if (isValidTransition(state, ResourceLifecycleEvent.APPLY)) {
 *   // Safe to apply resource
 * }
 * ```
 *
 * @see LIFECYCLE_TRANSITIONS for the transition table
 * @see getNextState to get the target state
 */
export function isValidTransition(
  currentState: ResourceLifecycleState,
  event: ResourceLifecycleEvent
): boolean {
  const transitions = LIFECYCLE_TRANSITIONS[currentState];
  return event in transitions;
}

/**
 * Get the target state for a state transition.
 *
 * @param currentState Current lifecycle state
 * @param event Event to trigger
 * @returns Target state if the transition is valid, null otherwise
 *
 * @example
 * ```ts
 * const nextState = getNextState(ResourceLifecycleState.DRAFT, ResourceLifecycleEvent.VALIDATE);
 * // nextState === ResourceLifecycleState.VALIDATING
 * ```
 *
 * @see LIFECYCLE_TRANSITIONS for the transition table
 * @see isValidTransition to check before calling
 */
export function getNextState(
  currentState: ResourceLifecycleState,
  event: ResourceLifecycleEvent
): ResourceLifecycleState | null {
  const transitions = LIFECYCLE_TRANSITIONS[currentState];
  return transitions[event] ?? null;
}

/**
 * Get all valid events that can be triggered from a state.
 *
 * @param state Lifecycle state
 * @returns Array of valid events from this state
 *
 * @example
 * ```ts
 * const validEvents = getValidEvents(ResourceLifecycleState.VALID);
 * // [ResourceLifecycleEvent.APPLY, ResourceLifecycleEvent.EDIT]
 * ```
 *
 * @see LIFECYCLE_TRANSITIONS for the transition table
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
 * States where the resource is considered "active" on the router.
 *
 * Used to determine if a resource is operational and consuming resources.
 *
 * @constant
 * @see isActiveOnRouter for usage
 */
export const ACTIVE_STATES: readonly ResourceLifecycleState[] = [
  ResourceLifecycleState.ACTIVE,
  ResourceLifecycleState.DEGRADED,
];

/**
 * States where the resource can be edited by the user.
 *
 * Used to control when a resource's configuration can be modified.
 *
 * @constant
 * @see isEditable for usage
 */
export const EDITABLE_STATES: readonly ResourceLifecycleState[] = [
  ResourceLifecycleState.DRAFT,
  ResourceLifecycleState.VALID,
  ResourceLifecycleState.ACTIVE,
  ResourceLifecycleState.ERROR,
];

/**
 * States where the resource is in a "pending" operation.
 *
 * Used to show loading indicators and prevent concurrent operations.
 *
 * @constant
 * @see isPending for usage
 */
export const PENDING_STATES: readonly ResourceLifecycleState[] = [
  ResourceLifecycleState.VALIDATING,
  ResourceLifecycleState.APPLYING,
];

/**
 * States where the resource has issues or errors.
 *
 * Used to highlight problematic resources in UI and require user attention.
 *
 * @constant
 * @see hasErrors for usage
 */
export const ERROR_STATES: readonly ResourceLifecycleState[] = [
  ResourceLifecycleState.ERROR,
  ResourceLifecycleState.DEGRADED,
];

/**
 * Terminal states with no further transitions possible.
 *
 * Used to prevent operations on archived resources.
 *
 * @constant
 * @see isTerminal for usage
 */
export const TERMINAL_STATES: readonly ResourceLifecycleState[] = [
  ResourceLifecycleState.ARCHIVED,
];

/**
 * Check if resource is active and operational on the router.
 *
 * @param state Lifecycle state
 * @returns true if the resource is active or degraded (consuming resources)
 *
 * @example
 * ```ts
 * if (isActiveOnRouter(state)) {
 *   showStopButton();
 * }
 * ```
 *
 * @see ACTIVE_STATES for included states
 */
export function isActiveOnRouter(state: ResourceLifecycleState): boolean {
  return ACTIVE_STATES.includes(state);
}

/**
 * Check if resource configuration can be edited.
 *
 * @param state Lifecycle state
 * @returns true if the resource can be edited
 *
 * @example
 * ```ts
 * if (isEditable(state)) {
 *   enableEditButton();
 * }
 * ```
 *
 * @see EDITABLE_STATES for included states
 */
export function isEditable(state: ResourceLifecycleState): boolean {
  return EDITABLE_STATES.includes(state);
}

/**
 * Check if resource is in a pending operation.
 *
 * @param state Lifecycle state
 * @returns true if the resource is validating or applying
 *
 * @example
 * ```ts
 * if (isPending(state)) {
 *   showLoadingSpinner();
 * }
 * ```
 *
 * @see PENDING_STATES for included states
 */
export function isPending(state: ResourceLifecycleState): boolean {
  return PENDING_STATES.includes(state);
}

/**
 * Check if resource has issues or errors.
 *
 * @param state Lifecycle state
 * @returns true if the resource is in an error or degraded state
 *
 * @example
 * ```ts
 * if (hasErrors(state)) {
 *   highlightInRed();
 * }
 * ```
 *
 * @see ERROR_STATES for included states
 */
export function hasErrors(state: ResourceLifecycleState): boolean {
  return ERROR_STATES.includes(state);
}

/**
 * Check if resource is in a terminal state.
 *
 * @param state Lifecycle state
 * @returns true if the resource cannot transition to other states
 *
 * @example
 * ```ts
 * if (isTerminal(state)) {
 *   disableAllActions();
 * }
 * ```
 *
 * @see TERMINAL_STATES for included states
 */
export function isTerminal(state: ResourceLifecycleState): boolean {
  return TERMINAL_STATES.includes(state);
}

// =============================================================================
// State Display Helpers
// =============================================================================

/**
 * Display information for rendering a lifecycle state in the UI.
 *
 * Provides localized label, description, color, and icon hints
 * for consistent state visualization across the application.
 *
 * @see getStateDisplayInfo for populating this interface
 */
export interface StateDisplayInfo {
  /** Display label */
  readonly label: string;
  /** Description of the state */
  readonly description: string;
  /** Color for status indicators (semantic colors) */
  readonly color: 'gray' | 'blue' | 'green' | 'amber' | 'red';
  /** Icon name hint */
  readonly icon: 'draft' | 'spinner' | 'check' | 'warning' | 'error' | 'archive';
  /** Whether to show a spinner animation */
  readonly showSpinner: boolean;
}

/**
 * Get UI display information for a lifecycle state.
 *
 * @param state Lifecycle state
 * @returns Display information (label, color, icon, spinner flag)
 *
 * @example
 * ```ts
 * const displayInfo = getStateDisplayInfo(ResourceLifecycleState.VALIDATING);
 * return <Badge color={displayInfo.color}>{displayInfo.label}</Badge>;
 * ```
 *
 * @see StateDisplayInfo for the returned interface
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
