/**
 * VStepper Types
 *
 * Type definitions for the Vertical Stepper (Sidebar Pattern) component.
 * This is the desktop-optimized stepper variant for sidebar navigation.
 *
 * @see NAS-4A.15: Build Vertical Stepper (Sidebar Pattern)
 * @see ADR-018: Headless + Platform Presenters
 */

import type { UseStepperReturn, StepConfig } from '../../hooks/use-stepper.types';

/**
 * Props for the VStepper component
 */
export interface VStepperProps {
  /**
   * Stepper state from useStepper hook
   * Provides all step navigation, validation, and state management
   */
  stepper: UseStepperReturn;

  /**
   * Additional CSS classes for the root element
   */
  className?: string;

  /**
   * Width of the sidebar stepper
   * @default '256px' (16rem)
   */
  width?: string | number;

  /**
   * Show step descriptions below titles
   * @default true
   */
  showDescriptions?: boolean;

  /**
   * Show error badges with count
   * @default false
   */
  showErrorCount?: boolean;

  /**
   * ARIA label for the stepper navigation
   * @default 'Wizard steps'
   */
  'aria-label'?: string;
}

/**
 * Props for VStepperItem component
 */
export interface VStepperItemProps {
  /**
   * Step configuration
   */
  step: StepConfig;

  /**
   * Index of the step (0-based)
   */
  index: number;

  /**
   * Whether this is the current/active step
   */
  isActive: boolean;

  /**
   * Whether this step has been completed
   */
  isCompleted: boolean;

  /**
   * Whether this step has validation errors
   */
  hasError: boolean;

  /**
   * Validation error messages for this step
   */
  errors: string[];

  /**
   * Whether clicking this step is allowed
   */
  isClickable: boolean;

  /**
   * Handler for step click navigation
   */
  onClick: () => void;

  /**
   * Whether to show step description
   */
  showDescription?: boolean;

  /**
   * Whether to show error count badge
   */
  showErrorCount?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Props for VStepperConnector component
 */
export interface VStepperConnectorProps {
  /**
   * Whether the connector leads to a completed step
   */
  isCompleted: boolean;

  /**
   * Whether to animate the connector
   */
  animated?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Re-export types from hooks for convenience
 */
export type { UseStepperReturn, StepConfig, StepStatus, StepErrors } from '../../hooks/use-stepper.types';
