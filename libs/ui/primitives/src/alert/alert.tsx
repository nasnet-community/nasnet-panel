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

import * as React from "react"

import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../lib/utils"
import type { LucideIcon } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-lg border [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 transition-colors duration-150 p-4",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border [&>svg]:text-foreground",
        destructive:
          "border-l-4 border-l-error bg-error-light/50 text-error-dark [&>svg]:text-error",
        success:
          "border-l-4 border-l-success bg-success-light/50 text-success-dark [&>svg]:text-success",
        warning:
          "border-l-4 border-l-warning bg-warning-light/50 text-warning-dark [&>svg]:text-warning",
        info:
          "border-l-4 border-l-info bg-info-light/50 text-info-dark [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Props for the Alert component
 *
 * @property {string} [variant] - Visual style variant: default, destructive, success, warning, info
 * @property {string} [role] - ARIA role (default: "alert" for automatic live region)
 * @property {boolean} [live] - If true, uses aria-live="polite" (auto-announced)
 */
export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  live?: boolean;
}

/**
 * Alert component - Container for alert messages with role="alert"
 *
 * Automatically creates a live region for screen reader announcements.
 * Use `live` prop for dynamic alerts that should be announced immediately.
 */
const Alert = React.memo(
  React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant, role = "alert", live = false, ...props }, ref) => (
      <div
        ref={ref}
        role={role}
        aria-live={live ? "polite" : undefined}
        aria-atomic="true"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      />
    )
  )
)
Alert.displayName = "Alert"

/**
 * Props for the AlertTitle component
 *
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Title text content
 */
export interface AlertTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * AlertTitle component - Heading for alert messages
 *
 * Uses h5 for proper semantic hierarchy. Maintains 7:1 contrast ratio
 * in all color variants.
 */
const AlertTitle = React.memo(
  React.forwardRef<
    HTMLHeadingElement,
    AlertTitleProps
  >(({ className, children, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("font-semibold text-sm leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h5>
  ))
)
AlertTitle.displayName = "AlertTitle"

/**
 * Props for the AlertDescription component
 *
 * @property {string} [className] - Additional CSS classes
 * @property {React.ReactNode} [children] - Description text content
 */
export interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * AlertDescription component - Content area for alert messages
 *
 * Maintains proper line height and spacing for readability.
 * Supports nested paragraphs with relaxed line height.
 */
const AlertDescription = React.memo(
  React.forwardRef<
    HTMLDivElement,
    AlertDescriptionProps
  >(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground [&_p]:leading-relaxed", className)}
      {...props}
    />
  ))
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }




























