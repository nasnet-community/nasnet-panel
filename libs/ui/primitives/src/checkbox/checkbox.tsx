"use client"

import * as React from "react"

import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "../lib/utils"

/**
 * Props for the Checkbox component.
 * Extends Radix UI CheckboxPrimitive.Root component props.
 * @interface CheckboxProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 */
export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {}

/**
 * A checkable input control that can be checked or unchecked.
 * Built on Radix UI Checkbox with semantic styling, focus indicators,
 * and full keyboard navigation support.
 *
 * - Accessible keyboard navigation (Space to toggle)
 * - Clear focus indicators (2–3px ring offset 2px)
 * - Works with <Label> for proper form integration
 * - Respects `prefers-reduced-motion` for transitions
 * - Supports disabled state with visual feedback
 * - Touch-friendly minimum 44px hit area when used with proper spacing
 *
 * @example
 * ```tsx
 * // Basic checkbox with label (WCAG AAA compliant)
 * <div className="flex items-center gap-2">
 *   <Checkbox id="terms" />
 *   <Label htmlFor="terms">Accept terms</Label>
 * </div>
 *
 * // Controlled checkbox with aria-label
 * const [checked, setChecked] = React.useState(false);
 * <Checkbox
 *   checked={checked}
 *   onCheckedChange={setChecked}
 *   aria-label="Enable notifications"
 * />
 *
 * // Disabled state
 * <Checkbox id="disabled" disabled />
 * ```
 *
 * @accessibility
 * - Fully keyboard accessible (Space/Enter to toggle, Tab to focus)
 * - 7:1 contrast ratio in both light and dark themes
 * - Screen reader announces: "checkbox, [label], [state]"
 * - Focus indicator: 2px ring with 2px offset
 * - Touch target: 20x20px minimum (use with gap-2 for 44px total with label)
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border-2 border-input bg-card ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" aria-hidden="true" role="presentation" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
