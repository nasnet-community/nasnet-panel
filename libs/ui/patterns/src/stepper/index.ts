/**
 * Stepper System
 *
 * Headless stepper hook and utilities for step-based UIs.
 * Consumed by stepper UI variants (Vertical, Horizontal, Content, Mini).
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * import {
 *   useStepper,
 *   useStepperKeyboard,
 *   StepperProvider,
 *   getStepperAriaProps,
 *   type StepConfig,
 * } from '@nasnet/ui/patterns';
 *
 * const steps: StepConfig[] = [
 *   { id: 'wan', title: 'WAN Configuration', validate: validateWan },
 *   { id: 'lan', title: 'LAN Setup', validate: validateLan },
 *   { id: 'review', title: 'Review' },
 * ];
 *
 * function SetupWizard() {
 *   const stepper = useStepper({
 *     steps,
 *     onComplete: (data) => console.log('Complete!', data),
 *   });
 *
 *   return (
 *     <StepperProvider stepper={stepper}>
 *       <StepList />
 *       <StepContent />
 *       <Navigation />
 *     </StepperProvider>
 *   );
 * }
 * ```
 */

// ===== Hooks =====

export { useStepper } from './hooks/use-stepper';
export { useStepperKeyboard, getStepperKeyboardHints } from './hooks/use-stepper-keyboard';

// ===== Context =====

export {
  StepperProvider,
  useStepperContext,
  useOptionalStepperContext,
} from './stepper-context';
export type { StepperProviderProps } from './stepper-context';

// ===== ARIA Helpers =====

export {
  getStepperAriaProps,
  getStepAriaProps,
  getStepPanelAriaProps,
  getStepAccessibleLabel,
  getStepChangeAnnouncement,
  getNavigationButtonAriaProps,
} from './hooks/use-stepper-aria';

// ===== Stepper UI Components =====

// VStepper - Vertical Stepper (Sidebar Pattern) - NAS-4A.15
export { VStepper, VStepperItem, VStepperConnector } from './components/v-stepper';
export type {
  VStepperProps,
  VStepperItemProps,
  VStepperConnectorProps,
} from './components/v-stepper';

// HStepper - Horizontal Stepper (Header Pattern) - NAS-4A.16
export { HStepper, HStepperProgress, HStepperItem } from './components/h-stepper';
export type {
  HStepperProps,
  HStepperProgressProps,
  HStepperItemProps,
} from './components/h-stepper';

// CStepper - Content Stepper (Desktop with Preview) - NAS-4A.17
export { CStepper, CStepperPreview } from './components/c-stepper';
export type {
  CStepperProps,
  CStepperPreviewProps,
  CStepperContentProps,
  StepperNavigationProps,
  PreviewToggleButtonProps,
  CStepperKeyboardShortcuts,
} from './components/c-stepper';
export { DEFAULT_KEYBOARD_SHORTCUTS } from './components/c-stepper';

// MiniStepper - Mini Stepper (Mobile Pattern) - NAS-4A.18
export { MiniStepper } from './components/mini-stepper';
export type {
  MiniStepperProps,
  MiniStepperHeaderProps,
  MiniStepperFooterProps,
} from './components/mini-stepper';

// ===== Types =====

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
} from './hooks/use-stepper.types';
