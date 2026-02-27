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

import * as React from 'react';

import { cn } from '@nasnet/ui/primitives';

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
export function HStepperProgress({
  steps,
  activeStep,
  completedSteps,
  stepsWithErrors = [],
  className,
}: HStepperProgressProps) {
  // Calculate progress percentage
  // Formula: (activeStep / (totalSteps - 1)) * 100
  // Edge cases: single step = 100% if completed, 0 otherwise
  const progressPercentage = React.useMemo(() => {
    if (steps.length <= 1) {
      return completedSteps.size > 0 ? 100 : 0;
    }

    // Find the first step with an error - progress stops there
    const firstErrorIndex = steps.findIndex((step) => stepsWithErrors.includes(step.id));

    // If there's an error before or at current position, cap progress there
    if (firstErrorIndex !== -1 && firstErrorIndex <= activeStep) {
      return (firstErrorIndex / (steps.length - 1)) * 100;
    }

    return (activeStep / (steps.length - 1)) * 100;
  }, [steps, activeStep, completedSteps.size, stepsWithErrors]);

  return (
    <div
      className={cn('relative mx-4 mb-2 h-0.5', className)}
      role="progressbar"
      aria-valuenow={activeStep + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`Step ${activeStep + 1} of ${steps.length}`}
    >
      {/* Background track - border color (pending) */}
      <div
        className="bg-border absolute inset-0 rounded-full"
        aria-hidden="true"
      />

      {/* Progress fill - success color for completed portion */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          'bg-success',
          // CSS transition for smooth width animation (300ms)
          'transition-[width] duration-300 ease-out',
          // Reduced motion support
          'motion-reduce:transition-none'
        )}
        style={{ width: `${progressPercentage}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

HStepperProgress.displayName = 'HStepperProgress';
