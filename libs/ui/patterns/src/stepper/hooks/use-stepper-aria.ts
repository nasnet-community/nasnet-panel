/**
 * ARIA Helpers for Stepper Components
 *
 * Provides ARIA attributes for accessible stepper implementations.
 * Use these helpers in presenter components to ensure proper screen reader support.
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see WCAG 2.1 - Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */

import type {
  UseStepperReturn,
  StepperAriaProps,
  StepAriaProps,
  StepPanelAriaProps,
} from './use-stepper.types';

/**
 * Generate unique IDs for ARIA relationships
 */
function generateStepId(stepperId: string, stepIndex: number): string {
  return `${stepperId}-step-${stepIndex}`;
}

function generatePanelId(stepperId: string, stepIndex: number): string {
  return `${stepperId}-panel-${stepIndex}`;
}

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
export function getStepperAriaProps(
  stepper: UseStepperReturn,
  options: {
    /** Unique ID for the stepper (used to generate step/panel IDs) */
    id?: string;
    /** Stepper orientation for ARIA */
    orientation?: 'horizontal' | 'vertical';
    /** Custom label for screen readers */
    label?: string;
  } = {}
): StepperAriaProps {
  const {
    orientation = 'horizontal',
    label = `Step ${stepper.currentIndex + 1} of ${stepper.totalSteps}`,
  } = options;

  return {
    role: 'tablist',
    'aria-label': label,
    'aria-orientation': orientation,
  };
}

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
export function getStepAriaProps(
  stepper: UseStepperReturn,
  stepIndex: number,
  options: {
    /** Unique ID for the stepper (used to generate step/panel IDs) */
    stepperId?: string;
  } = {}
): StepAriaProps {
  const { stepperId = 'stepper' } = options;
  const step = stepper.steps[stepIndex];
  const isSelected = stepIndex === stepper.currentIndex;
  const isAccessible = stepper.canAccessStep(stepIndex);
  const stepState = stepper.stepStates.get(step.id);
  const hasErrors = stepState && Object.keys(stepState.errors).length > 0;

  return {
    role: 'tab',
    id: generateStepId(stepperId, stepIndex),
    'aria-selected': isSelected,
    'aria-controls': generatePanelId(stepperId, stepIndex),
    'aria-disabled': !isAccessible,
    tabIndex: isSelected ? 0 : -1,
  };
}

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
export function getStepPanelAriaProps(
  stepper: UseStepperReturn,
  stepIndex: number,
  options: {
    /** Unique ID for the stepper (used to generate step/panel IDs) */
    stepperId?: string;
  } = {}
): StepPanelAriaProps {
  const { stepperId = 'stepper' } = options;
  const isSelected = stepIndex === stepper.currentIndex;

  return {
    role: 'tabpanel',
    id: generatePanelId(stepperId, stepIndex),
    'aria-labelledby': generateStepId(stepperId, stepIndex),
    tabIndex: isSelected ? 0 : -1,
  };
}

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
export function getStepAccessibleLabel(
  stepper: UseStepperReturn,
  stepIndex: number
): string {
  const step = stepper.steps[stepIndex];
  const status = stepper.getStepStatus(step.id);
  const stepNumber = stepIndex + 1;

  let statusText: string;
  switch (status) {
    case 'completed':
      statusText = 'completed';
      break;
    case 'skipped':
      statusText = 'skipped';
      break;
    case 'error':
      statusText = 'has errors';
      break;
    case 'active':
      statusText = 'current step';
      break;
    case 'pending':
    default:
      statusText = 'not started';
      break;
  }

  return `Step ${stepNumber} of ${stepper.totalSteps}: ${step.title}, ${statusText}`;
}

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
export function getStepChangeAnnouncement(stepper: UseStepperReturn): string {
  const step = stepper.currentStep;
  const stepNumber = stepper.currentIndex + 1;

  if (stepper.isCompleted) {
    return `All steps completed. ${stepper.totalSteps} steps finished.`;
  }

  if (stepper.isValidating) {
    return `Validating step ${stepNumber}: ${step.title}`;
  }

  const hasErrors = Object.keys(stepper.errors).length > 0;
  if (hasErrors) {
    const errorCount = Object.keys(stepper.errors).length;
    return `Step ${stepNumber}: ${step.title} has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please correct before continuing.`;
  }

  return `Now on step ${stepNumber} of ${stepper.totalSteps}: ${step.title}${step.description ? `. ${step.description}` : ''}`;
}

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
export function getNavigationButtonAriaProps(
  type: 'next' | 'back',
  stepper: UseStepperReturn
): {
  'aria-label': string;
  'aria-disabled': boolean;
} {
  if (type === 'back') {
    const prevStep = stepper.currentIndex > 0 ? stepper.steps[stepper.currentIndex - 1] : null;
    return {
      'aria-label': prevStep
        ? `Go back to ${prevStep.title}`
        : 'Go back (disabled - already at first step)',
      'aria-disabled': stepper.isFirst,
    };
  }

  // Next button
  if (stepper.isLast) {
    return {
      'aria-label': stepper.isValidating
        ? 'Completing wizard, please wait'
        : 'Complete wizard',
      'aria-disabled': !stepper.canProceed,
    };
  }

  const nextStep = stepper.steps[stepper.currentIndex + 1];
  return {
    'aria-label': stepper.isValidating
      ? 'Validating, please wait'
      : `Go to ${nextStep?.title ?? 'next step'}`,
    'aria-disabled': !stepper.canProceed,
  };
}
