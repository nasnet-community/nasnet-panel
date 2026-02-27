/**
 * @fileoverview Popover component
 *
 * A floating popover component that displays content anchored to a trigger element.
 * Built on Radix UI Popover primitive. Supports alignment (start, center, end) and side placement.
 * Commonly used for dropdowns, quick settings, filters, and contextual menus.
 *
 * Features:
 * - Portal rendering (content appears at document body root)
 * - Automatic positioning (avoid viewport edges)
 * - Smooth animations with fade and scale transitions
 * - Keyboard navigation (Esc to close)
 * - Screen reader support via Radix UI
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button>Settings</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <div className="space-y-2">
 *       <p>Popover content</p>
 *     </div>
 *   </PopoverContent>
 * </Popover>
 * ```
 */
'use client';

import * as React from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '../lib/utils';

/**
 * Popover root component for managing open state and positioning
 */
const Popover = PopoverPrimitive.Root;

/**
 * PopoverTrigger - Interactive element that toggles the popover open/closed.
 * Use `asChild` prop to attach to custom components.
 */
const PopoverTrigger = PopoverPrimitive.Trigger;

/**
 * PopoverAnchor - Optional positioning anchor point.
 * If not provided, PopoverTrigger serves as the anchor.
 */
const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * PopoverContent - Floating content panel for a popover.
 * Portals to document body and positions itself relative to the trigger.
 * Supports alignment (start, center, end) and auto-adjusts side to avoid viewport edges.
 *
 * Uses semantic design tokens:
 * - `bg-popover`, `text-popover-foreground`: color scheme (respects dark mode)
 * - `border-border`: semantic border color
 * - `shadow-md`: card elevation
 * - Animation durations respect `prefers-reduced-motion`
 *
 * @param className - Additional CSS classes to merge
 * @param align - Horizontal alignment: 'start' | 'center' | 'end' (default: 'center')
 * @param sideOffset - Distance in pixels between popover and trigger (default: 4, approximately 1rem)
 * @param props - Standard Radix UI PopoverContent props
 */
const PopoverContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
  >(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'border-border bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-[80vh] w-72 overflow-y-auto rounded-[var(--semantic-radius-card)] border p-4 shadow-[var(--semantic-shadow-dropdown)] outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ))
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
