/**
 * ARIA Helpers for Stepper Components
 *
 * Provides ARIA attributes for accessible stepper implementations.
 * Use these helpers in presenter components to ensure proper screen reader support.
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see WCAG 2.1 - Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
import type { UseStepperReturn, StepperAriaProps, StepAriaProps, StepPanelAriaProps } from './use-stepper.types';
/**
 * Get ARIA attributes for the step list container
 *
 * @param stepper - Stepper instance from useStepper
 * @param options - Configuration options
 * @returns ARIA props for the container element
 *
 * @example
 * ```tsx
 * function StepList({ stepper }: { stepper: UseStepperReturn }) {
 *   const ariaProps = getStepperAriaProps(stepper, { id: 'setup-wizard' });
 *
 *   return (
 *     <nav {...ariaProps}>
 *       {stepper.steps.map((step, index) => (
 *         <StepItem key={step.id} step={step} index={index} />
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export declare function getStepperAriaProps(stepper: UseStepperReturn, options?: {
    /** Unique ID for the stepper (used to generate step/panel IDs) */
    id?: string;
    /** Stepper orientation for ARIA */
    orientation?: 'horizontal' | 'vertical';
    /** Custom label for screen readers */
    label?: string;
}): StepperAriaProps;
/**
 * Get ARIA attributes for an individual step button/tab
 *
 * @param stepper - Stepper instance from useStepper
 * @param stepIndex - Zero-based index of the step
 * @param options - Configuration options
 * @returns ARIA props for the step element
 *
 * @example
 * ```tsx
 * function StepItem({ stepper, index }: Props) {
 *   const step = stepper.steps[index];
 *   const ariaProps = getStepAriaProps(stepper, index, { stepperId: 'setup-wizard' });
 *
 *   return (
 *     <button
 *       {...ariaProps}
 *       onClick={() => stepper.goTo(index)}
 *     >
 *       <span>{step.title}</span>
 *     </button>
 *   );
 * }
 * ```
 */
export declare function getStepAriaProps(stepper: UseStepperReturn, stepIndex: number, options?: {
    /** Unique ID for the stepper (used to generate step/panel IDs) */
    stepperId?: string;
}): StepAriaProps;
/**
 * Get ARIA attributes for a step content panel
 *
 * @param stepper - Stepper instance from useStepper
 * @param stepIndex - Zero-based index of the step
 * @param options - Configuration options
 * @returns ARIA props for the panel element
 *
 * @example
 * ```tsx
 * function StepPanel({ stepper, index, children }: Props) {
 *   const ariaProps = getStepPanelAriaProps(stepper, index, { stepperId: 'setup-wizard' });
 *   const isVisible = index === stepper.currentIndex;
 *
 *   return (
 *     <div
 *       {...ariaProps}
 *       hidden={!isVisible}
 *       aria-hidden={!isVisible}
 *     >
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function getStepPanelAriaProps(stepper: UseStepperReturn, stepIndex: number, options?: {
    /** Unique ID for the stepper (used to generate step/panel IDs) */
    stepperId?: string;
}): StepPanelAriaProps;
/**
 * Get an accessible label for a step based on its status
 *
 * @param stepper - Stepper instance from useStepper
 * @param stepIndex - Zero-based index of the step
 * @returns Accessible label string including status
 *
 * @example
 * ```tsx
 * function StepItem({ stepper, index }: Props) {
 *   const step = stepper.steps[index];
 *   const label = getStepAccessibleLabel(stepper, index);
 *
 *   return (
 *     <button aria-label={label}>
 *       <span>{step.title}</span>
 *     </button>
 *   );
 * }
 * // Output: "Step 1 of 3: WAN Configuration, completed"
 * // Output: "Step 2 of 3: LAN Setup, current step"
 * // Output: "Step 3 of 3: Review, not started"
 * ```
 */
export declare function getStepAccessibleLabel(stepper: UseStepperReturn, stepIndex: number): string;
/**
 * Get live region announcement text for step changes
 *
 * Use this with a live region to announce step changes to screen readers.
 *
 * @param stepper - Stepper instance from useStepper
 * @returns Announcement text for current step
 *
 * @example
 * ```tsx
 * function StepperAnnouncer({ stepper }: Props) {
 *   const announcement = getStepChangeAnnouncement(stepper);
 *
 *   return (
 *     <div
 *       role="status"
 *       aria-live="polite"
 *       aria-atomic="true"
 *       className="sr-only"
 *     >
 *       {announcement}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function getStepChangeAnnouncement(stepper: UseStepperReturn): string;
/**
 * Get ARIA attributes for step navigation buttons (Next/Back)
 *
 * @param type - Button type ('next' or 'back')
 * @param stepper - Stepper instance from useStepper
 * @returns ARIA props for navigation buttons
 *
 * @example
 * ```tsx
 * function StepperNavigation({ stepper }: Props) {
 *   return (
 *     <div>
 *       <Button
 *         onClick={stepper.prev}
 *         disabled={stepper.isFirst}
 *         {...getNavigationButtonAriaProps('back', stepper)}
 *       >
 *         Back
 *       </Button>
 *       <Button
 *         onClick={stepper.next}
 *         disabled={!stepper.canProceed}
 *         {...getNavigationButtonAriaProps('next', stepper)}
 *       >
 *         {stepper.isLast ? 'Complete' : 'Next'}
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function getNavigationButtonAriaProps(type: 'next' | 'back', stepper: UseStepperReturn): {
    'aria-label': string;
    'aria-disabled': boolean;
};
//# sourceMappingURL=use-stepper-aria.d.ts.map