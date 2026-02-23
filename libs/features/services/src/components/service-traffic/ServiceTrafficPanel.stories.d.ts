/**
 * Storybook stories for ServiceTrafficPanel
 *
 * Platform wrapper (Headless + Platform Presenters pattern, ADR-018).
 * Renders ServiceTrafficPanelDesktop or ServiceTrafficPanelMobile based on viewport.
 *
 * Because this component fetches live data via Apollo Client, stories
 * use decorators that mock the Apollo provider and demonstrate the
 * visual shape with static props.
 */
import { ServiceTrafficPanel } from './ServiceTrafficPanel';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof ServiceTrafficPanel>;
export default meta;
type Story = StoryObj<typeof ServiceTrafficPanel>;
/**
 * Default panel showing an Xray VPN service with 24-hour history window.
 * Requires a connected Apollo Client — will show loading state in isolation.
 */
export declare const Default: Story;
/**
 * Tor anonymity service traffic panel.
 * Demonstrates a different service type with a 6-hour history.
 */
export declare const TorService: Story;
/**
 * Long history window of 7 days (168 hours).
 * Tests that the panel handles large historical datasets correctly.
 */
export declare const WeeklyHistory: Story;
/**
 * Mobile viewport presentation.
 * Demonstrates the stacked card layout with 44px touch targets.
 */
export declare const MobileViewport: Story;
/**
 * Panel without a close callback — used when embedded directly in a page
 * rather than shown as an overlay or modal.
 */
export declare const EmbeddedNoClose: Story;
/**
 * Custom CSS class passed to apply full-width layout in a parent container.
 */
export declare const FullWidth: Story;
//# sourceMappingURL=ServiceTrafficPanel.stories.d.ts.map