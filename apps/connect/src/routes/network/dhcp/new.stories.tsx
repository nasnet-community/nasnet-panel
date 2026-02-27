import { DHCPWizard } from '@nasnet/features/network';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DHCPWizard> = {
  title: 'App/Network/DHCP/NewServer',
  component: DHCPWizard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Multi-step DHCP server creation wizard using CStepper. Guides users through interface selection, address pool configuration, network settings, and review steps with a live preview panel.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DHCPWizard>;

export const Default: Story = {
  render: () => <DHCPWizard />,
};

export const NoRouterConnected: Story = {
  render: () => <DHCPWizard />,
  parameters: {
    docs: {
      description: {
        story: 'Wizard when no router is connected. Interface selection step may show empty list.',
      },
    },
  },
};

export const MobileView: Story = {
  render: () => <DHCPWizard />,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Mobile viewport rendering of the DHCP wizard with adapted step layout.',
      },
    },
  },
};

export const Desktop: Story = {
  render: () => <DHCPWizard />,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Desktop viewport rendering of the DHCP wizard with full step layout and preview panel.',
      },
    },
  },
};
