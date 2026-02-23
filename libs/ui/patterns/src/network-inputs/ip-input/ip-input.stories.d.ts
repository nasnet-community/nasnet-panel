/**
 * IPInput Storybook Stories
 *
 * Comprehensive stories demonstrating the IP address input component
 * across different states, configurations, and platforms.
 *
 * @module @nasnet/ui/patterns/network-inputs/ip-input
 */
import { IPInput } from './ip-input';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof IPInput>;
export default meta;
type Story = StoryObj<typeof IPInput>;
/**
 * Default empty IP input.
 */
export declare const Default: Story;
/**
 * Pre-filled with a valid IPv4 address.
 */
export declare const WithValidIPv4: Story;
/**
 * Private IP address with type badge displayed.
 */
export declare const PrivateIPWithType: Story;
/**
 * Public IP address with type badge displayed.
 */
export declare const PublicIPWithType: Story;
/**
 * Loopback address with type badge.
 */
export declare const LoopbackIP: Story;
/**
 * Link-local address with type badge.
 */
export declare const LinkLocalIP: Story;
/**
 * Multicast address with type badge.
 */
export declare const MulticastIP: Story;
/**
 * IP with CIDR suffix support enabled.
 */
export declare const WithCIDRSuffix: Story;
/**
 * Empty CIDR input for entering subnet.
 */
export declare const EmptyCIDR: Story;
/**
 * IP input with an external error message.
 */
export declare const ErrorState: Story;
/**
 * Disabled IP input.
 */
export declare const Disabled: Story;
/**
 * Required field indicator.
 */
export declare const Required: Story;
/**
 * Desktop presenter directly (4-segment input).
 */
export declare const DesktopPresenter: Story;
/**
 * Mobile presenter directly (single input with 44px touch target).
 */
export declare const MobilePresenter: Story;
/**
 * Accessibility test story with a11y addon enabled.
 */
export declare const Accessibility: Story;
/**
 * All IP type classifications displayed.
 */
export declare const AllIPTypes: Story;
//# sourceMappingURL=ip-input.stories.d.ts.map