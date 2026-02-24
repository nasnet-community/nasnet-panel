/**
 * Storybook stories for AddToAddressListContextMenu
 *
 * Demonstrates the right-click / click-triggered dropdown context menu
 * for quickly adding an IP address to an existing or new firewall address list.
 *
 * Click the trigger element (the styled IP span) to open the dropdown.
 */
import { AddToAddressListContextMenu } from './AddToAddressListContextMenu';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof AddToAddressListContextMenu>;
export default meta;
type Story = StoryObj<typeof AddToAddressListContextMenu>;
/**
 * Default — common IP with a set of existing lists and a successful callback.
 */
export declare const Default: Story;
/**
 * No existing lists — only the "Create new list" option is shown.
 */
export declare const NoExistingLists: Story;
/**
 * Many lists — the sub-menu is scrollable at max-height 300px.
 */
export declare const ManyLists: Story;
/**
 * IPv6-style address string — verifies the component is not IP-version specific.
 */
export declare const Ipv6Address: Story;
/**
 * Failure callback — simulates a router error so the destructive toast is shown.
 */
export declare const AddFailure: Story;
/**
 * No callback provided — verifies the component handles missing onAddToList gracefully.
 */
export declare const NoCallback: Story;
//# sourceMappingURL=AddToAddressListContextMenu.stories.d.ts.map