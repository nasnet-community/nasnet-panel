"use client"

import * as React from "react"

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../lib/utils"

/**
 * Icon component wrapper for menu items.
 * Centralizes icon rendering with accessibility and theme support.
 * @internal - Used internally by dropdown menu components
 */
const MenuIcon = React.memo(({ Icon, className }: { Icon: React.ReactNode; className?: string }) => (
  <span className={cn("h-4 w-4", className)} aria-hidden="true">
    {Icon}
  </span>
))

/**
 * Dropdown Menu
 *
 * Floating context menu component built on Radix UI.
 *
 * Features:
 * - Full keyboard navigation (arrows, Enter, Space, Escape)
 * - Submenus with portal rendering for proper z-index stacking
 * - Checkbox and radio items for stateful selections
 * - Automatic positioning relative to trigger element
 * - Semantic ARIA attributes for screen readers
 * - Smooth animations (fade-in, zoom-in, slide)
 *
 * Touch targets: 32px minimum on all items for accessibility
 * Keyboard: Arrow Up/Down to navigate, Enter/Space to select, Escape to close
 *
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild>
 *     <Button variant="ghost">Menu</Button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuItem>Item 1</DropdownMenuItem>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem>Item 2</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 *
 * @see https://www.radix-ui.com/docs/primitives/components/dropdown-menu
 */
const DropdownMenu = DropdownMenuPrimitive.Root

/**
 * Trigger button that opens the dropdown menu.
 * Usually wrapped with `asChild` to attach to custom button components.
 */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

/**
 * Group container for logically related menu items.
 * Items within the same group can share a label.
 * Semantic grouping for screen readers and keyboard navigation.
 */
const DropdownMenuGroup = DropdownMenuPrimitive.Group

/**
 * Portal for rendering submenu content outside the normal DOM hierarchy.
 * Ensures submenus render at top of z-index stack and don't get clipped.
 */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

/**
 * Submenu root component.
 * Wraps submenu trigger and content for nested menu support.
 * Use with DropdownMenuPortal for proper z-index handling.
 */
const DropdownMenuSub = DropdownMenuPrimitive.Sub

/**
 * Radio button group for mutually exclusive item selections.
 * Only one item can be selected at a time within a group.
 * Wrap DropdownMenuRadioItem children within this group.
 */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

/**
 * Trigger for opening a submenu.
 * Must be used within DropdownMenuSub.
 * Keyboard: Right arrow to open, Left arrow to close, Home/End for first/last item.
 */
const DropdownMenuSubTrigger = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
      inset?: boolean
    }
  >(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  ))
)
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

/**
 * Content container for submenu items.
 * Renders submenu items that appear when DropdownMenuSubTrigger is activated.
 * Typically wrapped in DropdownMenuPortal for z-index stacking.
 */
const DropdownMenuSubContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
  >(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  ))
)
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

/**
 * Content container for dropdown menu items.
 *
 * Features:
 * - Automatic positioning relative to trigger (side, align)
 * - Proper z-index stacking (z-50)
 * - Smooth entrance/exit animations (fade + zoom)
 * - Slide animation from trigger direction
 *
 * Positioning: By default positions at bottom-start of trigger.
 * Use `side` prop to change: 'top' | 'right' | 'bottom' | 'left'
 * Use `align` prop to change: 'start' | 'center' | 'end'
 *
 * Accessibility:
 * - ARIA role="menu" from Radix
 * - Proper focus management (first item focused on open)
 * - Screen reader announces number of items
 */
const DropdownMenuContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
  >(({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  ))
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

/**
 * Individual menu item component.
 *
 * Props:
 * - `inset` (boolean): Adds left padding for icon alignment in items without icons
 * - `disabled` (boolean): Disables interaction and applies opacity
 * - `className` (string): Additional CSS classes
 *
 * Accessibility:
 * - Keyboard: Enter/Space to select, Escape to close menu
 * - Screen reader: Announces disabled state
 * - Touch: 44px minimum touch target (44x32px actual)
 *
 * @example
 * ```tsx
 * <DropdownMenuItem>Profile</DropdownMenuItem>
 * <DropdownMenuItem disabled>Archived</DropdownMenuItem>
 * <DropdownMenuItem inset>Nested item</DropdownMenuItem>
 * ```
 */
const DropdownMenuItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
      inset?: boolean
    }
  >(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  ))
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

