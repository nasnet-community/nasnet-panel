/**
 * VStepper - Vertical Stepper (Sidebar Pattern)
 *
 * Desktop-optimized vertical stepper for sidebar navigation.
 * Shows all steps listed vertically with progress indicators.
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides desktop-optimized vertical rendering
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration', description: 'Configure WAN' },
 *     { id: 'lan', title: 'LAN Setup', description: 'Set up LAN' },
 *     { id: 'review', title: 'Review', description: 'Confirm settings' },
 *   ],
 *   onComplete: (data) => console.log('Complete!', data),
 * });
 *
 * return (
 *   <div className="flex">
 *     <VStepper stepper={stepper} />
 *     <div className="flex-1">
 *       <StepContent />
 *     </div>
 *   </div>
 * );
 * ```
 */

import * as React from 'react';
import { useRef, useId } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { cn , useReducedMotion } from '@nasnet/ui/primitives';

import { VStepperConnector } from './v-stepper-connector';
import { VStepperItem } from './v-stepper-item';

import type { VStepperProps } from './v-stepper.types';

// ===== Live Region Component =====

/**
 * Live region for announcing step changes to screen readers
 */
function StepAnnouncer({
  currentIndex,
  totalSteps,
  stepTitle,
  hasErrors,
  errorCount,
}: {
  currentIndex: number;
  totalSteps: number;
  stepTitle: string;
  hasErrors: boolean;
  errorCount: number;
}) {
  const message = hasErrors
    ? `Step ${currentIndex + 1} of ${totalSteps}: ${stepTitle}. ${errorCount} validation error${errorCount !== 1 ? 's' : ''}.`
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
 * Vertical Stepper component for desktop sidebar navigation
 *
 * @param props - VStepper props
 * @returns VStepper element
 */
export function VStepper({
  stepper,
  className,
  width = '256px',
  showDescriptions = true,
  showErrorCount = false,
  'aria-label': ariaLabel = 'Wizard steps',
}: VStepperProps) {
  const prefersReducedMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const stepperId = useId();

  // Extract stepper state
  const {
    steps,
    currentIndex,
    completedSteps,
    stepStates,
    goTo,
    totalSteps,
  } = stepper;

  // Get current step for announcements
  const currentStep = steps[currentIndex];

  // Get current step errors for announcement
  const currentStepErrors = React.useMemo(() => {
    const state = stepStates.get(currentStep.id);
    return state?.errors ? Object.values(state.errors) : [];
  }, [stepStates, currentStep.id]);

  // Calculate width style
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <>
      {/* Accessibility: Live region for step announcements */}
      <StepAnnouncer
        currentIndex={currentIndex}
        totalSteps={totalSteps}
        stepTitle={currentStep.title}
        hasErrors={currentStepErrors.length > 0}
        errorCount={currentStepErrors.length}
      />

      {/* Main navigation */}
      <nav
        ref={navRef}
        className={cn('p-4 space-y-1', className)}
        style={{ width: widthStyle }}
        aria-label={ariaLabel}
      >
        <ol className="space-y-1">
          <AnimatePresence initial={false}>
            {steps.map((step, index) => {
              const stepState = stepStates.get(step.id);
              const isActive = index === currentIndex;
              const isCompleted = completedSteps.has(step.id);
              const isSkipped = stepState?.skipped ?? false;
              const hasError = Object.keys(stepState?.errors ?? {}).length > 0;
              const errors = stepState?.errors
                ? Object.values(stepState.errors)
                : [];

              // Determine if step is clickable
              // Can click: completed, skipped, current, or any previous step
              const isClickable =
                isCompleted || isSkipped || isActive || index < currentIndex;

              // Handle step click
              const handleStepClick = () => {
                if (isClickable && !isActive) {
                  goTo(index);
                }
              };

              // Show connector for all steps except the last
              const showConnector = index < steps.length - 1;

              // Determine if connector shows completed state
              const connectorCompleted = isCompleted;

              return (
                <motion.li
                  key={step.id}
                  className="relative"
                  initial={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.1 : 0.2,
                    delay: prefersReducedMotion ? 0 : index * 0.05,
                  }}
                >
                  {/* Connector line to next step */}
                  {showConnector && (
                    <VStepperConnector
                      isCompleted={connectorCompleted}
                      animated={!prefersReducedMotion}
                    />
                  )}

                  {/* Step item */}
                  <VStepperItem
                    step={step}
                    index={index}
                    isActive={isActive}
                    isCompleted={isCompleted}
                    hasError={hasError}
                    errors={errors}
                    isClickable={isClickable}
                    onClick={handleStepClick}
                    showDescription={showDescriptions}
                    showErrorCount={showErrorCount}
                  />
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      </nav>
    </>
  );
}

VStepper.displayName = 'VStepper';
