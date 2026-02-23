import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
/**
 * Popover root component for managing open state and positioning
 */
declare const Popover: React.FC<PopoverPrimitive.PopoverProps>;
/**
 * PopoverTrigger - Interactive element that toggles the popover open/closed.
 * Use `asChild` prop to attach to custom components.
 */
declare const PopoverTrigger: React.ForwardRefExoticComponent<PopoverPrimitive.PopoverTriggerProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * PopoverAnchor - Optional positioning anchor point.
 * If not provided, PopoverTrigger serves as the anchor.
 */
declare const PopoverAnchor: React.ForwardRefExoticComponent<PopoverPrimitive.PopoverAnchorProps & React.RefAttributes<HTMLDivElement>>;
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
declare const PopoverContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<PopoverPrimitive.PopoverContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
//# sourceMappingURL=popover.d.ts.map