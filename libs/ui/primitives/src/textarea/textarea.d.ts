import * as React from "react";
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
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}
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
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
export { Textarea };
//# sourceMappingURL=textarea.d.ts.map