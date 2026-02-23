import type { TroubleshootContext } from '../types/troubleshoot.types';
/**
 * Factory function to create a troubleshoot machine instance with a specific routerId.
 * Each wizard instance gets its own isolated machine state.
 *
 * State flow:
 * - idle: Waiting to start
 * - initializing: Detecting network configuration (WAN interface, gateway)
 * - runningDiagnostic:
 *   - executingStep: Running a diagnostic test
 *   - stepComplete: Evaluating step result
 *   - awaitingFixDecision: Waiting for user to apply or skip fix
 *   - applyingFix: Executing fix command
 *   - verifyingFix: Re-running diagnostic to verify fix
 *   - nextStep: Moving to next diagnostic
 * - completed: All diagnostics finished
 *
 * Events:
 * - START: Begin diagnostics
 * - APPLY_FIX: Apply the suggested fix
 * - SKIP_FIX: Skip fix and continue
 * - RESTART: Reset to idle
 * - CANCEL: Cancel from any state
 *
 * @param routerId The router UUID to run diagnostics against
 * @returns XState machine configured for troubleshooting
 */
export declare function createTroubleshootMachine(routerId: string): import("xstate").StateMachine<TroubleshootContext, import("xstate").AnyEventObject, Record<string, import("xstate").AnyActorRef>, import("xstate").ProvidedActor, import("xstate").ParameterizedObject, import("xstate").ParameterizedObject, string, import("xstate").StateValue, string, unknown, import("xstate").NonReducibleUnknown, import("xstate").EventObject, import("xstate").MetaObject, any>;
export type TroubleshootMachine = ReturnType<typeof createTroubleshootMachine>;
//# sourceMappingURL=troubleshoot-machine.d.ts.map