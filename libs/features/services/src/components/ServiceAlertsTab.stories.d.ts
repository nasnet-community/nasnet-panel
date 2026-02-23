/**
 * Storybook stories for ServiceAlertsTab
 *
 * Platform-agnostic wrapper implementing Headless + Platform Presenters (ADR-018).
 * Automatically selects:
 * - Mobile (<640px): Card-based list with swipe-to-acknowledge and 44px touch targets
 * - Tablet/Desktop (>=640px): DataTable with sortable columns and bulk operations
 *
 * Because this component fetches data via Apollo Client (useServiceAlertsTab hook),
 * stories demonstrate the visual API surface and props. Use MSW or Apollo mocks
 * in your test environment for full data-driven stories.
 */
import { ServiceAlertsTab } from './ServiceAlertsTab';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServiceAlertsTab>;
export default meta;
type Story = StoryObj<typeof ServiceAlertsTab>;
/**
 * Default view for an Xray VPN service instance.
 * Shows the desktop DataTable layout in standard sizing.
 */
export declare const Default: Story;
/**
 * Alerts tab for a Tor service instance.
 * Demonstrates that the component works with any service instance ID.
 */
export declare const TorServiceAlerts: Story;
/**
 * Alerts for an AdGuard Home instance on a secondary router.
 * Tests cross-router usage with a different routerId.
 */
export declare const SecondaryRouterInstance: Story;
/**
 * Mobile viewport — renders ServiceAlertsTabMobile with card layout.
 * Card-based presentation with swipe-to-acknowledge and 44px touch targets.
 */
export declare const MobileViewport: Story;
/**
 * Tablet viewport — uses the Desktop presenter (>= 640px threshold).
 */
export declare const TabletViewport: Story;
/**
 * With a custom CSS class for embedding in a wider page container.
 */
export declare const WithCustomClass: Story;
//# sourceMappingURL=ServiceAlertsTab.stories.d.ts.map