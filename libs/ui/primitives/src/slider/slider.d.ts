import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
/**
 * Slider Component
 *
 * An accessible input where the user selects a value from within a given range.
 * Built on Radix UI Slider with full WCAG AAA keyboard support and screen reader compatibility.
 *
 * Supports:
 * - Single-value mode: User selects one value (defaultValue length = 1)
 * - Range mode: User selects min/max range (defaultValue length = 2)
 * - Multi-thumb: Multiple independent values (defaultValue length > 2)
 *
 * Keyboard Support:
 * - Arrow keys (←/→): Adjust value by step amount
 * - Home: Jump to minimum value
 * - End: Jump to maximum value
 * - Page Up/Down: Adjust by larger increments
 * - Tab: Move focus to next interactive element
 *
 * Accessibility (WCAG AAA):
 * - Full keyboard navigation (arrow keys, Home, End)
 * - Semantic HTML with proper ARIA attributes from Radix
 * - Focus indicators visible (2-3px ring with offset)
 * - High contrast (4.5:1 for UI components)
 * - Touch targets 44px minimum on mobile
 * - Screen reader announces: name, current value, min/max range
 * - aria-valuenow, aria-valuemin, aria-valuemax provided by Radix
 *
 * Design Tokens:
 * - Track: bg-muted (semantic token for inactive state)
 * - Range: bg-primary (semantic token for active selection)
 * - Thumb: border-primary, ring-ring (focus indicators)
 * - Transitions: 200ms standard easing for smooth interactions
 *
 * @example
 * ```tsx
 * // Single value (volume control, brightness)
 * <Slider
 *   defaultValue={[50]}
 *   min={0}
 *   max={100}
 *   step={1}
 *   aria-label="Volume"
 * />
 *
 * // Range slider (price filter, date range)
 * <Slider
 *   defaultValue={[20, 80]}
 *   min={0}
 *   max={100}
 *   step={5}
 *   aria-label="Price range"
 * />
 *
 * // Bandwidth throttle (0-1000 Mbps)
 * <Slider
 *   defaultValue={[500]}
 *   min={0}
 *   max={1000}
 *   step={10}
 *   aria-label="Bandwidth limit"
 * />
 * ```
 *
 * Performance:
 * - Respects debouncing in parent component for value updates
 * - No layout shift during interaction
 * - Smooth 60fps animations using CSS transitions
 * - Minimal re-renders (uses Radix primitives)
 *
 * @see https://radix-ui.com/docs/primitives/components/slider
 * @see Section 7 - Accessibility: Full WCAG AAA compliance
 * @see Section 3 - Design Tokens: Semantic token usage (bg-primary, bg-muted)
 */
export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    /**
     * Optional custom CSS class to apply to the root slider element.
     * Used for overriding styles or applying layout utilities.
     *
     * @example
     * className="w-64" // Set fixed width
     * className="mb-4" // Add bottom margin
     */
    className?: string;
}
declare const Slider: React.MemoExoticComponent<React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLSpanElement>>>;
export { Slider };
//# sourceMappingURL=slider.d.ts.map