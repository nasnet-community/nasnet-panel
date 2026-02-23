/**
 * HStepper - Horizontal Stepper (Header Pattern)
 *
 * Tablet-optimized horizontal stepper for header navigation.
 * Shows step progress horizontally with a gradient progress line.
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides tablet-optimized horizontal rendering
 *
 * Uses CSS transitions (not Framer Motion) to match Qwik implementation
 * and reduce bundle size.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
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
 *   <div>
 *     <HStepper stepper={stepper} />
 *     <main className="pt-4">
 *       <StepContent />
 *     </main>
 *   </div>
 * );
 * ```
 */

import * as React from 'react';

import { ChevronLeft, Menu } from 'lucide-react';

import { cn } from '@nasnet/ui/primitives';

import { HStepperItem } from './h-stepper-item';
import { HStepperProgress } from './h-stepper-progress';

import type { HStepperProps } from './h-stepper.types';

// ===== Live Region Component =====

/**
 * Live region for announcing step changes to screen readers
 */
function StepAnnouncer({
  currentIndex,
  totalSteps,
  stepTitle,
  hasErrors,
}: {
  currentIndex: number;
  totalSteps: number;
  stepTitle: string;
  hasErrors: boolean;
}) {
  const message = hasErrors
    ? `Step ${currentIndex + 1} of ${totalSteps}: ${stepTitle}. This step has validation errors.`
    : `Step ${currentIndex + 1} of ${totalSteps}: ${stepTitle}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// ===== Main Component =====

/**
 * Horizontal Stepper component for tablet header navigation
 *
 * Features:
 * - Responsive sticky header
 * - Progress bar with gradient fill
 * - Step indicators with status
 * - Navigation buttons and menu
 * - Full keyboard navigation support
 * - Accessibility live region for step announcements
 *
 * @param props - HStepper props
 * @returns HStepper element
 */
function HStepperComponent({
  stepper,
  className,
  sticky = true,
  stickyOffset = '0',
  showTitles = true,
  useIcons = true,
  showBackButton = true,
  allowSkipSteps = false,
  onMenuClick,
  'aria-label': ariaLabel = 'Wizard progress',
}: HStepperProps) {
  // Extract stepper state
  const {
    currentIndex,
    steps,
    goTo,
    prev,
    isFirst,
    completedSteps,
    stepStates,
    stepsWithErrors,
    totalSteps,
  } = stepper;

  // Get current step info
  const currentStep = steps[currentIndex];

  // Check if current step has errors
  const currentStepHasErrors = React.useMemo(() => {
    const state = stepStates.get(currentStep.id);
    return state?.errors ? Object.keys(state.errors).length > 0 : false;
  }, [stepStates, currentStep.id]);

  // Handle step click navigation
  const handleStepClick = React.useCallback(
    (index: number) => {
      // Only allow clicking on completed steps (or any if allowSkipSteps)
      const step = steps[index];
      const isCompleted = completedSteps.has(step.id);
      const canNavigate = isCompleted || allowSkipSteps;

      if (canNavigate && index !== currentIndex) {
        goTo(index);
      }
    },
    [steps, completedSteps, allowSkipSteps, currentIndex, goTo]
  );

  return (
    <>
      {/* Accessibility: Live region for step announcements */}
      <StepAnnouncer
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        stepTitle={currentStep.title}
        hasErrors={currentStepHasErrors}
      />

      {/* Main header */}
      <header
        className={cn(
          // Base styles
          'w-full border-b',
          // Glass effect with backdrop blur
          'bg-background/80 backdrop-blur-md',
          // Sticky positioning
          sticky && 'sticky z-40',
          className
        )}
        style={sticky ? { top: stickyOffset } : undefined}
      >
        <nav
          aria-label={ariaLabel}
          className="container mx-auto py-3"
        >
          {/* Header row: Back button + Step label + Menu button */}
          <div className="flex items-center gap-2 px-4 mb-3">
            {/* Back button */}
            {showBackButton && !isFirst && (
              <button
                type="button"
                onClick={prev}
                className={cn(
                  'p-2 rounded-md',
                  'hover:bg-muted',
                  'transition-colors duration-200',
                  'motion-reduce:transition-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
                aria-label="Go to previous step"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Spacer when no back button */}
            {(!showBackButton || isFirst) && <div className="w-9" />}

            {/* Step label: "Step X of Y: Title" */}
            <span className="text-sm font-medium flex-1 truncate">
              Step {currentIndex + 1} of {totalSteps}: {currentStep.title}
            </span>

            {/* Optional menu button */}
            {onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                className={cn(
                  'p-2 rounded-md',
                  'hover:bg-muted',
                  'transition-colors duration-200',
                  'motion-reduce:transition-none',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
                aria-label="Open step menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Progress line */}
          <HStepperProgress
            steps={steps}
            activeStep={currentIndex}
            completedSteps={completedSteps}
            stepsWithErrors={stepsWithErrors}
          />

          {/* Step indicators */}
          <ol
            className="relative flex justify-between px-4 pt-2"
          >
            {steps.map((step, index) => {
              const stepState = stepStates.get(step.id);
              const isActive = index === currentIndex;
              const isCompleted = completedSteps.has(step.id);
              const hasError = stepState?.errors
                ? Object.keys(stepState.errors).length > 0
                : false;

              // Determine if step is clickable
              // Can click: completed steps, or any step if allowSkipSteps
              // Cannot click: current step, future steps (unless allowSkipSteps)
              const isClickable =
                (isCompleted || (allowSkipSteps && !isActive)) &&
                index !== currentIndex;

              return (
                <li key={step.id}>
                  <HStepperItem
                    step={step}
                    index={index}
                    isActive={isActive}
                    isCompleted={isCompleted}
                    hasError={hasError}
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    showTitle={showTitles}
                    useIcon={useIcons}
                  />
                </li>
              );
            })}
          </ol>
        </nav>
      </header>
    </>
  );
}

HStepperComponent.displayName = 'HStepper';

/**
 * Memoized HStepper to prevent unnecessary re-renders
 */
export const HStepper = React.memo(HStepperComponent);

HStepper.displayName = 'HStepper';
