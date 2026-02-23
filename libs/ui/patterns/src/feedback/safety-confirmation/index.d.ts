/**
 * Safety Confirmation Component Module
 *
 * Multi-step confirmation dialog for dangerous/irreversible operations.
 * Implements the Headless + Platform Presenter pattern (ADR-018).
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */
export { SafetyConfirmation } from './safety-confirmation';
export { useSafetyConfirmation } from './use-safety-confirmation';
export { useDangerousOperationConfirmation } from './use-dangerous-operation-confirmation';
export type { UseDangerousOperationConfig, UseDangerousOperationReturn, } from './use-dangerous-operation-confirmation';
export { SafetyConfirmationDesktop } from './safety-confirmation-desktop';
export { SafetyConfirmationMobile } from './safety-confirmation-mobile';
export { SafetyConfirmationHeader } from './safety-confirmation-header';
export { SafetyConfirmationConsequences } from './safety-confirmation-consequences';
export { SafetyConfirmationInput } from './safety-confirmation-input';
export { SafetyConfirmationCountdown } from './safety-confirmation-countdown';
export type { SafetyConfirmationProps, SafetyConfirmationPresenterProps, SafetyConfirmationHeaderProps, SafetyConfirmationConsequencesProps, SafetyConfirmationInputProps, SafetyConfirmationCountdownProps, UseSafetyConfirmationConfig, UseSafetyConfirmationReturn, UrgencyLevel, } from './safety-confirmation.types';
//# sourceMappingURL=index.d.ts.map