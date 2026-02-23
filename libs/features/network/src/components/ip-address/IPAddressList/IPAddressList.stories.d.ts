/**
 * IPAddressList Stories
 *
 * IPAddressList is a headless + platform-presenter wrapper. It auto-selects
 * IPAddressListDesktop (DataTable) or IPAddressListMobile (card list) depending
 * on the active viewport.
 *
 * All stories pass data directly as props — no GraphQL required.
 */
import { IPAddressList } from './IPAddressList';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof IPAddressList>;
export default meta;
type Story = StoryObj<typeof IPAddressList>;
/** Full list with static, dynamic, disabled, and invalid entries. */
export declare const Default: Story;
/** Skeleton rows displayed while the query is in flight. */
export declare const Loading: Story;
/** Empty state when no IP addresses are configured on the router. */
export declare const Empty: Story;
/** Error banner when the GraphQL query fails. */
export declare const ErrorState: Story;
/** Only a single IP address — useful for checking footer count and layout. */
export declare const SingleEntry: Story;
/** Mobile card layout — each IP address renders as a tappable card. */
export declare const MobileView: Story;
//# sourceMappingURL=IPAddressList.stories.d.ts.map