/**
 * Storybook stories for ReadOnlyNotice
 *
 * Displays an informational banner explaining that firewall editing is disabled
 * in Phase 0. The banner is dismissible with localStorage persistence.
 */

import { ReadOnlyNotice } from './ReadOnlyNotice';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ReadOnlyNotice> = {
  title: 'Features/Firewall/ReadOnlyNotice',
  component: ReadOnlyNotice,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a dismissible informational banner at the top of the Firewall tab explaining that editing is disabled in Phase 0 and that Phase 1 will introduce the Safety Pipeline.',
      },
    },
  },
  decorators: [
    (Story) => {
      // Clear the localStorage key so the banner always renders in Storybook
      localStorage.removeItem('nasnet:firewall:notice-dismissed');
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof ReadOnlyNotice>;

/**
 * Default state — banner is fully visible and dismissible.
 */
export const Default: Story = {
  args: {},
};

/**
 * With an extra className applied to the wrapper.
 */
export const WithCustomClass: Story = {
  args: {
    className: 'max-w-xl',
  },
};

/**
 * Narrow container to verify text wrapping behaviour on mobile viewports.
 */
export const NarrowContainer: Story = {
  args: {},
  decorators: [
    (Story) => {
      localStorage.removeItem('nasnet:firewall:notice-dismissed');
      return (
        <div style={{ maxWidth: 340 }}>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Wide container — simulates a full-page desktop layout.
 */
export const WideContainer: Story = {
  args: {},
  decorators: [
    (Story) => {
      localStorage.removeItem('nasnet:firewall:notice-dismissed');
      return (
        <div style={{ maxWidth: 900 }}>
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Dark-mode preview. Toggle your Storybook theme to dark to see the inverted
 * blue palette in action.
 */
export const DarkMode: Story = {
  args: {
    className: 'max-w-2xl',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    themes: { default: 'dark' },
  },
  decorators: [
    (Story) => {
      localStorage.removeItem('nasnet:firewall:notice-dismissed');
      return (
        <div className="dark">
          <Story />
        </div>
      );
    },
  ],
};

/**
 * Shows the notice embedded inside a realistic page section.
 */
export const InPageContext: Story = {
  args: {},
  decorators: [
    (Story) => {
      localStorage.removeItem('nasnet:firewall:notice-dismissed');
      return (
        <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-xl">
          <h1 className="text-xl font-semibold">Firewall Configuration</h1>
          <Story />
          <p className="text-sm text-muted-foreground">
            The rest of the firewall rules would appear below this notice.
          </p>
        </div>
      );
    },
  ],
};
