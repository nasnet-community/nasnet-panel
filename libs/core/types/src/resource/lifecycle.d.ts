/**
 * Universal State v2 Lifecycle Types
 *
 * Types for resource lifecycle state management.
 * Reference: ADR-012 - Universal State v2
 */
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
export declare const ResourceLifecycleState: {
  /** Initial creation, not yet validated */
  readonly DRAFT: 'DRAFT';
  /** Backend validation in progress */
  readonly VALIDATING: 'VALIDATING';
  /** Passed validation, ready to apply */
  readonly VALID: 'VALID';
  /** Being applied to router */
  readonly APPLYING: 'APPLYING';
  /** Successfully applied and running */
  readonly ACTIVE: 'ACTIVE';
  /** Running but with issues */
  readonly DEGRADED: 'DEGRADED';
  /** Failed state (validation or apply) */
  readonly ERROR: 'ERROR';
  /** Marked for removal */
  readonly DEPRECATED: 'DEPRECATED';
  /** Final state, no longer active */
  readonly ARCHIVED: 'ARCHIVED';
};
/** Inferred type for resource lifecycle states */
export type ResourceLifecycleState =
  (typeof ResourceLifecycleState)[keyof typeof ResourceLifecycleState];
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
export declare const ResourceLifecycleEvent: {
  /** Start validation process */
  readonly VALIDATE: 'VALIDATE';
  /** Apply resource to router */
  readonly APPLY: 'APPLY';
  /** Confirm apply succeeded */
  readonly CONFIRM: 'CONFIRM';
  /** Resource has degraded */
  readonly DEGRADE: 'DEGRADE';
  /** Resource recovered from degraded */
  readonly RECOVER: 'RECOVER';
  /** Retry failed operation */
  readonly RETRY: 'RETRY';
  /** Edit resource (go back to draft) */
  readonly EDIT: 'EDIT';
  /** Deprecate resource */
  readonly DEPRECATE: 'DEPRECATE';
  /** Restore deprecated resource */
  readonly RESTORE: 'RESTORE';
  /** Archive resource permanently */
  readonly ARCHIVE: 'ARCHIVE';
};
/** Inferred type for resource lifecycle events */
export type ResourceLifecycleEvent =
  (typeof ResourceLifecycleEvent)[keyof typeof ResourceLifecycleEvent];
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
export declare const LIFECYCLE_TRANSITIONS: Record<
  ResourceLifecycleState,
  Partial<Record<ResourceLifecycleEvent, ResourceLifecycleState>>
>;
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
export declare function isValidTransition(
  currentState: ResourceLifecycleState,
  event: ResourceLifecycleEvent
): boolean;
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
export declare function getNextState(
  currentState: ResourceLifecycleState,
  event: ResourceLifecycleEvent
): ResourceLifecycleState | null;
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
export declare function getValidEvents(state: ResourceLifecycleState): ResourceLifecycleEvent[];
/**
 * States where the resource is considered "active" on the router.
 *
 * Used to determine if a resource is operational and consuming resources.
 *
 * @constant
 * @see isActiveOnRouter for usage
 */
export declare const ACTIVE_STATES: readonly ResourceLifecycleState[];
/**
 * States where the resource can be edited by the user.
 *
 * Used to control when a resource's configuration can be modified.
 *
 * @constant
 * @see isEditable for usage
 */
export declare const EDITABLE_STATES: readonly ResourceLifecycleState[];
/**
 * States where the resource is in a "pending" operation.
 *
 * Used to show loading indicators and prevent concurrent operations.
 *
 * @constant
 * @see isPending for usage
 */
export declare const PENDING_STATES: readonly ResourceLifecycleState[];
/**
 * States where the resource has issues or errors.
 *
 * Used to highlight problematic resources in UI and require user attention.
 *
 * @constant
 * @see hasErrors for usage
 */
export declare const ERROR_STATES: readonly ResourceLifecycleState[];
/**
 * Terminal states with no further transitions possible.
 *
 * Used to prevent operations on archived resources.
 *
 * @constant
 * @see isTerminal for usage
 */
export declare const TERMINAL_STATES: readonly ResourceLifecycleState[];
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
export declare function isActiveOnRouter(state: ResourceLifecycleState): boolean;
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
export declare function isEditable(state: ResourceLifecycleState): boolean;
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
export declare function isPending(state: ResourceLifecycleState): boolean;
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
export declare function hasErrors(state: ResourceLifecycleState): boolean;
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
export declare function isTerminal(state: ResourceLifecycleState): boolean;
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
export declare function getStateDisplayInfo(state: ResourceLifecycleState): StateDisplayInfo;
//# sourceMappingURL=lifecycle.d.ts.map
