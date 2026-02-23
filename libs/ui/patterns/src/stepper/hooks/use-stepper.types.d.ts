/**
 * Type Definitions for useStepper Hook
 *
 * Headless stepper hook types for step navigation, validation, and state management.
 * Used by all stepper UI variants (Vertical, Horizontal, Content, Mini).
 *
 * @see NAS-4A.14: Build Headless Stepper Hook
 * @see ADR-018: Headless + Platform Presenters
 */
/**
 * Step visual status for presenters
 * Used by UI components to render appropriate visual feedback
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'error' | 'skipped';
/**
 * Validation errors for a step
 * Keys are field names, values are error messages
 */
export type StepErrors = Record<string, string>;
/**
 * Validation result returned from validate function
 * @example
 * ```ts
 * // Validation passed
 * { valid: true }
 *
 * // Validation failed with errors
 * { valid: false, errors: { ip: 'Invalid IP address' } }
 * ```
 */
export interface ValidationResult {
    /** Whether validation passed */
    valid: boolean;
    /** Field-level validation errors (only when valid is false) */
    errors?: StepErrors;
}
/**
 * Configuration for a single step
 * Defines step metadata, validation, and behavior
 *
 * @example
 * ```ts
 * const wanStep: StepConfig = {
 *   id: 'wan',
 *   title: 'WAN Configuration',
 *   description: 'Configure your internet connection',
 *   icon: 'globe',
 *   validate: async (data) => {
 *     const result = wanSchema.safeParse(data);
 *     if (!result.success) {
 *       return { valid: false, errors: formatZodErrors(result.error) };
 *     }
 *     return { valid: true };
 *   },
 * };
 * ```
 */
export interface StepConfig {
    /** Unique identifier for the step */
    id: string;
    /** Display title for the step */
    title: string;
    /** Optional description shown below the title */
    description?: string;
    /**
     * Async validation function for this step
     * Receives step data, returns validation result with optional errors
     */
    validate?: (data: unknown) => Promise<ValidationResult>;
    /** Can this step be skipped? When true, skip() can be called */
    canSkip?: boolean;
    /** Icon name for visual presenters (e.g., 'settings', 'network', 'check') */
    icon?: string;
    /** Custom metadata for the step - available to presenters */
    metadata?: Record<string, unknown>;
}
/**
 * Configuration for the stepper
 * Passed to useStepper hook to configure behavior
 *
 * @example
 * ```ts
 * const config: StepperConfig = {
 *   steps: [
 *     { id: 'wan', title: 'WAN Configuration', validate: validateWan },
 *     { id: 'lan', title: 'LAN Setup', validate: validateLan },
 *     { id: 'review', title: 'Review' },
 *   ],
 *   onComplete: (data) => console.log('Wizard complete!', data),
 *   onStepChange: (from, to) => analytics.track('step_change', { from, to }),
 * };
 * ```
 */
export interface StepperConfig {
    /** Array of step configurations - must have at least one step */
    steps: StepConfig[];
    /**
     * Callback when wizard completes successfully
     * Called after the last step passes validation
     */
    onComplete?: (stepData: Map<string, unknown>) => void | Promise<void>;
    /**
     * Callback when step changes (for animations/transitions)
     * Called with indices when navigation occurs
     */
    onStepChange?: (fromIndex: number, toIndex: number) => void;
    /** Whether to validate on step change (default: true) */
    validateOnChange?: boolean;
    /** Initial step index (default: 0) */
    initialStep?: number;
    /** Initial data for steps, keyed by step ID */
    initialStepData?: Map<string, unknown>;
    /**
     * Allow navigating to any step regardless of completion
     * When true, goTo() works for any step, not just completed ones
     */
    freeNavigation?: boolean;
}
/**
 * State for a single step
 * Tracks completion, validation errors, and custom data
 */
export interface StepState {
    /** Visual status for presenters */
    status: StepStatus;
    /** Has this step been completed? */
    completed: boolean;
    /** Has this step been skipped? */
    skipped: boolean;
    /** Validation errors for this step */
    errors: StepErrors;
    /** Was this step visited? */
    visited: boolean;
    /** Custom data stored for this step */
    data: unknown;
}
/**
 * Return type from useStepper hook
 * Provides state, navigation actions, validation, and utilities
 *
 * @example
 * ```tsx
 * const stepper = useStepper(config);
 *
 * return (
 *   <div>
 *     <h2>{stepper.currentStep.title}</h2>
 *     <p>Step {stepper.currentIndex + 1} of {stepper.totalSteps}</p>
 *
 *     {stepper.errors.ip && <span className="text-error">{stepper.errors.ip}</span>}
 *
 *     <Button onClick={stepper.prev} disabled={stepper.isFirst}>Back</Button>
 *     <Button onClick={stepper.next} disabled={stepper.isValidating}>
 *       {stepper.isLast ? 'Complete' : 'Next'}
 *     </Button>
 *   </div>
 * );
 * ```
 */
