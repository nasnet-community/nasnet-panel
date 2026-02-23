/**
 * WANManagementPage Storybook Stories
 *
 * Page-level stories for the WAN Management page (NAS-6.8).
 *
 * NOTE: WANManagementPage reads the router ID from the URL via `useParams` and subscribes
 * to real-time WAN events via `useWANSubscription`. In Storybook these dependencies require
 * global decorators (router context stub + Apollo MockedProvider). The stories below focus
 * on the distinct visual layouts and tab states that the page can present.
 *
 * For interactive E2E testing see the Playwright test suite.
 */
import { WANManagementPage } from './WANManagementPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof WANManagementPage>;
export default meta;
type Story = StoryObj<typeof WANManagementPage>;
/**
 * Default – page mounted as the router would render it. Because `useParams` is
 * called with `strict: false` the page silently falls back to an undefined
 * routerId in Storybook and skips the WAN subscription.
 *
 * The Overview tab is active; both built-in mock WANs (PPPoE connected +
 * DHCP disconnected) are displayed via the WANOverviewList component.
 */
export declare const Default: Story;
/**
 * OverviewTab – default view showing the WAN overview list. Identical to
 * Default but documents the tab content explicitly.
 */
export declare const OverviewTab: Story;
/**
 * MobileViewport – full page at 375 px. WANOverviewList switches to its compact
 * card layout and the Add WAN button is still accessible.
 */
export declare const MobileViewport: Story;
/**
 * TabletViewport – intermediate 768 px viewport.
 */
export declare const TabletViewport: Story;
//# sourceMappingURL=WANManagementPage.stories.d.ts.map