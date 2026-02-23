/**
 * HStepper Types
 *
 * Type definitions for the Horizontal Stepper (Header Pattern) component.
 * This is the tablet-optimized stepper variant for header navigation.
 *
 * @see NAS-4A.16: Build Horizontal Stepper (Header Pattern)
 * @see ADR-018: Headless + Platform Presenters
 */
import type { UseStepperReturn, StepConfig } from '../../hooks/use-stepper.types';
/**
 * Props for the HStepper component
 */
export interface HStepperProps {
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
     * Show step titles below indicators
     * Hidden on mobile via responsive classes
     * @default true
     */
    showTitles?: boolean;
    /**
     * Use icons instead of numbers when step has icon
     * @default true
     */
    useIcons?: boolean;
    /**
     * Sticky header position
     * @default true
     */
    sticky?: boolean;
    /**
     * Top offset for sticky positioning (CSS value)
     * @default '0'
     */
    stickyOffset?: string;
    /**
     * Allow clicking on future steps to skip ahead
     * @default false
     */
    allowSkipSteps?: boolean;
    /**
     * Callback when menu button is clicked (optional)
     * If provided, shows a menu button in the header
     */
    onMenuClick?: () => void;
    /**
     * Show back button when not on first step
     * @default true
     */
    showBackButton?: boolean;
    /**
     * ARIA label for the stepper navigation
     * @default 'Wizard progress'
     */
    'aria-label'?: string;
}
/**
 * Props for HStepperProgress component
 */
export interface HStepperProgressProps {
    /**
     * All step configurations
     */
    steps: StepConfig[];
    /**
     * Current active step index (0-based)
     */
    activeStep: number;
    /**
     * Set of completed step IDs
     */
    completedSteps: Set<string>;
    /**
     * Steps that have errors (prevents progress past them)
     */
    stepsWithErrors?: string[];
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Props for HStepperItem component
 */
export interface HStepperItemProps {
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
     * Handler for step click navigation
     */
    onClick?: () => void;
    /**
     * Whether clicking this step is disabled
     */
    disabled?: boolean;
    /**
     * Whether to show step title below indicator
     */
    showTitle?: boolean;
    /**
     * Use icon instead of number if step has icon
     */
    useIcon?: boolean;
    /**
     * Additional CSS classes
     */
    className?: string;
}
/**
 * Re-export types from hooks for convenience
 */
export type { UseStepperReturn, StepConfig, StepStatus, StepErrors } from '../../hooks/use-stepper.types';
//# sourceMappingURL=h-stepper.types.d.ts.map