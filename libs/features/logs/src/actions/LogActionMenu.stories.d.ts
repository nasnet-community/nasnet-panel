import { LogActionMenu } from './LogActionMenu';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof LogActionMenu>;
export default meta;
type Story = StoryObj<typeof LogActionMenu>;
/**
 * Firewall topic — shows "View Firewall Rule", "Add IP to Whitelist", "Block IP Address"
 * plus the common actions. The IP 203.0.113.42 will be extracted from the message.
 */
export declare const FirewallEntry: Story;
/**
 * DHCP topic — shows "View DHCP Lease" and "Make Lease Static".
 */
export declare const DhcpEntry: Story;
/**
 * Wireless topic — shows "View Wireless Client" and "Disconnect Client".
 */
export declare const WirelessEntry: Story;
/**
 * System topic — no topic-specific actions; only common actions are shown.
 */
export declare const SystemEntryCommonOnly: Story;
/**
 * Interface topic — shows "View Interface" plus common actions.
 */
export declare const InterfaceEntry: Story;
/**
 * Bookmarked state — the Bookmark menu item switches to "Remove Bookmark"
 * and the Pin icon is filled with the primary color.
 */
export declare const Bookmarked: Story;
/**
 * Custom trigger slot — replace the default MoreVertical icon with an explicit button.
 */
export declare const CustomTrigger: Story;
//# sourceMappingURL=LogActionMenu.stories.d.ts.map