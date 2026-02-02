/**
 * useStepperKeyboard - Keyboard Navigation Hook
 *
 * Provides keyboard navigation for stepper components.
 * Should be used by presenter components, not consumed directly.
 *
 * Keyboard bindings:
 * - Arrow Left/Up: Go to previous step
 * - Arrow Right/Down: Go to next step
 * - Enter: Proceed to next step (validates)
 * - Home: Go to first step
 * - End: Go to last completed step
 * - Number keys (1-9): Jump to step by number
 * - Escape: Clear current step errors
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see WCAG 2.1 Keyboard Navigation Guidelines
 */

import { useEffect, useCallback } from 'react';
import type { UseStepperReturn, UseStepperKeyboardOptions } from './use-stepper.types';

/**
 * Hook for keyboard navigation in stepper components
 *
 * @param stepper - Stepper instance from useStepper
 * @param options - Keyboard options
 *
 * @example
 * ```tsx
 * function VerticalStepper() {
 *   const stepper = useStepper(config);
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useStepperKeyboard(stepper, { containerRef });
 *
 *   return (
 *     <div ref={containerRef} tabIndex={0}>
 *       {stepper.steps.map((step, index) => (
 *         <StepItem key={step.id} step={step} index={index} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStepperKeyboard(
  stepper: UseStepperReturn,
  options: UseStepperKeyboardOptions = {}
): void {
  const { enabled = true, containerRef } = options;

  /**
   * Find the last accessible step index
   */
  const findLastAccessibleStep = useCallback((): number => {
    for (let i = stepper.steps.length - 1; i >= 0; i--) {
      if (stepper.canAccessStep(i)) {
        return i;
      }
    }
    return 0;
  }, [stepper]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle if we're in an input field (unless it's the container)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInputField && target !== containerRef?.current) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          stepper.prev();
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          if (!stepper.isValidating) {
            // Only attempt if not validating
            if (stepper.canAccessStep(stepper.currentIndex + 1)) {
              void stepper.goTo(stepper.currentIndex + 1);
            }
          }
          break;

        case 'Enter':
          event.preventDefault();
          if (!stepper.isValidating) {
            void stepper.next();
          }
          break;

        case 'Home':
          event.preventDefault();
          void stepper.goTo(0);
          break;

        case 'End':
          event.preventDefault();
          void stepper.goTo(findLastAccessibleStep());
          break;

        case 'Escape':
          event.preventDefault();
          stepper.clearErrors();
          break;

        // Number keys 1-9 for quick navigation
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          const stepNumber = parseInt(event.key, 10);
          const stepIndex = stepNumber - 1;
          if (stepIndex < stepper.steps.length && stepper.canAccessStep(stepIndex)) {
            event.preventDefault();
            void stepper.goTo(stepIndex);
          }
          break;
        }

        default:
          // Don't prevent default for other keys
          break;
      }
    },
    [enabled, stepper, containerRef, findLastAccessibleStep]
  );

  // Attach keyboard event listener
  useEffect(() => {
    if (!enabled) return;

    const target = containerRef?.current ?? document;

    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, handleKeyDown, containerRef]);
}

/**
 * Get keyboard shortcut hints for UI display
 *
 * @returns Array of keyboard shortcuts with descriptions
 */
export function getStepperKeyboardHints(): Array<{
  keys: string[];
  description: string;
}> {
  return [
    { keys: ['←', '↑'], description: 'Previous step' },
    { keys: ['→', '↓'], description: 'Next step (if accessible)' },
    { keys: ['Enter'], description: 'Proceed to next step' },
    { keys: ['Home'], description: 'First step' },
    { keys: ['End'], description: 'Last completed step' },
    { keys: ['1-9'], description: 'Jump to step by number' },
    { keys: ['Esc'], description: 'Clear errors' },
  ];
}
