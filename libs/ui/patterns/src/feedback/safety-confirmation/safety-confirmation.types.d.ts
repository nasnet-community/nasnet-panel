/**
 * Safety Confirmation Component Types
 *
 * Type definitions for the SafetyConfirmation component system including:
 * - Headless hook configuration and return types
 * - Component props for presenters
 * - Urgency levels for countdown timer
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see ADR-018: Headless + Platform Presenters
 */
/**
 * Urgency level for countdown timer visualization
 * Changes color and animation based on remaining time
 */
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';
/**
 * Configuration for the useSafetyConfirmation headless hook
 */
export interface UseSafetyConfirmationConfig {
    /** Text the user must type exactly to enable confirmation */
    confirmText: string;
    /** Countdown duration in seconds after validation passes (default: 10) */
    countdownSeconds?: number;
    /** Whether validation is case-sensitive (default: true) */
    caseSensitive?: boolean;
    /** Callback executed when user confirms the operation */
    onConfirm: () => Promise<void>;
    /** Callback executed when user cancels the operation */
    onCancel: () => void;
}
/**
 * Return type for the useSafetyConfirmation headless hook
 * Contains all state and actions needed by presenters
 */
export interface UseSafetyConfirmationReturn {
    /** Current text typed by user */
    typedText: string;
    /** Update the typed text */
    setTypedText: (text: string) => void;
    /** Whether typed text matches the required confirm text */
    isConfirmTextValid: boolean;
    /** Seconds remaining in countdown */
    countdownRemaining: number;
    /** Countdown progress as percentage (0-100, fills as time decreases) */
    countdownProgress: number;
    /** Whether countdown is currently running */
    isCountingDown: boolean;
    /** Current urgency level based on remaining time */
    urgencyLevel: UrgencyLevel;
    /** Formatted time string in MM:SS format */
    formattedTime: string;
    /** Start the countdown timer (automatically called when text is valid) */
    startCountdown: () => void;
    /** Cancel the countdown and reset timer */
    cancelCountdown: () => void;
    /** Execute the confirmation (only works when canConfirm is true) */
    confirm: () => Promise<void>;
    /** Cancel the operation and close dialog */
    cancel: () => void;
    /** Reset all state to initial values */
    reset: () => void;
    /** Whether the Confirm button should be enabled (valid text AND countdown complete) */
    canConfirm: boolean;
    /** Whether async confirmation operation is in progress */
    isProcessing: boolean;
}
/**
 * Props for the SafetyConfirmation component (main wrapper)
 */
export interface SafetyConfirmationProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to change the open state */
    onOpenChange: (open: boolean) => void;
    /** Dialog title (e.g., "Factory Reset") */
    title: string;
    /** Description of the dangerous operation */
    description: string;
    /** List of consequences/risks to display */
    consequences: string[];
    /** Text user must type to confirm (e.g., "RESET") */
    confirmText: string;
    /** Countdown duration in seconds (default: 10) */
    countdownSeconds?: number;
    /** Whether validation is case-sensitive (default: true) */
    caseSensitive?: boolean;
    /** Callback executed when user confirms */
    onConfirm: () => Promise<void>;
    /** Optional callback when user cancels */
    onCancel?: () => void;
    /** Force a specific presenter (default: 'auto' - detects platform) */
    presenter?: 'mobile' | 'desktop' | 'auto';
}
/**
 * Props for the internal presenter components (Desktop/Mobile)
 * Extends main props with hook return values
 */
export interface SafetyConfirmationPresenterProps extends Omit<SafetyConfirmationProps, 'presenter'> {
    /** Headless hook state and actions */
    hook: UseSafetyConfirmationReturn;
}
/**
 * Props for the SafetyConfirmationHeader sub-component
 */
export interface SafetyConfirmationHeaderProps {
    /** Dialog title */
    title: string;
    /** Optional additional class names */
    className?: string;
}
/**
 * Props for the SafetyConfirmationConsequences sub-component
 */
export interface SafetyConfirmationConsequencesProps {
    /** List of consequences to display */
    consequences: string[];
    /** Optional additional class names */
    className?: string;
}
/**
 * Props for the SafetyConfirmationInput sub-component
 */
export interface SafetyConfirmationInputProps {
    /** Current typed text value */
    typedText: string;
    /** Handler for text changes */
    onTypedTextChange: (text: string) => void;
    /** Text the user must type */
    confirmText: string;
    /** Whether the current input is valid */
    isValid: boolean;
    /** Whether countdown has started (input disabled when counting down) */
    isCountingDown: boolean;
    /** Optional additional class names */
    className?: string;
}
/**
 * Props for the SafetyConfirmationCountdown sub-component
 */
export interface SafetyConfirmationCountdownProps {
    /** Whether countdown is active */
    isCountingDown: boolean;
    /** Countdown progress percentage (0-100) */
    progress: number;
    /** Formatted time string (MM:SS) */
    formattedTime: string;
    /** Current urgency level */
    urgencyLevel: UrgencyLevel;
    /** Optional additional class names */
    className?: string;
}
//# sourceMappingURL=safety-confirmation.types.d.ts.map