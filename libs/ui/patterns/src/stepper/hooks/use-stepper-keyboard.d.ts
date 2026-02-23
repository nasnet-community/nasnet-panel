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
export declare function useStepperKeyboard(stepper: UseStepperReturn, options?: UseStepperKeyboardOptions): void;
/**
 * Get keyboard shortcut hints for UI display
 *
 * @returns Array of keyboard shortcuts with descriptions
 */
export declare function getStepperKeyboardHints(): Array<{
    keys: string[];
    description: string;
}>;
//# sourceMappingURL=use-stepper-keyboard.d.ts.map