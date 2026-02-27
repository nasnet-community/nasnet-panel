/**
 * MiniStepper - Mobile Pattern
 *
 * Mobile-optimized stepper with swipe navigation and full-screen content.
 * Maximizes content space with compact header and bottom navigation.
 *
 * This component follows the Headless + Platform Presenter pattern (ADR-018):
 * - All logic comes from the useStepper hook
 * - This presenter provides mobile-optimized touch-friendly rendering
 *
 * @see NAS-4A.18: Build Mini Stepper (Mobile Pattern)
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
 *   <MiniStepper stepper={stepper} stepContent={<CurrentStepForm />} />
 * );
 * ```
 */

import * as React from 'react';
import { useRef, useCallback, useState } from 'react';

import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button, Progress, cn, useReducedMotion } from '@nasnet/ui/primitives';

import type { MiniStepperProps } from './mini-stepper.types';

// ===== Constants =====

/** Swipe threshold in pixels to trigger navigation */
const SWIPE_THRESHOLD = 100;

/** Elastic feedback strength (0 = no elastic, 1 = full elastic) */
const DRAG_ELASTIC = 0.2;

/** Transition duration in seconds */
const TRANSITION_DURATION = 0.2;

// ===== Localization Constants =====
// Structured for easy future i18n adoption

const STRINGS = {
  back: 'Back',
  next: 'Next',
  finish: 'Finish',
  stepIndicator: (current: number, total: number) => `Step ${current}/${total}`,
  swipeHint: 'Swipe left/right to navigate',
  progress: (percent: number) => `Progress: ${percent}%`,
  previousStep: 'Go to previous step',
  nextStep: 'Go to next step',
  finishWizard: 'Finish wizard',
} as const;

// ===== Live Region Component =====

/**
 * Live region for announcing step changes to screen readers
 */
function StepAnnouncer({
  currentIndex,
  totalSteps,
  stepTitle,
}: {
  currentIndex: number;
  totalSteps: number;
  stepTitle: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {`${STRINGS.stepIndicator(currentIndex + 1, totalSteps)}: ${stepTitle}`}
    </div>
  );
}

// ===== Main Component =====

/**
 * Mini Stepper component for mobile devices
 *
 * Features:
 * - Compact header with progress bar (≤64px)
 * - Swipe navigation with elastic feedback
 * - Full-screen step content area
 * - Bottom navigation with safe area support
 * - Reduced motion support for accessibility
 *
 * @param props - MiniStepper props
 * @returns MiniStepper element
 */
function MiniStepperComponent({
  stepper,
  stepContent,
  className,
  onStepChange,
  disableSwipe = false,
  'aria-label': ariaLabel = 'Wizard navigation',
}: MiniStepperProps) {
  const prefersReducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Extract stepper state
  const { steps, currentIndex, currentStep, prev, next, isFirst, isLast, progress, isValidating } =
    stepper;

  // Animation variants based on reduced motion preference
  const variants =
    prefersReducedMotion ?
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { x: 50, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -50, opacity: 0 },
      };

  // Handle swipe navigation
  const handleDragEnd = useCallback(
    async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Prevent navigation if already navigating or validation in progress
      if (isNavigating || isValidating) return;

      // Swipe right (previous) - positive offset
      if (info.offset.x > SWIPE_THRESHOLD && !isFirst) {
        prev();
        if (onStepChange) {
          onStepChange(steps[currentIndex - 1], currentIndex - 1);
        }
        return;
      }

      // Swipe left (next) - negative offset
      if (info.offset.x < -SWIPE_THRESHOLD && !isLast) {
        setIsNavigating(true);
        const success = await next();
        setIsNavigating(false);

        if (success && onStepChange) {
          onStepChange(steps[currentIndex + 1], currentIndex + 1);
        }
      }
    },
    [isNavigating, isValidating, isFirst, isLast, prev, next, onStepChange, steps, currentIndex]
  );

  // Handle Next button click with async validation
  const handleNext = useCallback(async () => {
    if (isNavigating || isValidating) return;

    setIsNavigating(true);
    const success = await next();
    setIsNavigating(false);

    if (success && onStepChange) {
      // On last step, callback with current step (completion)
      if (isLast) {
        onStepChange(currentStep, currentIndex);
      } else {
        onStepChange(steps[currentIndex + 1], currentIndex + 1);
      }
    }
  }, [isNavigating, isValidating, next, onStepChange, isLast, currentStep, currentIndex, steps]);

  // Handle Back button click
  const handleBack = useCallback(() => {
    if (isFirst) return;
    prev();
    if (onStepChange) {
      onStepChange(steps[currentIndex - 1], currentIndex - 1);
    }
  }, [isFirst, prev, onStepChange, steps, currentIndex]);

  // Focus management on step change
  React.useEffect(() => {
    // Focus the content area when step changes for keyboard users
    contentRef.current?.focus();
  }, [currentIndex]);

  const isLoading = isNavigating || isValidating;

  return (
    <div
      className={cn('bg-background flex h-full flex-col', className)}
      aria-label={ariaLabel}
    >
      {/* Accessibility: Live region for step announcements */}
      <StepAnnouncer
        currentIndex={currentIndex}
        totalSteps={steps.length}
        stepTitle={currentStep.title}
      />

      {/* Compact header - max 64px height */}
      <header className="border-border max-h-16 border-b p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {STRINGS.stepIndicator(currentIndex + 1, steps.length)}
          </span>
          <span className="ml-2 truncate text-sm font-medium">{currentStep.title}</span>
        </div>
        <Progress
          value={progress}
          className="h-1"
          aria-label={STRINGS.progress(progress)}
        />
      </header>

      {/* Swipeable content area - fills remaining viewport */}
      <div
        className="relative flex-1 overflow-hidden"
        role="region"
        aria-label="Step content"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            ref={contentRef}
            tabIndex={-1}
            className="h-full overflow-y-auto p-4 outline-none"
            // Animation props
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              duration: prefersReducedMotion ? 0 : TRANSITION_DURATION,
            }}
            // Drag/swipe props
            drag={disableSwipe ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={DRAG_ELASTIC}
            onDragEnd={handleDragEnd}
            // Ensure content padding for touch interactions
            style={{ touchAction: disableSwipe ? 'auto' : 'pan-y' }}
          >
            {stepContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation bar with safe area support */}
      <footer className="border-border bg-background safe-bottom border-t p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="min-h-[44px] flex-1"
            onClick={handleBack}
            disabled={isFirst || isLoading}
            aria-label={STRINGS.previousStep}
          >
            <ChevronLeft
              className="mr-2 h-4 w-4"
              aria-hidden="true"
            />
            {STRINGS.back}
          </Button>
          <Button
            className="min-h-[44px] flex-1"
            onClick={handleNext}
            disabled={isLoading}
            aria-label={isLast ? STRINGS.finishWizard : STRINGS.nextStep}
          >
            {isLast ? STRINGS.finish : STRINGS.next}
            {!isLast && (
              <ChevronRight
                className="ml-2 h-4 w-4"
                aria-hidden="true"
              />
            )}
          </Button>
        </div>

        {/* Navigation hint */}
        {!disableSwipe && (
          <p className="text-muted-foreground mt-2 text-center text-xs">{STRINGS.swipeHint}</p>
        )}
      </footer>
    </div>
  );
}

MiniStepperComponent.displayName = 'MiniStepper';

/**
 * Memoized MiniStepper to prevent unnecessary re-renders
 */
export const MiniStepper = React.memo(MiniStepperComponent);

MiniStepper.displayName = 'MiniStepper';
