import { PluginStoreTab } from './PluginStoreTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PluginStoreTab> = {
  title: 'App/RouterPanel/PluginStoreTab',
  component: PluginStoreTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Plugin Store Tab displays available services and templates for installation on the router. Features two tabs: Services (individual service instances like TOR, Nostr, V2Ray, MTProto) and Templates (multi-service template bundles for common use cases). Follows NasNetConnect UX patterns with clean minimal layout, large rounded corners, and card-heavy dashboard style.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', padding: '0', background: 'var(--background)' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    routerId: 'router-001',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    routerId: 'router-001',
  },
};

export const ServicesTab: Story = {
  args: {
    routerId: 'router-001',
  },
};

export const TemplatesTab: Story = {
  args: {
    routerId: 'router-001',
  },
};

export const AllPluginsInstalled: Story = {
  args: {
    routerId: 'router-001',
  },
};

export const MixedStatus: Story = {
  args: {
    routerId: 'router-001',
  },
};

export const Mobile: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  args: {
    routerId: 'router-001',
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
