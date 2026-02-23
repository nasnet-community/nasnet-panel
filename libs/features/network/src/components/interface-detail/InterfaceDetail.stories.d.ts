/**
 * InterfaceDetail Stories
 *
 * The InterfaceDetail component is a headless + platform presenter wrapper that
 * fetches interface data via GraphQL and delegates rendering to
 * InterfaceDetailDesktop (Sheet panel) or InterfaceDetailMobile (full-screen dialog).
 *
 * Because it depends on Apollo and platform detection, stories target the desktop
 * presenter directly with inline mock data so every state is immediately visible
 * without network or hook setup.
 */
import { InterfaceDetailDesktop } from './InterfaceDetailDesktop';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof InterfaceDetailDesktop>;
export default meta;
type Story = StoryObj<typeof InterfaceDetailDesktop>;
/** Active ethernet interface with full traffic data and IP addresses. */
export declare const EthernetInterface: Story;
/** Bridge interface used by DHCP server — no link-speed or partner info. */
export declare const BridgeInterface: Story;
/** Disabled interface that is administratively down. */
export declare const DisabledInterface: Story;
/** Skeleton loading state while the GraphQL query is in flight. */
export declare const Loading: Story;
/** Error state when the interface query fails (e.g. connection refused). */
export declare const ErrorState: Story;
/** Panel closed — the Sheet should not be visible. */
export declare const Closed: Story;
//# sourceMappingURL=InterfaceDetail.stories.d.ts.map