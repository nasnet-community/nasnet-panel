/**
 * InterfaceSelectorDesktop Storybook Stories
 *
 * Desktop-specific stories for the InterfaceSelectorDesktop presenter.
 * Focuses on desktop-exclusive features: popover layout, keyboard shortcuts,
 * chip rendering for multi-select, and hookOverride-driven state control.
 *
 * The shared InterfaceSelector stories (interface-selector.stories.tsx) cover
 * the auto-detecting wrapper. These stories are scoped to the desktop presenter
 * and its unique visual states.
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */
import { InterfaceSelectorDesktop } from './interface-selector-desktop';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceSelectorDesktop>;
export default meta;
type Story = StoryObj<typeof InterfaceSelectorDesktop>;
/**
 * Single-select mode — selecting an interface updates the trigger label.
 */
export declare const SingleSelect: Story;
/**
 * Multi-select mode — selected interfaces appear as removable chips below the trigger.
 */
export declare const MultiSelect: Story;
/**
 * Pre-selected value — the trigger shows the selected interface name on mount.
 */
export declare const WithPreselectedValue: Story;
/**
 * Multi-select with several interfaces pre-selected — chip rail is visible immediately.
 */
export declare const WithPreselectedMultiple: Story;
/**
 * Popover open — Loading state with skeleton placeholders inside the dropdown.
 */
export declare const PopoverLoadingState: Story;
/**
 * Popover open — Error state with retry button.
 */
export declare const PopoverErrorState: Story;
/**
 * Popover open — Empty results when no interfaces match the current filter.
 */
export declare const PopoverEmptyState: Story;
/**
 * Disabled state — trigger is grayed out and non-interactive.
 */
export declare const DisabledState: Story;
/**
 * External validation error — red border on trigger, error message below.
 */
export declare const WithExternalError: Story;
/**
 * Type-restricted mode — type filter hidden because types prop limits to ethernet only.
 */
export declare const TypeRestricted: Story;
//# sourceMappingURL=interface-selector-desktop.stories.d.ts.map