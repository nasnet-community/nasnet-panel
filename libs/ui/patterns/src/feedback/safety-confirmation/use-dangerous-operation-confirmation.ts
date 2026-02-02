/**
 * useDangerousOperationConfirmation Hook
 *
 * Integration hook that wraps useSafetyConfirmation and integrates with
 * the configPipelineMachine's 'confirming' state.
 *
 * Sends the 'ACKNOWLEDGED' event when user successfully confirms a dangerous operation.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see ADR-012: Universal State v2 (Apply-Confirm-Merge pattern)
 * @see libs/state/machines/src/configPipelineMachine.ts
 */

import { useCallback, useState } from 'react';

import { useSafetyConfirmation } from './use-safety-confirmation';
import type { UseSafetyConfirmationReturn } from './safety-confirmation.types';

/**
 * Configuration for dangerous operation confirmation
 */
export interface UseDangerousOperationConfig {
  /** Text the user must type exactly to confirm */
  confirmText: string;

  /** Countdown duration in seconds (default: 10) */
  countdownSeconds?: number;

  /** Whether validation is case-sensitive (default: true) */
  caseSensitive?: boolean;

  /**
   * Callback to execute the actual dangerous operation.
   * Called after successful confirmation.
   */
  onExecute: () => Promise<void>;

  /**
   * Optional callback to send events to the state machine.
   * If using XState, this would typically be `send` from useActor.
   *
   * @example With XState
   * ```tsx
   * const [state, send] = useActor(configPipelineMachine);
   * useDangerousOperationConfirmation({
   *   onSendEvent: (event) => send(event),
   *   // ...
   * });
   * ```
   */
  onSendEvent?: (event: { type: string }) => void;

  /**
   * Optional callback when user cancels.
   * If using XState, this should send a 'CANCEL' event.
   */
  onCancel?: () => void;
}

/**
 * Return type for useDangerousOperationConfirmation
 */
export interface UseDangerousOperationReturn {
  /** Whether the confirmation dialog should be shown */
  isOpen: boolean;

  /** Open the confirmation dialog */
  open: () => void;

  /** Close the confirmation dialog */
  close: () => void;

  /** The underlying useSafetyConfirmation hook return for UI binding */
  hook: UseSafetyConfirmationReturn;
}

/**
 * Integration hook for dangerous operation confirmation
 *
 * This hook wraps useSafetyConfirmation and provides integration points
 * for the configPipelineMachine (Apply-Confirm-Merge pattern).
 *
 * Flow:
 * 1. Component calls `open()` to show the confirmation dialog
 * 2. User types confirmation text and waits for countdown
 * 3. User clicks Confirm
 * 4. Hook executes `onExecute` and sends 'ACKNOWLEDGED' event via `onSendEvent`
 * 5. configPipelineMachine proceeds to 'applying' state
 *
 * @example Basic usage with XState configPipelineMachine
 * ```tsx
 * function DangerousButton() {
 *   const [machineState, send] = useActor(configPipelineMachine);
 *
 *   const { isOpen, open, close, hook } = useDangerousOperationConfirmation({
 *     confirmText: 'RESET',
 *     countdownSeconds: 10,
 *     onExecute: async () => {
 *       await resetRouter();
 *     },
 *     onSendEvent: (event) => send(event),
 *     onCancel: () => send({ type: 'CANCEL' }),
 *   });
 *
 *   return (
 *     <>
 *       <Button onClick={open}>Factory Reset</Button>
 *       <SafetyConfirmation
 *         open={isOpen}
 *         onOpenChange={(open) => !open && close()}
 *         title="Factory Reset"
 *         description="This will restore all settings to factory defaults."
 *         consequences={["All config lost", "Router reboots"]}
 *         confirmText="RESET"
 *         hook={hook}
 *         onConfirm={hook.confirm}
 *         onCancel={hook.cancel}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @example Standalone usage (without state machine)
 * ```tsx
 * const { isOpen, open, close, hook } = useDangerousOperationConfirmation({
 *   confirmText: 'DELETE',
 *   onExecute: async () => {
 *     await deleteInterface(interfaceId);
 *   },
 * });
 * ```
 */
export function useDangerousOperationConfirmation(
  config: UseDangerousOperationConfig
): UseDangerousOperationReturn {
  const {
    confirmText,
    countdownSeconds = 10,
    caseSensitive = true,
    onExecute,
    onSendEvent,
    onCancel,
  } = config;

  // Dialog open state
  const [isOpen, setIsOpen] = useState(false);

  // Handle successful confirmation
  const handleConfirm = useCallback(async () => {
    // Execute the dangerous operation
    await onExecute();

    // Send ACKNOWLEDGED event to state machine
    if (onSendEvent) {
      onSendEvent({ type: 'ACKNOWLEDGED' });
    }

    // Close dialog
    setIsOpen(false);
  }, [onExecute, onSendEvent]);

  // Handle cancellation
  const handleCancel = useCallback(() => {
    // Send CANCEL event to state machine if provided
    if (onCancel) {
      onCancel();
    } else if (onSendEvent) {
      onSendEvent({ type: 'CANCEL' });
    }

    // Close dialog
    setIsOpen(false);
  }, [onCancel, onSendEvent]);

  // Initialize the underlying safety confirmation hook
  const hook = useSafetyConfirmation({
    confirmText,
    countdownSeconds,
    caseSensitive,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  });

  // Open/close handlers
  const open = useCallback(() => {
    hook.reset(); // Reset state when opening
    setIsOpen(true);
  }, [hook]);

  const close = useCallback(() => {
    hook.cancel(); // Cancel any in-progress state
    setIsOpen(false);
  }, [hook]);

  return {
    isOpen,
    open,
    close,
    hook,
  };
}