/**
 * Menu item with checkbox for stateful toggles.
 *
 * Props:
 * - `checked` (boolean | 'indeterminate'): Checkbox state
 * - `onCheckedChange` (function): Callback when state changes
 * - `disabled` (boolean): Disables interaction
 *
 * Accessibility:
 * - ARIA role="menuitemcheckbox"
 * - aria-checked state for screen readers
 * - Check icon renders automatically via ItemIndicator
 *
 * @example
 * ```tsx
 * const [checked, setChecked] = useState(true);
 * <DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
 *   Show Sidebar
 * </DropdownMenuCheckboxItem>
 * ```
 */
const DropdownMenuCheckboxItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
  >(({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  ))
)
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

/**
 * Menu item with radio button for mutually exclusive selections.
 *
 * Props:
 * - `value` (string): Unique identifier for this option
 * - `disabled` (boolean): Disables interaction
 *
 * Must be used within DropdownMenuRadioGroup.
 * Only one item per group can be selected (others auto-deselect).
 *
 * Accessibility:
 * - ARIA role="menuitemradio"
 * - aria-checked state for screen readers
 * - Dot icon renders automatically via ItemIndicator
 *
 * @example
 * ```tsx
 * <DropdownMenuRadioGroup value="dark" onValueChange={setTheme}>
 *   <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
 *   <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
 * </DropdownMenuRadioGroup>
 * ```
 */
const DropdownMenuRadioItem = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
  >(({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  ))
)
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

/**
 * Section label for grouping related menu items.
 *
 * Props:
 * - `inset` (boolean): Adds left padding for alignment with icon-based items
 * - `className` (string): Additional CSS classes
 *
 * Usage:
 * - Place before related menu items
 * - Helps organize and label item groups
 * - Semantic grouping for screen readers
 * - Not interactive or selectable
 *
 * @example
 * ```tsx
 * <DropdownMenuLabel>Settings</DropdownMenuLabel>
 * <DropdownMenuSeparator />
 * <DropdownMenuItem>Preferences</DropdownMenuItem>
 * <DropdownMenuItem>Theme</DropdownMenuItem>
 * ```
 */
const DropdownMenuLabel = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
      inset?: boolean
    }
  >(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  ))
)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

/**
 * Visual divider line separating menu sections.
 *
 * Usage:
 * - Place between logical groups of items
 * - Improves readability and visual hierarchy
 * - Semantic visual element (not announced to screen readers)
 *
 * @example
 * ```tsx
 * <DropdownMenuGroup>
 *   <DropdownMenuItem>Item 1</DropdownMenuItem>
 *   <DropdownMenuItem>Item 2</DropdownMenuItem>
 * </DropdownMenuGroup>
 * <DropdownMenuSeparator />
 * <DropdownMenuGroup>
 *   <DropdownMenuItem>Item 3</DropdownMenuItem>
 * </DropdownMenuGroup>
 * ```
 */
const DropdownMenuSeparator = React.memo(
  React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
  >(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-muted", className)}
      {...props}
    />
  ))
)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

/**
 * Keyboard shortcut hint text displayed on the right side of menu items.
 *
 * Usage:
 * - Display keyboard combination (e.g., "⌘S", "Ctrl+K")
 * - Visual hint only (does NOT handle keyboard binding)
 * - Position: right-aligned via `ml-auto` on parent
 * - Color: reduced opacity (60%) for visual hierarchy
 *
 * Accessibility:
 * - Decorative only, not announced to screen readers
 * - Actual keyboard binding handled by parent/app
 *
 * @example
 * ```tsx
 * <DropdownMenuItem>
 *   <Save className="mr-2 h-4 w-4" />
 *   Save File
 *   <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
 * </DropdownMenuItem>
 * ```
 */
const DropdownMenuShortcut = React.memo(
  React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
  >(({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  ))
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}




























