/**
 * Collapsible Component
 *
 * Interactive component that expands/collapses a panel of content.
 * Built on @radix-ui/react-collapsible with full accessibility support.
 *
 * Perfect for:
 * - "Show more" / "Show less" sections (progressive disclosure)
 * - Advanced options panels
 * - Filter sidebars
 * - Details sections
 *
 * For multiple mutually exclusive panels, use Accordion instead.
 *
 * WCAG AAA Compliant:
 * - Full keyboard navigation (Space/Enter to toggle, Tab to focus)
 * - Proper ARIA attributes handled by Radix
 * - Focus indicators: 2px ring with 2px offset
 * - Smooth animation respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * // Uncontrolled (simple show/hide)
 * <Collapsible>
 *   <CollapsibleTrigger asChild>
 *     <Button>Show Details</Button>
 *   </CollapsibleTrigger>
 *   <CollapsibleContent>
 *     Hidden content here
 *   </CollapsibleContent>
 * </Collapsible>
 *
 * // Controlled (with state management)
 * const [isOpen, setIsOpen] = React.useState(false);
 * <Collapsible open={isOpen} onOpenChange={setIsOpen}>
 *   <CollapsibleTrigger asChild>
 *     <Button>{isOpen ? 'Hide' : 'Show'}</Button>
 *   </CollapsibleTrigger>
 *   <CollapsibleContent>
 *     Content here
 *   </CollapsibleContent>
 * </Collapsible>
 * ```
 *
 * @accessibility
 * - Screen readers announce: "button, toggle, [state]"
 * - aria-expanded automatically managed by Radix
 * - Open/close announces to screen readers
 * - Touch targets: 44x44px minimum (ensure trigger button has proper size)
 * - Keyboard: Space/Enter to toggle, Tab to focus next element
 *
 * @see https://ui.shadcn.com/docs/components/collapsible
 * @see https://www.radix-ui.com/docs/primitive/collapsible
 */
import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
/**
 * Collapsible Root Component
 *
 * Manages open/closed state. Use either controlled or uncontrolled:
 * - Uncontrolled: `defaultOpen` for simple toggling
 * - Controlled: `open` + `onOpenChange` for managing state externally
 *
 * @example Controlled
 * ```tsx
 * const [open, setOpen] = React.useState(false);
 * <Collapsible open={open} onOpenChange={setOpen}>
 *   <CollapsibleTrigger>Click me</CollapsibleTrigger>
 *   <CollapsibleContent>Content</CollapsibleContent>
 * </Collapsible>
 * ```
 *
 * @example Uncontrolled
 * ```tsx
 * <Collapsible defaultOpen>
 *   <CollapsibleTrigger>Click me</CollapsibleTrigger>
 *   <CollapsibleContent>Content</CollapsibleContent>
 * </Collapsible>
 * ```
 */
declare const Collapsible: React.MemoExoticComponent<React.ComponentType<Omit<CollapsiblePrimitive.CollapsibleProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React.RefObject<HTMLDivElement> | null | undefined;
}>>;
/**
 * Collapsible Trigger Component
 *
 * Interactive element that toggles open/closed state.
 * Usually contains text ("Show"/"Hide") or an icon (chevron, arrow).
 * Use `asChild` to wrap with your own Button or styled element.
 *
 * Automatically:
 * - Sets aria-expanded (true/false)
 * - Handles keyboard (Space/Enter to toggle)
 * - Manages focus
 *
 * @example With Button
 * ```tsx
 * <CollapsibleTrigger asChild>
 *   <Button variant="outline">Show Details</Button>
 * </CollapsibleTrigger>
 * ```
 *
 * @example With custom element
 * ```tsx
 * <CollapsibleTrigger className="cursor-pointer flex justify-between">
 *   <span>Advanced Options</span>
 *   <ChevronDown className="h-4 w-4" />
 * </CollapsibleTrigger>
 * ```
 */
declare const CollapsibleTrigger: React.MemoExoticComponent<React.ComponentType<Omit<CollapsiblePrimitive.CollapsibleTriggerProps & React.RefAttributes<HTMLButtonElement>, "ref"> & {
    ref?: ((instance: HTMLButtonElement | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React.RefObject<HTMLButtonElement> | null | undefined;
}>>;
/**
 * Collapsible Content Component
 *
 * The animated content area that expands/collapses.
 * Content slides in/out smoothly (200ms, respects prefers-reduced-motion).
 * Automatically hidden when collapsed (not just visually, but in DOM).
 *
 * Styling Tips:
 * - Use padding inside for consistent spacing
 * - Add border-top if separating from trigger
 * - Use bg-muted/30 for subtle background distinction
 *
 * @example
 * ```tsx
 * <CollapsibleContent className="space-y-3 px-4 py-3">
 *   <p>This content is only visible when open</p>
 *   <p>Animates smoothly on expand/collapse</p>
 * </CollapsibleContent>
 * ```
 *
 * @accessibility
 * - Automatically hidden from screen readers when collapsed
 * - Open/close state announced to screen readers
 */
declare const CollapsibleContent: React.MemoExoticComponent<React.ComponentType<Omit<CollapsiblePrimitive.CollapsibleContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    ref?: ((instance: HTMLDivElement | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]) | React.RefObject<HTMLDivElement> | null | undefined;
}>>;
export { Collapsible, CollapsibleTrigger, CollapsibleContent };
//# sourceMappingURL=collapsible.d.ts.map