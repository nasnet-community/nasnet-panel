/**
 * SafetyConfirmationInput Component
 *
 * Type-to-confirm input field with real-time validation feedback.
 * Shows visual indicator for match status (check when valid, X when invalid).
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */
import type { SafetyConfirmationInputProps } from './safety-confirmation.types';
/**
 * Type-to-confirm input component for safety confirmation dialogs
 *
 * Features:
 * - Real-time validation indicator (check/X icon)
 * - Helper text showing required text
 * - Visual feedback for valid/invalid state
 * - Disabled when countdown is running
 * - Accessible with proper labels
 *
 * @example
 * ```tsx
 * <SafetyConfirmationInput
 *   typedText={hook.typedText}
 *   onTypedTextChange={hook.setTypedText}
 *   confirmText="RESET"
 *   isValid={hook.isConfirmTextValid}
 *   isCountingDown={hook.isCountingDown}
 * />
 * ```
 */
export declare function SafetyConfirmationInput({ typedText, onTypedTextChange, confirmText, isValid, isCountingDown, className, }: SafetyConfirmationInputProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=safety-confirmation-input.d.ts.map