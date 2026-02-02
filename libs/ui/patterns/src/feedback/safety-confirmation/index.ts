/**
 * Safety Confirmation Component Module
 *
 * Multi-step confirmation dialog for dangerous/irreversible operations.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */

// Main component (auto-detecting wrapper)
export { SafetyConfirmation } from './safety-confirmation';

// Headless hook (for custom implementations)
export { useSafetyConfirmation } from './use-safety-confirmation';

// Integration hook for configPipelineMachine (Apply-Confirm-Merge pattern)
export { useDangerousOperationConfirmation } from './use-dangerous-operation-confirmation';
export type {
  UseDangerousOperationConfig,
  UseDangerousOperationReturn,
} from './use-dangerous-operation-confirmation';

// Platform-specific presenters (for direct usage if needed)
export { SafetyConfirmationDesktop } from './safety-confirmation-desktop';
export { SafetyConfirmationMobile } from './safety-confirmation-mobile';

// Sub-components (for composition in custom dialogs)
export { SafetyConfirmationHeader } from './safety-confirmation-header';
export { SafetyConfirmationConsequences } from './safety-confirmation-consequences';
export { SafetyConfirmationInput } from './safety-confirmation-input';
export { SafetyConfirmationCountdown } from './safety-confirmation-countdown';

// Types
export type {
  SafetyConfirmationProps,
  SafetyConfirmationPresenterProps,
  SafetyConfirmationHeaderProps,
  SafetyConfirmationConsequencesProps,
  SafetyConfirmationInputProps,
  SafetyConfirmationCountdownProps,
  UseSafetyConfirmationConfig,
  UseSafetyConfirmationReturn,
  UrgencyLevel,
} from './safety-confirmation.types';