export interface UseStepperReturn {
    /** Current step configuration */
    currentStep: StepConfig;
    /** Current step index (0-based) */
    currentIndex: number;
    /** All step configurations */
    steps: StepConfig[];
    /** Set of completed step IDs */
    completedSteps: Set<string>;
    /** Set of skipped step IDs */
    skippedSteps: Set<string>;
    /** Map of step states by step ID */
    stepStates: Map<string, StepState>;
    /**
     * Advance to next step (validates first)
     * @returns Promise resolving to true if navigation succeeded
     */
    next: () => Promise<boolean>;
    /**
     * Go back to previous step (no validation required)
     * Does nothing if already on first step
     */
    prev: () => void;
    /**
     * Jump to a specific step by index
     * Only works for completed steps (or any step if freeNavigation is true)
     * @param index - Zero-based step index to navigate to
     * @returns Promise resolving to true if navigation succeeded
     */
    goTo: (index: number) => Promise<boolean>;
    /**
     * Skip current step (if allowed by canSkip)
     * @returns true if step was skipped, false if not allowed
     */
    skip: () => boolean;
    /** Is this the first step? */
    isFirst: boolean;
    /** Is this the last step? */
    isLast: boolean;
    /** Can proceed to next step? (no validation running) */
    canProceed: boolean;
    /** Is currently validating? */
    isValidating: boolean;
    /** Has the wizard been completed? */
    isCompleted: boolean;
    /** Current step validation errors */
    errors: StepErrors;
    /** Array of step IDs that have errors */
    stepsWithErrors: string[];
    /**
     * Set errors for a specific step (for custom validation flows)
     * @param stepId - Step ID to set errors for
     * @param errors - Error map to set
     */
    setStepErrors: (stepId: string, errors: StepErrors) => void;
    /** Clear errors for current step */
    clearErrors: () => void;
    /**
     * Manually trigger validation for current step
     * @returns Promise resolving to true if validation passed
     */
    validate: () => Promise<boolean>;
    /**
     * Get data for a specific step
     * @template T - Expected data type
     * @param stepId - Step ID to get data for
     * @returns Step data or undefined
     */
    getStepData: <T = unknown>(stepId: string) => T | undefined;
    /**
     * Set data for current step
     * @param data - Data to store for current step
     */
    setStepData: (data: unknown) => void;
    /**
     * Get all step data as a map
     * @returns Map of step ID to step data
     */
    getAllStepData: () => Map<string, unknown>;
    /** Progress percentage (0-100) based on completed + skipped steps */
    progress: number;
    /** Number of completed steps (includes skipped) */
    completedCount: number;
    /** Total number of steps */
    totalSteps: number;
    /**
     * Check if a step is accessible (can navigate to)
     * @param index - Step index to check
     * @returns true if step can be navigated to
     */
    canAccessStep: (index: number) => boolean;
    /**
     * Check if a specific step is completed
     * @param stepId - Step ID to check
     * @returns true if step is completed
     */
    isStepCompleted: (stepId: string) => boolean;
    /**
     * Get visual status for a step (for presenter rendering)
     * @param stepId - Step ID to get status for
     * @returns Step status (pending, active, completed, error, skipped)
     */
    getStepStatus: (stepId: string) => StepStatus;
    /** Reset the stepper to initial state */
    reset: () => void;
}
/**
 * Options for useStepperKeyboard hook
 */
export interface UseStepperKeyboardOptions {
    /** Whether keyboard navigation is enabled (default: true) */
    enabled?: boolean;
    /** Container element ref for keyboard event binding */
    containerRef?: React.RefObject<HTMLElement>;
}
/**
 * ARIA props for step list container (tablist role)
 */
export interface StepperAriaProps {
    role: 'tablist';
    'aria-label': string;
    'aria-orientation'?: 'horizontal' | 'vertical';
}
/**
 * ARIA props for individual step button/tab
 */
export interface StepAriaProps {
    role: 'tab';
    id: string;
    'aria-selected': boolean;
    'aria-controls': string;
    'aria-disabled': boolean;
    tabIndex: number;
}
/**
 * ARIA props for step content panel
 */
export interface StepPanelAriaProps {
    role: 'tabpanel';
    id: string;
    'aria-labelledby': string;
    tabIndex: number;
}
//# sourceMappingURL=use-stepper.types.d.ts.map