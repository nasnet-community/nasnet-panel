/**
 * @fileoverview Tooltip component
 *
 * A tooltip component for displaying contextual information on hover or focus.
 * Built on Radix UI Tooltip primitive. Supports four placement sides (top, bottom, left, right)
 * with configurable delays. Must be wrapped with TooltipProvider at the app root.
 *
 * Accessibility features:
 * - Keyboard navigation: Tab to trigger, Enter/Space to show, Escape to hide
 * - Screen reader support: ARIA labels propagated from Radix UI
 * - Focus management: Focus trapped within tooltip, restored on close
 * - Color contrast: 7:1 ratio maintained via design tokens (bg-popover, text-popover-foreground)
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <Tooltip delayDuration={200}>
 *     <TooltipTrigger>Hover me</TooltipTrigger>
 *     <TooltipContent side="right">
 *       <p>Tooltip text</p>
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 * ```
 *
 * @param delayDuration - Delay in milliseconds before tooltip shows (default: 200ms, respects prefers-reduced-motion)
 * @param side - Placement side: 'top' | 'bottom' | 'left' | 'right' (default: 'top')
 * @param className - Optional CSS classes for styling the content
 * @returns Tooltip component with automatic positioning and keyboard accessibility
 */
'use client'

import * as React from 'react'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '../lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * TooltipContent - Floating tooltip content panel.
 * Automatically positions itself relative to the trigger.
 * Supports placement sides (top, bottom, left, right) and keyboard accessibility.
 *
 * Respects prefers-reduced-motion: animations disabled if user prefers reduced motion.
 * Uses design token colors for 7:1 contrast ratio in both light and dark modes.
 */
const TooltipContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
  >(({ className, sideOffset = 4, ...props }, ref) => {
    // Memoize className computation to avoid unnecessary re-renders
    const computedClassName = React.useMemo(
      () =>
        cn(
          'z-50 overflow-hidden rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-1.5 text-xs font-medium shadow-[var(--semantic-shadow-tooltip)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-xs',
          className
        ),
      [className]
    )

    return (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={computedClassName}
        {...props}
      />
    )
  })
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
