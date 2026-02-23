"use client"

import * as React from "react"

import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "../lib/utils"

/**
 * Props for Separator component.
 *
 * Extends standard separator element props with orientation and semantic configuration.
 * The separator uses design token colors for theme support.
 *
 * @interface SeparatorProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 * @property {'horizontal' | 'vertical'} [orientation] - Direction of the separator (default: 'horizontal')
 * @property {boolean} [decorative] - If true, separator is marked as decorative (ignored by screen readers) (default: true)
 *
 * @example
 * ```tsx
 * // Horizontal separator (default)
 * <Separator />
 *
 * // Vertical separator
 * <Separator orientation="vertical" className="h-12" />
 * ```
 */
export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {}

/**
 * Separator Component
 *
 * A visual divider for grouping and organizing content.
 * Built on Radix UI's Separator primitive with semantic styling via design tokens.
 * Respects light/dark theme via CSS variables.
 *
 * Uses the `bg-border` semantic token for consistent color across themes.
 * Automatically adapts to `prefers-reduced-motion` if future animation is added.
 *
 * **Accessibility:**
 * - By default, marked as decorative (`decorative: true`) and hidden from screen readers
 * - Set `decorative={false}` only if the separator has semantic meaning
 * - ARIA role automatically applied by Radix
 *
 * **Width/Height:**
 * - Horizontal: 1px height, full width
 * - Vertical: 1px width, full height (container must specify height via className)
 *
 * @param props - Standard React element props extended with Separator-specific options
 * @param ref - Ref forwarded to underlying DOM element
 *
 * @example
 * ```tsx
 * import { Separator } from '@nasnet/ui/primitives';
 *
 * // Basic usage
 * <Separator className="my-4" />
 *
 * // Vertical separator within flex container
 * <div className="flex gap-4 items-center">
 *   <span>Section 1</span>
 *   <Separator orientation="vertical" className="h-6" />
 *   <span>Section 2</span>
 * </div>
 *
 * // Semantic separator (content-aware)
 * <Separator decorative={false} aria-label="Section divider" className="my-6" />
 * ```
 */
const Separator = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SeparatorPrimitive.Root>,
    SeparatorProps
  >(
    (
      { className, orientation = "horizontal", decorative = true, ...props },
      ref
    ) => (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 bg-border",
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className
        )}
        {...props}
      />
    )
  )
)
Separator.displayName = 'Separator'

export { Separator }
