/**
 * SafetyConfirmationConsequences Component
 *
 * Displays a list of consequences/risks for the dangerous operation.
 * Each consequence is shown as a bulleted list item with warning styling.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 */
import type { SafetyConfirmationConsequencesProps } from './safety-confirmation.types';
/**
 * Consequences list component for safety confirmation dialogs
 *
 * Features:
 * - Bulleted list with warning icons
 * - Scrollable if too many items
 * - Warning color scheme for emphasis
 * - Screen reader accessible
 *
 * @example
 * ```tsx
 * <SafetyConfirmationConsequences
 *   consequences={[
 *     "All configuration will be lost",
 *     "Router will reboot",
 *     "Network services will be interrupted"
 *   ]}
 * />
 * ```
 */
export declare function SafetyConfirmationConsequences({ consequences, className, }: SafetyConfirmationConsequencesProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=safety-confirmation-consequences.d.ts.map