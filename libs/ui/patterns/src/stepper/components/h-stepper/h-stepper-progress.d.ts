/**
 * HStepperProgress
 *
 * Progress line component for the horizontal stepper.
 * Shows completed portion with gradient fill, incomplete with muted color.
 *
 * Uses CSS transitions (not Framer Motion) to match Qwik implementation
 * and reduce bundle size.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 */
import type { HStepperProgressProps } from './h-stepper.types';
/**
 * Progress line for horizontal stepper
 *
 * @param props - Progress props
 * @returns Progress line element
 *
 * @example
 * ```tsx
 * <HStepperProgress
 *   steps={steps}
 *   activeStep={2}
 *   completedSteps={completedSteps}
 * />
 * ```
 */
export declare function HStepperProgress({ steps, activeStep, completedSteps, stepsWithErrors, className, }: HStepperProgressProps): import("react/jsx-runtime").JSX.Element;
export declare namespace HStepperProgress {
    var displayName: string;
}
//# sourceMappingURL=h-stepper-progress.d.ts.map