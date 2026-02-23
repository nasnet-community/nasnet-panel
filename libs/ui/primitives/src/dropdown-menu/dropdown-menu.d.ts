import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
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
declare const DropdownMenu: React.FC<DropdownMenuPrimitive.DropdownMenuProps>;
/**
 * Trigger button that opens the dropdown menu.
 * Usually wrapped with `asChild` to attach to custom button components.
 */
declare const DropdownMenuTrigger: React.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuTriggerProps & React.RefAttributes<HTMLButtonElement>>;
/**
 * Group container for logically related menu items.
 * Items within the same group can share a label.
 * Semantic grouping for screen readers and keyboard navigation.
 */
declare const DropdownMenuGroup: React.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuGroupProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Portal for rendering submenu content outside the normal DOM hierarchy.
 * Ensures submenus render at top of z-index stack and don't get clipped.
 */
declare const DropdownMenuPortal: React.FC<DropdownMenuPrimitive.DropdownMenuPortalProps>;
/**
 * Submenu root component.
 * Wraps submenu trigger and content for nested menu support.
 * Use with DropdownMenuPortal for proper z-index handling.
 */
declare const DropdownMenuSub: React.FC<DropdownMenuPrimitive.DropdownMenuSubProps>;
/**
 * Radio button group for mutually exclusive item selections.
 * Only one item can be selected at a time within a group.
 * Wrap DropdownMenuRadioItem children within this group.
 */
declare const DropdownMenuRadioGroup: React.ForwardRefExoticComponent<DropdownMenuPrimitive.DropdownMenuRadioGroupProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Trigger for opening a submenu.
 * Must be used within DropdownMenuSub.
 * Keyboard: Right arrow to open, Left arrow to close, Home/End for first/last item.
 */
declare const DropdownMenuSubTrigger: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubTriggerProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>>;
/**
 * Content container for submenu items.
 * Renders submenu items that appear when DropdownMenuSubTrigger is activated.
 * Typically wrapped in DropdownMenuPortal for z-index stacking.
 */
declare const DropdownMenuSubContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSubContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const DropdownMenuContent: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuContentProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const DropdownMenuItem: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuItemProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>>;
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
declare const DropdownMenuCheckboxItem: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuCheckboxItemProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const DropdownMenuRadioItem: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuRadioItemProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const DropdownMenuLabel: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuLabelProps & React.RefAttributes<HTMLDivElement>, "ref"> & {
    inset?: boolean;
} & React.RefAttributes<HTMLDivElement>>>;
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
declare const DropdownMenuSeparator: React.MemoExoticComponent<React.ForwardRefExoticComponent<Omit<DropdownMenuPrimitive.DropdownMenuSeparatorProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>>;
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
declare const DropdownMenuShortcut: React.MemoExoticComponent<React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & React.RefAttributes<HTMLSpanElement>>>;
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, };
//# sourceMappingURL=dropdown-menu.d.ts.map