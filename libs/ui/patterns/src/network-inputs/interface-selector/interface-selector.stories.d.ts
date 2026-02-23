/**
 * InterfaceSelector Storybook Stories
 *
 * Comprehensive stories demonstrating all features and states
 * of the InterfaceSelector component.
 *
 * @module @nasnet/ui/patterns/network-inputs/interface-selector
 */
import { InterfaceSelector } from './interface-selector';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceSelector>;
export default meta;
type Story = StoryObj<typeof InterfaceSelector>;
/**
 * Default single-select mode with all interface types.
 */
export declare const Default: Story;
/**
 * Multi-select mode allowing multiple interface selection.
 */
export declare const MultiSelect: Story;
/**
 * Filtered to show only Ethernet and Bridge interfaces.
 */
export declare const WithTypeFilter: Story;
/**
 * Pre-selected value demonstration.
 */
export declare const WithPreselectedValue: Story;
/**
 * Multi-select with pre-selected values.
 */
export declare const WithPreselectedMultiple: Story;
/**
 * Demonstrates usage warnings on interfaces that are already in use.
 */
export declare const WithUsageWarnings: Story;
/**
 * Hide interfaces that are already in use.
 */
export declare const ExcludeUsedInterfaces: Story;
/**
 * Desktop presenter with dropdown popover.
 */
export declare const DesktopPresenter: Story;
/**
 * Mobile presenter with bottom sheet.
 * Best viewed in mobile viewport.
 */
export declare const MobilePresenter: Story;
/**
 * Loading state with skeleton placeholders.
 */
export declare const LoadingState: Story;
/**
 * Error state with retry button.
 */
export declare const ErrorState: Story;
/**
 * Empty state when no interfaces are available.
 */
export declare const EmptyState: Story;
/**
 * Disabled state.
 */
export declare const Disabled: Story;
/**
 * With external error message.
 */
export declare const WithError: Story;
/**
 * Accessibility demonstration with proper ARIA attributes.
 */
export declare const Accessibility: Story;
/**
 * VPN interfaces only.
 */
export declare const VPNInterfacesOnly: Story;
/**
 * Wireless interfaces only.
 */
export declare const WirelessInterfacesOnly: Story;
//# sourceMappingURL=interface-selector.stories.d.ts.map