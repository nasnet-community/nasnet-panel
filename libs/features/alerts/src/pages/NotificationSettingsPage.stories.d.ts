/**
 * Storybook stories for NotificationSettingsPage
 *
 * Full notification configuration UI. The page is divided into two sections:
 *
 * 1. Quiet Hours – global schedule for suppressing alert delivery.
 * 2. Notification Channels – tabbed forms for Email (SMTP), Telegram Bot,
 *    Pushover, and Webhook channel configuration, each with a "Test
 *    Notification" action button that shows success / failure feedback inline.
 *
 * Each channel form is a self-contained sub-component; individual sub-component
 * stories live alongside their source files.
 *
 * Per Task 6.1 / NAS-18 — NotificationSettingsPage feature implementation.
 */
import { NotificationSettingsPage } from './NotificationSettingsPage';
import type { Meta, StoryObj } from '@storybook/react';
declare const meta: Meta<typeof NotificationSettingsPage>;
export default meta;
type Story = StoryObj<typeof NotificationSettingsPage>;
/**
 * Default
 *
 * Page rendered with the Email channel tab active (initial state).
 * Includes the Quiet Hours section at the top followed by the channel tabs.
 * Actual persisted values depend on the MSW / Apollo mock environment.
 */
export declare const Default: Story;
/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). The channel tab bar wraps and the channel forms
 * fill full-screen width. Input fields keep the 44px accessible touch targets
 * required by WCAG AAA.
 */
export declare const MobileViewport: Story;
/**
 * Tablet Viewport
 *
 * Mid-range viewport (640–1024px). The page max-width (4xl) constrains the
 * form to a readable column width. The channel tab bar sits in a single row.
 */
export declare const TabletViewport: Story;
/**
 * Desktop Viewport
 *
 * Wide viewport (>1024px). The page is centered within its max-width container.
 * All four channel tabs are visible in the tab bar without overflow.
 * The Pushover usage progress bar, Telegram instruction list, and webhook
 * feature summary are fully visible.
 */
export declare const DesktopViewport: Story;
//# sourceMappingURL=NotificationSettingsPage.stories.d.ts.map