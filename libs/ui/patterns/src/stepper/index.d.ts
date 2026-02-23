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
export { useStepper } from './hooks/use-stepper';
export { useStepperKeyboard, getStepperKeyboardHints } from './hooks/use-stepper-keyboard';
export { StepperProvider, useStepperContext, useOptionalStepperContext, } from './stepper-context';
export type { StepperProviderProps } from './stepper-context';
export { getStepperAriaProps, getStepAriaProps, getStepPanelAriaProps, getStepAccessibleLabel, getStepChangeAnnouncement, getNavigationButtonAriaProps, } from './hooks/use-stepper-aria';
export { VStepper, VStepperItem, VStepperConnector } from './components/v-stepper';
export type { VStepperProps, VStepperItemProps, VStepperConnectorProps, } from './components/v-stepper';
export { HStepper, HStepperProgress, HStepperItem } from './components/h-stepper';
export type { HStepperProps, HStepperProgressProps, HStepperItemProps, } from './components/h-stepper';
export { CStepper, CStepperPreview } from './components/c-stepper';
export type { CStepperProps, CStepperPreviewProps, CStepperContentProps, StepperNavigationProps, PreviewToggleButtonProps, CStepperKeyboardShortcuts, } from './components/c-stepper';
export { DEFAULT_KEYBOARD_SHORTCUTS } from './components/c-stepper';
export { MiniStepper } from './components/mini-stepper';
export type { MiniStepperProps, MiniStepperHeaderProps, MiniStepperFooterProps, } from './components/mini-stepper';
export type { StepConfig, StepperConfig, StepState, StepStatus, StepErrors, ValidationResult, UseStepperReturn, UseStepperKeyboardOptions, StepperAriaProps, StepAriaProps, StepPanelAriaProps, } from './hooks/use-stepper.types';
//# sourceMappingURL=index.d.ts.map