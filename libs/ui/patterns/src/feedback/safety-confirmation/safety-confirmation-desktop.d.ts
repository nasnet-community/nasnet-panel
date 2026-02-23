/**
 * SafetyConfirmationDesktop Component
 *
 * Desktop presenter for safety confirmation using centered modal dialog.
 * Implements full keyboard navigation with focus trap.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see ADR-018: Headless + Platform Presenters
 */
import type { SafetyConfirmationPresenterProps } from './safety-confirmation.types';
/**
 * Desktop presenter for SafetyConfirmation
 *
 * Uses the Dialog primitive for a centered modal experience.
 * Implements full keyboard navigation:
 * - Tab cycles through interactive elements
 * - Escape cancels and closes (via Dialog primitive)
 * - Enter activates focused button
 * - Focus is trapped within the dialog (via Radix)
 *
 * Accessibility features:
 * - aria-labelledby on dialog pointing to title
 * - aria-describedby pointing to description/consequences
 * - Focus management via Radix Dialog
 * - Proper ARIA roles for all interactive elements
 *
 * @example
 * ```tsx
 * <SafetyConfirmationDesktop
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Factory Reset"
 *   description="This will restore all settings to factory defaults."
 *   consequences={["All config lost", "Router reboots"]}
 *   confirmText="RESET"
 *   hook={hook}
 *   onConfirm={handleConfirm}
 * />
 * ```
 */
export declare function SafetyConfirmationDesktop({ open, onOpenChange, title, description, consequences, confirmText, hook, }: SafetyConfirmationPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=safety-confirmation-desktop.d.ts.map