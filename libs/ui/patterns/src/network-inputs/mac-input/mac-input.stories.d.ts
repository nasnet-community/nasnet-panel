/**
 * MAC Address Input Storybook Stories
 *
 * Demonstrates all features and states of the MACInput component.
 *
 * @module @nasnet/ui/patterns/network-inputs/mac-input
 */
import { MACInput } from './mac-input';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof MACInput>;
export default meta;
type Story = StoryObj<typeof MACInput>;
/**
 * Default empty state with colon format.
 */
export declare const Default: Story;
/**
 * With a valid MAC address in colon format.
 */
export declare const WithValidMAC_Colon: Story;
/**
 * With a valid MAC address in dash format.
 */
export declare const WithValidMAC_Dash: Story;
/**
 * With a valid MAC address in Cisco dot format.
 */
export declare const WithValidMAC_Dot: Story;
/**
 * With vendor lookup enabled showing VMware.
 */
export declare const WithVendorLookup_VMware: Story;
/**
 * With vendor lookup enabled showing MikroTik.
 */
export declare const WithVendorLookup_MikroTik: Story;
/**
 * With vendor lookup showing unknown vendor.
 */
export declare const WithVendorLookup_Unknown: Story;
/**
 * With external error state.
 */
export declare const WithError: Story;
/**
 * Disabled input state.
 */
export declare const Disabled: Story;
/**
 * With label and required indicator.
 */
export declare const WithLabel: Story;
/**
 * Desktop presenter explicitly.
 */
export declare const DesktopVariant: Story;
/**
 * Mobile presenter explicitly (44px touch target, vendor below).
 */
export declare const MobileVariant: Story;
/**
 * Interactive demo with all features.
 */
export declare const InteractiveDemo: Story;
/**
 * With aria-describedby for help text integration.
 */
export declare const WithHelpText: Story;
//# sourceMappingURL=mac-input.stories.d.ts.map