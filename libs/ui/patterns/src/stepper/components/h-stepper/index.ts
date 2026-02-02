/**
 * HStepper - Horizontal Stepper (Header Pattern)
 *
 * Tablet-optimized horizontal stepper for header navigation.
 * Shows step progress horizontally with a gradient progress line.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 * @see ADR-018: Headless + Platform Presenters
 */

export { HStepper } from './h-stepper';
export { HStepperProgress } from './h-stepper-progress';
export { HStepperItem } from './h-stepper-item';

export type {
  HStepperProps,
  HStepperProgressProps,
  HStepperItemProps,
} from './h-stepper.types';
