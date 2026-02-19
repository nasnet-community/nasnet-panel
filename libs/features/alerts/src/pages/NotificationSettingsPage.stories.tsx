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

import type { Meta, StoryObj } from '@storybook/react';
import { NotificationSettingsPage } from './NotificationSettingsPage';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof NotificationSettingsPage> = {
  title: 'Pages/Alerts/NotificationSettingsPage',
  component: NotificationSettingsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Notification Settings page (Task 6.1). ' +
          'Allows operators to configure alert delivery channels ' +
          '(Email/SMTP, Telegram Bot, Pushover, Webhook) and define global ' +
          'quiet-hour windows during which alert delivery is suppressed. ' +
          'Each channel card includes setup instructions, credential inputs ' +
          'with inline validation, and a "Test Notification" button that shows ' +
          'live success/error feedback. ' +
          'Webhook configuration links out to a dedicated route with advanced ' +
          'template and authentication options. ' +
          'The Pushover form includes an API usage progress bar with ' +
          'near-limit and exceeded warnings. ' +
          'The Telegram form supports multi-chat delivery via newline-separated ' +
          'Chat IDs. ' +
          'The component has no props — it manages its own state and fetches ' +
          'channel config via the useNotificationChannels hook.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotificationSettingsPage>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Default
 *
 * Page rendered with the Email channel tab active (initial state).
 * Includes the Quiet Hours section at the top followed by the channel tabs.
 * Actual persisted values depend on the MSW / Apollo mock environment.
 */
export const Default: Story = {};

/**
 * Mobile Viewport
 *
 * Narrow viewport (<640px). The channel tab bar wraps and the channel forms
 * fill full-screen width. Input fields keep the 44px accessible touch targets
 * required by WCAG AAA.
 */
export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile breakpoint (<640px). Channel tab buttons are touch-friendly; ' +
          'form inputs use full-width layout with adequate spacing.',
      },
    },
  },
};

/**
 * Tablet Viewport
 *
 * Mid-range viewport (640–1024px). The page max-width (4xl) constrains the
 * form to a readable column width. The channel tab bar sits in a single row.
 */
export const TabletViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story:
          'Tablet breakpoint (640–1024px). Form fills available width up to ' +
          'the max-w-4xl constraint; Quiet Hours and channel sections are ' +
          'clearly separated.',
      },
    },
  },
};

/**
 * Desktop Viewport
 *
 * Wide viewport (>1024px). The page is centered within its max-width container.
 * All four channel tabs are visible in the tab bar without overflow.
 * The Pushover usage progress bar, Telegram instruction list, and webhook
 * feature summary are fully visible.
 */
export const DesktopViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop breakpoint (>1024px). Full channel-tab bar, full instruction ' +
          'panels, and the Quiet Hours configuration visible in a single scroll. ' +
          'The centered max-w-4xl layout ensures readable line lengths.',
      },
    },
  },
};
