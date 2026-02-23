import { RouterDiscoveryPage } from '@/app/pages/router-discovery';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RouterDiscoveryPage> = {
  title: 'App/Index/RouterDiscoveryPage',
  component: RouterDiscoveryPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Root index route that renders the Router Discovery page. ' +
          'This is the landing page users see at "/". It provides three modes: ' +
          'Auto-Scan for network discovery, Manual Entry for typing an IP, ' +
          'and My Routers for previously discovered devices.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RouterDiscoveryPage>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default state showing the "My Routers" tab with an empty list. ' +
          'First-time users land here and can switch to Auto-Scan or Manual Entry.',
      },
    },
  },
};

export const ScanMode: Story = {
  name: 'Auto-Scan Mode',
  decorators: [
    (Story: React.ComponentType) => (
      <div>
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(59,130,246,0.85)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          Storybook: Click "Auto-Scan" tab to see scanner
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Auto-Scan mode runs a subnet sweep to discover MikroTik routers on the local network. ' +
          'Click the "Auto-Scan" tab button to activate this view.',
      },
    },
  },
};

export const ManualEntry: Story = {
  name: 'Manual Entry Mode',
  decorators: [
    (Story: React.ComponentType) => (
      <div>
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(59,130,246,0.85)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          Storybook: Click "Manual Entry" tab to see form
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Manual Entry mode provides a form for typing a router IP address directly. ' +
          'Click the "Manual Entry" tab button to activate this view.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
