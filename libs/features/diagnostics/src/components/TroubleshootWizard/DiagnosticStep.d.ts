import type { DiagnosticStep as DiagnosticStepType } from '../../types/troubleshoot.types';
/**
 * Props for DiagnosticStep component
 */
interface DiagnosticStepProps {
    /** Step configuration and state */
    step: DiagnosticStepType;
    /** Whether this step is currently active */
    isActive: boolean;
    /** Step index for display (1-based, used in badge) */
    stepNumber: number;
    /** Total steps for progress context (used in aria-label) */
    totalSteps: number;
    /** Optional click handler for completed steps (enables keyboard nav) */
    onClick?: () => void;
}
/**
 * Diagnostic Step Card
 *
 * Displays a single diagnostic step with status icon, name, result message,
 * execution time, and step number badge. Supports click handlers for
 * clickable steps and full keyboard navigation (Enter/Space).
 *
 * Status indicators use semantic colors: green (success), red (error),
 * amber (running), gray (pending). Icons always accompany color for
 * color-blind accessibility.
 *
 * @example
 * ```tsx
 * <DiagnosticStep
 *   step={diagnosticStep}
 *   isActive={index === currentIndex}
 *   stepNumber={index + 1}
 *   totalSteps={5}
 *   onClick={() => handleStepClick(index)}
 * />
 * ```
 *
 * @see TroubleshootWizardMobile for list usage
 */
export declare const DiagnosticStep: import("react").NamedExoticComponent<DiagnosticStepProps>;
export {};
//# sourceMappingURL=DiagnosticStep.d.ts.map