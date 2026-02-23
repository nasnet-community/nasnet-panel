/**
 * SafetyConfirmation Component
 *
 * Multi-step confirmation dialog for dangerous/irreversible operations.
 * Auto-detects platform and renders appropriate presenter (Desktop Dialog or Mobile Sheet).
 *
 * Part of the "Invisible Safety Pipeline" UX pattern that makes dangerous operations safe.
 *
 * @see NAS-4A.11: Build Safety Confirmation Component
 * @see ADR-018: Headless + Platform Presenters
 * @see ADR-012: Universal State v2 (Apply-Confirm-Merge pattern)
 */
import type { SafetyConfirmationProps } from './safety-confirmation.types';
/**
 * SafetyConfirmation Component
 *
 * Displays a multi-step confirmation dialog for dangerous operations:
 * 1. Warning message with consequences list
 * 2. Type-to-confirm input (e.g., "Type RESET to confirm")
 * 3. Countdown timer (default 10 seconds)
 * 4. Confirm button (enabled only after countdown)
 *
 * Automatically selects the appropriate presenter based on platform:
 * - Desktop (>1024px): Centered modal dialog
 * - Tablet (640-1024px): Centered modal dialog
 * - Mobile (<640px): Bottom sheet
 *
 * Integrates with the configPipelineMachine for the Apply-Confirm-Merge pattern.
 *
 * @example Basic usage
 * ```tsx
 * <SafetyConfirmation
 *   open={showConfirm}
 *   onOpenChange={setShowConfirm}
 *   title="Factory Reset"
 *   description="This will restore all router settings to factory defaults."
 *   consequences={[
 *     "All configuration will be lost",
 *     "Router will reboot",
 *     "You will be disconnected"
 *   ]}
 *   confirmText="RESET"
 *   countdownSeconds={10}
 *   onConfirm={async () => {
 *     await resetRouter();
 *   }}
 *   onCancel={() => {
 *     console.log("User cancelled reset");
 *   }}
 * />
 * ```
 *
 * @example Force mobile presenter
 * ```tsx
 * <SafetyConfirmation
 *   presenter="mobile"
 *   // ...other props
 * />
 * ```
 *
 * @example Shorter countdown for less critical operations
 * ```tsx
 * <SafetyConfirmation
 *   confirmText={interfaceName}
 *   countdownSeconds={5}
 *   title="Delete Interface"
 *   // ...other props
 * />
 * ```
 */
export declare function SafetyConfirmation({ open, onOpenChange, title, description, consequences, confirmText, countdownSeconds, caseSensitive, onConfirm, onCancel, presenter, }: SafetyConfirmationProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=safety-confirmation.d.ts.map