"use client"

import * as React from "react"

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "../lib/utils"

/**
 * Custom scroll area component with styled scrollbars.
 * Built on Radix UI ScrollArea primitive with keyboard and touch support.
 * Supports both vertical and horizontal scrolling with custom styling.
 * Scrollbars automatically hide when not needed.
 *
 * @example
 * ```tsx
 * <ScrollArea className="h-64 w-96">
 *   <div className="p-4">
 *     <h3>Content</h3>
 *     Long content here
 *   </div>
 * </ScrollArea>
 * ```
 *
 * @see ScrollBar - Use for horizontal scrolling
 * @see https://www.radix-ui.com/docs/primitives/components/scroll-area - Radix UI ScrollArea docs
 */
const ScrollArea = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
  >(({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  ))
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/**
 * Styled scrollbar for vertical or horizontal scrolling.
 * Automatically hides when not needed. Use with ScrollArea component.
 *
 * @example
 * ```tsx
 * <ScrollArea>
 *   <div>Content</div>
 *   <ScrollBar orientation="horizontal" />
 * </ScrollArea>
 * ```
 *
 * @property {("vertical" | "horizontal")} [orientation] - Direction of the scrollbar (default: vertical)
 * @property {string} [className] - Additional CSS classes to merge with component styles
 *
 * @see ScrollArea - Use as a child of ScrollArea
 * @see https://www.radix-ui.com/docs/primitives/components/scroll-area - Radix UI ScrollArea docs
 */
const ScrollBar = React.memo(
  React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
  >(({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent p-[1px]",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  ))
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar }
