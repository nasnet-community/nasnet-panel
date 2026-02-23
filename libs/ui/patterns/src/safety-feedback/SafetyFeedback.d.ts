/**
 * Safety Feedback Component
 * Displays feedback for configuration changes, rollbacks, and validation errors
 * Based on UX Design Specification - Invisible Safety Pipeline Pattern
 */
import * as React from 'react';
/**
 * Feedback action configuration
 */
export interface FeedbackAction {
    /** Action label */
    label: string;
    /** Click handler */
    onClick: () => void;
    /** Button variant */
    variant?: 'default' | 'action' | 'destructive' | 'ghost';
}
/**
 * Feedback type
 */
export type FeedbackType = 'rollback' | 'validation-error' | 'success' | 'warning';
/**
 * SafetyFeedback Props
 */
export interface SafetyFeedbackProps {
    /** Type of feedback */
    type: FeedbackType;
    /** Main message */
    message: string;
    /** Optional detailed description */
    details?: string;
    /** Action buttons */
    actions?: FeedbackAction[];
    /** Custom className */
    className?: string;
    /** Auto-dismiss after ms (0 = no auto-dismiss) */
    autoDismiss?: number;
    /** Dismiss callback */
    onDismiss?: () => void;
}
/**
 * SafetyFeedback Component
 *
 * Displays important feedback about configuration changes:
 * - Rollback confirmations
 * - Validation errors
 * - Success messages
 * - Warnings
 *
 * Features:
 * - Expandable details section
 * - Custom action buttons
 * - Auto-dismiss option
 * - Slide-in animation
 *
 * @example
 * ```tsx
 * <SafetyFeedback
 *   type="rollback"
 *   message="We detected an issue"
 *   details="Previous settings restored. Your network is working."
 *   actions={[
 *     { label: 'Details', onClick: () => showDetails() },
 *     { label: 'Try Again', onClick: () => retry(), variant: 'action' }
 *   ]}
 * />
 * ```
 */
declare function SafetyFeedbackComponent({ type, message, details, actions, className, autoDismiss, onDismiss, }: SafetyFeedbackProps): import("react/jsx-runtime").JSX.Element | null;
declare namespace SafetyFeedbackComponent {
    var displayName: string;
}
/**
 * Memoized SafetyFeedback component
 */
export declare const SafetyFeedback: React.MemoExoticComponent<typeof SafetyFeedbackComponent>;
export {};
//# sourceMappingURL=SafetyFeedback.d.ts.map