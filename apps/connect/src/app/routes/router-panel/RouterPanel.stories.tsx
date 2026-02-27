import { RouterPanel } from './RouterPanel';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RouterPanel> = {
  title: 'App/RouterPanel/RouterPanel',
  component: RouterPanel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '1200px', minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    routerId: 'router-001',
  },
};

export default meta;
type Story = StoryObj<typeof RouterPanel>;

/**
 * Default RouterPanel layout with header, navigation, and content area
 */
export const Default: Story = {
  render: (args) => (
    <RouterPanel {...args}>
      <div className="p-6">
        <h2>Tab Content</h2>
        <p>This is placeholder content for a router tab.</p>
      </div>
    </RouterPanel>
  ),
};

/**
 * RouterPanel showing credential dialog when no saved credentials exist
 */
export const WithCredentialDialog: Story = {
  render: (args) => (
    <RouterPanel {...args}>
      <div className="p-6">
        <h2>Tab Content</h2>
        <p>Credential dialog should be visible.</p>
      </div>
    </RouterPanel>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'RouterPanel displays credential dialog when user needs to authenticate with the router for batch job execution.',
      },
    },
  },
};

/**
 * RouterPanel in mobile responsive layout
 */
export const MobileView: Story = {
  render: (args) => (
    <RouterPanel {...args}>
      <div className="p-6">
        <h2>Tab Content</h2>
        <p>Mobile responsive layout with bottom navigation.</p>
      </div>
    </RouterPanel>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'RouterPanel responsive layout optimized for mobile with bottom tab navigation and adaptive spacing.',
      },
    },
  },
};

/**
 * RouterPanel showing configuration import wizard on first visit
 */
export const WithConfigurationWizard: Story = {
  render: (args) => (
    <RouterPanel {...args}>
      <div className="p-6">
        <h2>Tab Content</h2>
        <p>Configuration import wizard should be visible.</p>
      </div>
    </RouterPanel>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'RouterPanel displays configuration import wizard on initial router connection if no configuration has been imported.',
      },
    },
  },
};

/**
 * RouterPanel in desktop responsive layout
 */
export const Desktop: Story = {
  render: (args) => (
    <RouterPanel {...args}>
      <div className="p-6">
        <h2>Tab Content</h2>
        <p>Desktop responsive layout with top navigation.</p>
      </div>
    </RouterPanel>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'RouterPanel responsive layout optimized for desktop with top tab navigation and dense data presentation.',
      },
    },
  },
};
