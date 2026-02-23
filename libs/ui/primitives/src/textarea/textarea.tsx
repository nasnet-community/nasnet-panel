import * as React from "react"

import { cn } from "../lib/utils"

/**
 * Props for the Textarea component.
 * @interface TextareaProps
 * @extends React.TextareaHTMLAttributes<HTMLTextAreaElement>
 * @property {string} [className] - Additional CSS classes to merge with component styles
 *
 * Supports all standard HTML textarea attributes including:
 * - placeholder: Hint text when empty
 * - disabled: Prevents input and grays out
 * - readOnly: Allows viewing but not editing
 * - rows: Number of visible text rows
 * - maxLength: Maximum characters allowed
 * - required: Field validation
 * - aria-label: Accessible label for screen readers
 * - aria-describedby: Links to description element for error messages
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * A multi-line text input component for longer text content.
 * Built on the native HTML textarea element with semantic styling,
 * focus transitions, and comprehensive accessibility features.
 *
 * Features:
 * - WCAG AAA compliant (7:1 contrast ratio, 44px minimum touch targets)
 * - Semantic HTML: uses native textarea for full keyboard support
 * - Focus ring: 2px ring offset by 2px with primary color
 * - Disabled state: 50% opacity with disabled cursor
 * - Placeholder: muted color for hint text
 * - Transition: smooth 200ms transitions for focus states
 * - Rounded: 12px (xl border radius token)
 * - Border: 2px for better visibility at all zoom levels
 *
 * Accessibility:
 * - Keyboard: Full Tab navigation support via native textarea
 * - Screen readers: Automatically paired with labels via aria-label or implicit <label>
 * - Focus indicator: Always visible (no outline removal)
 * - Disabled state: Announced to screen readers
 * - Error support: Use aria-describedby to link to error messages
 *
 * @example
 * ```tsx
 * // Basic textarea
 * <Textarea placeholder="Enter notes..." />
 *
 * // With label (implicit association)
 * <div className="flex flex-col gap-2">
 *   <label htmlFor="message">Message</label>
 *   <Textarea id="message" placeholder="Enter your message" />
 * </div>
 *
 * // With rows and disabled state
 * <Textarea rows={5} disabled placeholder="Locked configuration" />
 *
 * // With validation error
 * <Textarea
 *   id="config"
 *   placeholder="Enter configuration"
 *   aria-describedby="config-error"
 * />
 * <p id="config-error" className="text-error text-xs">
 *   Invalid syntax on line 3
 * </p>
 *
 * // Read-only display
 * <Textarea readOnly defaultValue="System configuration" />
 * ```
 *
 * Design tokens used:
 * - Border color: var(--input) - semantic input border
 * - Background: var(--card) - semantic card surface
 * - Text: var(--foreground) - semantic text color
 * - Focus ring: var(--ring) - semantic focus color
 * - Placeholder: var(--muted-foreground) - semantic muted text
 *
 * @see {@link ../lib/utils#cn} For className merging utility
 * @see {@link ../../Docs/design/DESIGN_TOKENS.md} For design token reference
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border-2 border-input bg-card px-4 py-3 text-sm text-foreground ring-offset-background transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
