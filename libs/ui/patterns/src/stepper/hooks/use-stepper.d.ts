/**
 * useStepper - Headless Stepper Hook
 *
 * Manages all step navigation, validation, and state management for stepper UIs.
 * Consumed by all stepper UI variants (Vertical, Horizontal, Content, Mini).
 *
 * This hook follows the Headless + Platform Presenter pattern (ADR-018):
 * - All business logic is contained in this hook
 * - UI presenters consume this hook and provide platform-optimized rendering
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see ADR-018: Headless + Platform Presenters
 *
 * @example
 * ```tsx
 * const stepper = useStepper({
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration', validate: validateWan },
 *     { id: 'lan', title: 'LAN Setup', validate: validateLan },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: (data) => console.log('Wizard complete!', data),
 * });
 *
 * return (
 *   <div>
 *     <h2>{stepper.currentStep.title}</h2>
 *     <Button onClick={stepper.prev} disabled={stepper.isFirst}>Back</Button>
 *     <Button onClick={stepper.next} disabled={!stepper.canProceed}>
 *       {stepper.isLast ? 'Complete' : 'Next'}
 *     </Button>
 *   </div>
 * );
 * ```
 */
import type { StepperConfig, UseStepperReturn } from './use-stepper.types';
/**
 * Headless stepper hook - manages all step navigation and validation logic
 *
 * @param config - Stepper configuration
 * @returns Stepper state and actions
 */
export declare function useStepper(config: StepperConfig): UseStepperReturn;
//# sourceMappingURL=use-stepper.d.ts.map