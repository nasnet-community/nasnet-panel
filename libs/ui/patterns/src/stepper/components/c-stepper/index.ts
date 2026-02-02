/**
 * CStepper - Content Stepper (Desktop with Preview)
 *
 * Three-column desktop wizard layout with vertical sidebar, content area, and preview panel.
 *
 * @see NAS-4A.17: Build Content Stepper (Desktop with Preview)
 * @see ADR-017: Three-Layer Component Architecture
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * import { useStepper, CStepper, CStepperPreview } from '@nasnet/ui/patterns';
 *
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration' },
 *     { id: 'lan', title: 'LAN Setup' },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: (data) => console.log('Complete!', data),
 * });
 *
 * return (
 *   <CStepper
 *     stepper={stepper}
 *     stepContent={<StepContent />}
 *     previewContent={<ConfigPreview />}
 *   />
 * );
 * ```
 */

// ===== Components =====

export { CStepper } from './c-stepper';
export { CStepperPreview } from './c-stepper-preview';

// ===== Types =====

export type {
  CStepperProps,
  CStepperPreviewProps,
  CStepperContentProps,
  StepperNavigationProps,
  PreviewToggleButtonProps,
  CStepperKeyboardShortcuts,
} from './c-stepper.types';

export { DEFAULT_KEYBOARD_SHORTCUTS } from './c-stepper.types';
