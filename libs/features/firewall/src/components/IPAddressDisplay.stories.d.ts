/**
 * Storybook stories for IPAddressDisplay
 *
 * Renders an IP address as a badge or plain text with optional context-menu
 * support (right-click on desktop, long-press on mobile) for adding the
 * address to firewall address lists.
 *
 * Note: The component uses usePlatform() and the AddToAddressListContextMenu
 * which are network-aware. In Storybook we render with showContextMenu=false
 * for static stories and leave it enabled for interaction stories.
 */
import { IPAddressDisplay } from './IPAddressDisplay';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof IPAddressDisplay>;
export default meta;
type Story = StoryObj<typeof IPAddressDisplay>;
/**
 * Default badge display — no label, no context menu.
 */
export declare const Default: Story;
/**
 * Badge with a descriptive label prepended.
 */
export declare const BadgeWithLabel: Story;
/**
 * Plain text variant — useful in dense table cells.
 */
export declare const PlainText: Story;
/**
 * IPv6 address in badge form.
 */
export declare const IPv6Address: Story;
/**
 * Multiple addresses side by side — shows how they look in a table row.
 */
export declare const MultipleAddresses: Story;
/**
 * Context menu enabled — right-click to open the "Add to Address List" menu
 * when running inside a real browser context (not all Storybook environments
 * support the Radix ContextMenu).
 */
export declare const WithContextMenu: Story;
//# sourceMappingURL=IPAddressDisplay.stories.d.ts.map