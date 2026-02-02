/**
 * Stepper Hooks
 *
 * Headless hooks for stepper UI components.
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 */

// Main stepper hook
export { useStepper } from './use-stepper';

// Keyboard navigation hook
export { useStepperKeyboard } from './use-stepper-keyboard';

// ARIA helpers
export {
  getStepperAriaProps,
  getStepAriaProps,
  getStepPanelAriaProps,
} from './use-stepper-aria';

// Types
export type {
  // Step configuration
  StepConfig,
  StepperConfig,
  StepState,
  StepStatus,
  // Validation
  StepErrors,
  ValidationResult,
  // Hook return type
  UseStepperReturn,
  // Keyboard hook
  UseStepperKeyboardOptions,
  // ARIA helpers
  StepperAriaProps,
  StepAriaProps,
  StepPanelAriaProps,
} from './use-stepper.types';
