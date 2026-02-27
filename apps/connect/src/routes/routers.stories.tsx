import { RouterListPage } from '@/app/routes/router-list/RouterListPage';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RouterListPage> = {
  title: 'App/Routers/RouterListPage',
  component: RouterListPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Router list page displayed at the "/routers" route. ' +
          'Shows saved routers with connection status indicators (green/yellow/red/gray). ' +
          'Provides an "Add Router" button and empty state for first-time users.',
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
type Story = StoryObj<typeof RouterListPage>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default empty state when no routers have been saved. ' +
          'Shows a call-to-action to add the first router.',
      },
    },
  },
};

export const EmptyState: Story = {
  name: 'Empty State Detail',
  decorators: [
    (Story) => (
      <div>
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(30,30,30,0.88)',
            color: '#d4d4d4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.6,
            maxWidth: 280,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Empty State</strong>
          <br />
          The router list is empty. Users see an onboarding prompt with an icon, description, and
          "Add Your First Router" button.
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Annotated empty state view. Currently the router list is always empty ' +
          'as persistence is handled by Epic 0.1. The empty state guides users ' +
          'to add their first MikroTik router.',
      },
    },
  },
};

export const MobileViewport: Story = {
  name: 'Mobile Viewport',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'Router list page rendered at mobile viewport width. ' +
          'The "Add Router" button text collapses to just an icon on small screens.',
      },
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'Router list page rendered at desktop viewport width. ' +
          'Shows full interface with expanded button labels and optimized spacing for larger screens.',
      },
    },
  },
};
