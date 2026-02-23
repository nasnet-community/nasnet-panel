/**
 * SafetyConfirmationMobile Component
 *
 * Mobile presenter for safety confirmation using bottom sheet pattern.
 * Optimized for touch interactions with 44px minimum touch targets.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see ADR-018: Headless + Platform Presenters
 */
import type { SafetyConfirmationPresenterProps } from './safety-confirmation.types';
/**
 * Mobile presenter for SafetyConfirmation
 *
 * Uses the Sheet primitive with side="bottom" for a bottom sheet experience.
 * Optimized for touch devices:
 * - 44px minimum touch targets for buttons
 * - Larger typography for readability
 * - Full-width buttons
 * - Swipe down to dismiss (cancels operation)
 *
 * Accessibility features:
 * - aria-labelledby on sheet pointing to title
 * - aria-describedby pointing to description/consequences
 * - Touch-optimized input with larger touch area
 * - Proper ARIA roles for all interactive elements
 *
 * @example
 * ```tsx
 * <SafetyConfirmationMobile
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
export declare function SafetyConfirmationMobile({ open, onOpenChange, title, description, consequences, confirmText, hook, }: SafetyConfirmationPresenterProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=safety-confirmation-mobile.d.ts.map