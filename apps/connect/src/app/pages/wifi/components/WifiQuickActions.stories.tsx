/**
 * WifiQuickActions Stories
 *
 * Action bar with Refresh and Restart WiFi buttons.
 * The Restart button opens a confirmation dialog before proceeding.
 * Prop-driven — no stores or routing required.
 */

import { WifiQuickActions } from './WifiQuickActions';

import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof WifiQuickActions> = {
  title: 'App/WiFi/WifiQuickActions',
  component: WifiQuickActions,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Action bar displayed in the WiFi Dashboard header. ' +
          'Contains two buttons: ' +
          '"Refresh" (neutral style, calls `onRefresh`, shows spinning icon while `isRefreshing` is true) ' +
          'and "Restart WiFi" (amber warning style, opens a safety confirmation dialog). ' +
          'The dialog warns that all wireless clients will be temporarily disconnected ' +
          'and requires explicit "Restart" confirmation before proceeding.',
      },
    },
  },
  argTypes: {
    isRefreshing: {
      control: 'boolean',
      description: 'Disables the Refresh button and spins the icon while true',
    },
    onRefresh: { action: 'onRefresh' },
  },
};

export default meta;
type Story = StoryObj<typeof WifiQuickActions>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    onRefresh: () => undefined,
    isRefreshing: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Idle state. Both buttons are enabled. ' +
          '"Refresh" uses a neutral border style; "Restart WiFi" uses an amber warning style.',
      },
    },
  },
};

export const Refreshing: Story = {
  args: {
    onRefresh: () => undefined,
    isRefreshing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Active refresh in progress. The Refresh button is disabled and the RefreshCw icon spins. ' +
          'The Restart WiFi button remains enabled.',
      },
    },
  },
};

export const WithRestartDialogOpen: Story = {
  args: {
    onRefresh: () => undefined,
    isRefreshing: false,
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking "Restart WiFi" to open the dialog
    const restartBtn = canvasElement.querySelector<HTMLButtonElement>('button:last-of-type');
    restartBtn?.click();
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clicking "Restart WiFi" opens the safety confirmation dialog. ' +
          'The dialog overlays the page with a semi-transparent backdrop, ' +
          'displays a warning message, and offers "Cancel" and "Restart" actions.',
      },
    },
  },
};

export const RefreshingWithRestartAvailable: Story = {
  args: {
    onRefresh: () => undefined,
    isRefreshing: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Verifies that the Restart WiFi button remains fully interactive ' +
          'even when a data refresh is already in progress.',
      },
    },
  },
};

export const Mobile: Story = {
  args: {
    onRefresh: () => undefined,
    isRefreshing: false,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    onRefresh: () => undefined,
    isRefreshing: false,
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
