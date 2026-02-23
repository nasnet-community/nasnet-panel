import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
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
declare const ScrollArea: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const ScrollBar: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<ScrollAreaPrimitive.ScrollAreaScrollbarProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
export { ScrollArea, ScrollBar };
//# sourceMappingURL=scroll-area.d.ts.map