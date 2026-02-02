/**
 * Mini Stepper Types
 *
 * Type definitions for the Mini Stepper (Mobile Pattern) component.
 * This is the mobile-optimized stepper variant for touch devices.
 *
 * @see NAS-4A.18: Build Mini Stepper (Mobile Pattern)
 * @see ADR-018: Headless + Platform Presenters
 */

import type { UseStepperReturn, StepConfig } from '../../hooks/use-stepper.types';

/**
 * Props for the MiniStepper component
 */
export interface MiniStepperProps {
  /**
   * Stepper state from useStepper hook
   * Provides all step navigation, validation, and state management
   */
  stepper: UseStepperReturn;

  /**
   * Content to render for the current step
   * This is passed as children to allow the step content to be provided
   */
  stepContent: React.ReactNode;

  /**
   * Additional CSS classes for the root element
   */
  className?: string;

  /**
   * Callback when step changes (for analytics or tracking)
   * Called with the new step and its index
   */
  onStepChange?: (step: StepConfig, index: number) => void;

  /**
   * Disable swipe navigation
   * Useful for forms with text inputs where swipe might interfere
   * @default false
   */
  disableSwipe?: boolean;

  /**
   * ARIA label for the stepper navigation
   * @default 'Wizard navigation'
   */
  'aria-label'?: string;
}

/**
 * Props for the MiniStepperHeader component
 */
export interface MiniStepperHeaderProps {
  /**
   * Current step index (0-based)
   */
  currentIndex: number;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Title of the current step
   */
  stepTitle: string;

  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for the MiniStepperFooter component
 */
export interface MiniStepperFooterProps {
  /**
   * Handler for going back to previous step
   */
  onBack: () => void;

  /**
   * Handler for advancing to next step
   */
  onNext: () => Promise<void>;

  /**
   * Whether this is the first step (disables back button)
   */
  isFirst: boolean;

  /**
   * Whether this is the last step (changes button text to "Finish")
   */
  isLast: boolean;

  /**
   * Whether validation/navigation is in progress
   */
  isLoading?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Re-export types from hooks for convenience
 */
export type {
  UseStepperReturn,
  StepConfig,
  StepStatus,
  StepErrors,
} from '../../hooks/use-stepper.types';
