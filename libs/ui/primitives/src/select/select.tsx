import * as React from 'react';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '../lib/utils';

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
export interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {}

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
export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {}

/**
 * Props for SelectLabel component.
 *
 * Renders a visually emphasized label to group related select items.
 * Used within SelectGroup to improve accessibility and organization.
 *
 * @interface SelectLabelProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 */
export interface SelectLabelProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {}

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
export interface SelectItemProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {}

/**
 * Props for SelectSeparator component.
 *
 * Visual divider between groups of select items, improving visual organization.
 * Only rendered within SelectContent.
 *
 * @interface SelectSeparatorProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 */
export interface SelectSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {}

/**
 * Props for SelectScrollUpButton and SelectScrollDownButton components.
 *
 * Controls for scrolling content within the dropdown when items exceed container height.
 * Automatically rendered by SelectContent — not typically used directly.
 *
 * @interface SelectScrollButtonProps
 * @property {string} [className] - Additional CSS classes to merge with component styles
 */
export interface SelectScrollButtonProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> {}

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

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
const SelectTrigger = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    SelectTriggerProps
  >(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-[var(--component-input-height)] w-full items-center justify-between whitespace-nowrap rounded-[var(--semantic-radius-input)] border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  ))
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * Scrolls the content up within the dropdown menu.
 * Appears at the top of SelectContent when items exceed viewport height.
 */
const SelectScrollUpButton = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
    SelectScrollButtonProps
  >(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronUp className="h-4 w-4" aria-hidden="true" />
    </SelectPrimitive.ScrollUpButton>
  ))
);
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/**
 * Scrolls the content down within the dropdown menu.
 * Appears at the bottom of SelectContent when items exceed viewport height.
 */
const SelectScrollDownButton = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
    SelectScrollButtonProps
  >(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </SelectPrimitive.ScrollDownButton>
  ))
);
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

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
const SelectContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    SelectContentProps
  >(({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-[var(--semantic-radius-input)] border border-border bg-popover text-popover-foreground shadow-[var(--semantic-shadow-dropdown)] transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  ))
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * A label for grouping related SelectItems.
 * Used within SelectGroup to improve visual organization and accessibility.
 */
const SelectLabel = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    SelectLabelProps
  >(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
      ref={ref}
      className={cn('px-3 py-2 text-sm font-semibold text-muted-foreground', className)}
      {...props}
    />
  ))
);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * A selectable option within the dropdown menu.
 * Displays a checkmark when selected.
 * Supports disabled state for non-selectable items.
 * Touch target: 44px height on mobile, 32px on desktop (via padding).
 */
const SelectItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    SelectItemProps
  >(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-2 px-3 text-sm outline-none transition-colors duration-150 hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  ))
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

/**
 * A visual divider between groups of SelectItems.
 * Used within SelectContent to improve visual organization between SelectGroup instances.
 * Uses muted background color for subtle visual separation.
 */
const SelectSeparator = React.memo(
  React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    SelectSeparatorProps
  >(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
      ref={ref}
      className={cn('my-1 h-px bg-border', className)}
      {...props}
    />
  ))
);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
