/**
 * Alert Component
 *
 * A container component for displaying alerts, warnings, and status messages.
 * Includes composable subcomponents: AlertTitle and AlertDescription.
 * Supports multiple variants (default, destructive, success, warning, info).
 *
 * Accessibility:
 * - Uses role="alert" on container for screen readers
 * - Automatic live region for dynamic alerts
 * - Supports icon + title + description layout
 * - Proper heading hierarchy with h5 for title
 * - 7:1 contrast ratio maintained in all variants
 * - Full keyboard navigation support
 *
 * Design System:
 * - Uses semantic color tokens for all variants (success, warning, error, info)
 * - Responsive padding: 12px mobile, 16px desktop
 * - Icon sizing: 16-20px
 * - Proper dark mode support via CSS variables
 *
 * @module @nasnet/ui/primitives/alert
 * @example
 * ```tsx
 * // Basic usage
 * <Alert>
 *   <Terminal className="h-4 w-4" />
 *   <AlertTitle>Heads up!</AlertTitle>
 *   <AlertDescription>
 *     You can add components to your app using the cli.
 *   </AlertDescription>
 * </Alert>
 *
 * // With variants
 * <Alert variant="success">
 *   <CheckCircle2 className="h-4 w-4" />
 *   <AlertTitle>Success</AlertTitle>
 *   <AlertDescription>Configuration saved successfully.</AlertDescription>
 * </Alert>
 * ```
 */
import * as React from "react";
import { type VariantProps } from "class-variance-authority";
declare const alertVariants: (props?: ({
    variant?: "default" | "destructive" | "success" | "warning" | "info" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Props for the Alert component
 *
 * @property {string} [variant] - Visual style variant: default, destructive, success, warning, info
 * @property {string} [role] - ARIA role (default: "alert" for automatic live region)
 * @property {boolean} [live] - If true, uses aria-live="polite" (auto-announced)
 */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
    live?: boolean;
}
/**
 * Alert component - Container for alert messages with role="alert"
 *
 * Automatically creates a live region for screen reader announcements.
 * Use `live` prop for dynamic alerts that should be announced immediately.
 */
declare const Alert: React.MemoExoticComponent<React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * Props for the AlertTitle component
 *
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Title text content
 */
export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
}
/**
 * AlertTitle component - Heading for alert messages
 *
 * Uses h5 for proper semantic hierarchy. Maintains 7:1 contrast ratio
 * in all color variants.
 */
declare const AlertTitle: React.MemoExoticComponent<React.ForwardRefExoticComponent<AlertTitleProps & React.RefAttributes<HTMLHeadingElement>>>;
/**
 * Props for the AlertDescription component
 *
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Description text content
 */
export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
}
/**
 * AlertDescription component - Content area for alert messages
 *
 * Maintains proper line height and spacing for readability.
 * Supports nested paragraphs with relaxed line height.
 */
declare const AlertDescription: React.MemoExoticComponent<React.ForwardRefExoticComponent<AlertDescriptionProps & React.RefAttributes<HTMLDivElement>>>;
export { Alert, AlertTitle, AlertDescription, alertVariants };
//# sourceMappingURL=alert.d.ts.map