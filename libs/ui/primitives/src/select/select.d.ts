import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
/**
 * Props for SelectTrigger component.
 *
 * Extends standard trigger element props with additional styling options.
 * The trigger button displays the selected value and opens the dropdown menu.
 *
 * @interface SelectTriggerProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 *
 * @example
 * ```tsx
 * <SelectTrigger className="w-[200px]">
 *   <SelectValue placeholder="Select an option" />
 * </SelectTrigger>
 * ```
 */
export interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
}
/**
 * Props for SelectContent component.
 *
 * Configures the dropdown content container with positioning and styling options.
 * Manages scrolling and animation state for the dropdown menu.
 *
 * @interface SelectContentProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 * @property {'popper' | 'item-aligned'} [position] - Positioning strategy for the dropdown (default: 'popper')
 *
 * @example
 * ```tsx
 * <SelectContent position="popper">
 *   <SelectItem value="opt1">Option 1</SelectItem>
 * </SelectContent>
 * ```
 */
export interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
}
/**
 * Props for SelectLabel component.
 *
 * Renders a visually emphasized label to group related select items.
 * Used within SelectGroup to improve accessibility and organization.
 *
 * @interface SelectLabelProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 */
export interface SelectLabelProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {
}
/**
 * Props for SelectItem component.
 *
 * Defines a single selectable option within the dropdown.
 * Automatically handles selection state and displays checkmark when selected.
 *
 * @interface SelectItemProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 * @property {boolean} [disabled] - Disables the item for selection
 */
export interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
}
/**
 * Props for SelectSeparator component.
 *
 * Visual divider between groups of select items, improving visual organization.
 * Only rendered within SelectContent.
 *
 * @interface SelectSeparatorProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 */
export interface SelectSeparatorProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {
}
/**
 * Props for SelectScrollUpButton and SelectScrollDownButton components.
 *
 * Controls for scrolling content within the dropdown when items exceed container height.
 * Automatically rendered by SelectContent — not typically used directly.
 *
 * @interface SelectScrollButtonProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 */
export interface SelectScrollButtonProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> {
}
declare const Select: React.FC<SelectPrimitive.SelectProps>;
declare const SelectGroup: React.ForwardRefExoticComponent<SelectPrimitive.SelectGroupProps & React.RefAttributes<HTMLDivElement>>;
declare const SelectValue: React.ForwardRefExoticComponent<SelectPrimitive.SelectValueProps & React.RefAttributes<HTMLSpanElement>>;
/**
 * The button that opens/closes the select dropdown menu.
 * Displays the selected value or placeholder text.
 */
/**
 * The button that opens/closes the select dropdown menu.
 * Displays the selected value or placeholder text.
 * Includes a decorative chevron icon that rotates based on open/closed state.
 *
 * @example
 * ```tsx
 * <SelectTrigger>
 *   <SelectValue placeholder="Choose an option" />
 * </SelectTrigger>
 * ```
 */
declare const SelectTrigger: React.MemoExoticComponent<React.ForwardRefExoticComponent<SelectTriggerProps & React.RefAttributes<HTMLButtonElement>>>;
/**
 * Scrolls the content up within the dropdown menu.
 * Appears at the top of SelectContent when items exceed viewport height.
 */
declare const SelectScrollUpButton: React.MemoExoticComponent<React.ForwardRefExoticComponent<SelectScrollButtonProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * Scrolls the content down within the dropdown menu.
 * Appears at the bottom of SelectContent when items exceed viewport height.
 */
declare const SelectScrollDownButton: React.MemoExoticComponent<React.ForwardRefExoticComponent<SelectScrollButtonProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * The dropdown content container that appears when Select is opened.
 * Contains SelectItem options and manages scrolling and positioning.
 * Automatically renders scroll buttons when content exceeds max-height (384px).
 * Includes smooth animations and proper elevation via shadow tokens.
 *
 * @example
 * ```tsx
 * <SelectContent position="popper">
 *   <SelectItem value="option1">Option 1</SelectItem>
 *   <SelectItem value="option2">Option 2</SelectItem>
 * </SelectContent>
 * ```
 */
declare const SelectContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<SelectContentProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * A label for grouping related SelectItems.
 * Used within SelectGroup to improve visual organization and accessibility.
 */
declare const SelectLabel: React.MemoExoticComponent<React.ForwardRefExoticComponent<SelectLabelProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * A selectable option within the dropdown menu.
 * Displays a checkmark when selected.
 * Supports disabled state for non-selectable items.
 * Touch target: 44px height on mobile, 32px on desktop (via padding).
 */
declare const SelectItem: React.MemoExoticComponent<React.ForwardRefExoticComponent<SelectItemProps & React.RefAttributes<HTMLDivElement>>>;
/**
 * A visual divider between groups of SelectItems.
 * Used within SelectContent to improve visual organization between SelectGroup instances.
 * Uses muted background color for subtle visual separation.
 */
declare const SelectSeparator: React.MemoExoticComponent<React.ForwardRefExoticComponent<SelectSeparatorProps & React.RefAttributes<HTMLDivElement>>>;
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton, };
//# sourceMappingURL=select.d.ts.map