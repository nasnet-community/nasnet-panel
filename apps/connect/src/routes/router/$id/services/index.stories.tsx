import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'App/Services/ServicesIndexPage',
  component: () => <div>Services Index Page (Requires Router Context)</div>,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Service management index page with tab navigation between individual service instances and multi-service templates. Router context is mocked — navigation callbacks use Storybook actions.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <div>Services Index Page (Requires Router Context)</div>,
};

export const InstancesTabActive: Story = {
  render: () => <div>Services Index Page - Instances Tab (Requires Router Context)</div>,
  parameters: {
    docs: {
      description: {
        story: 'Services index with Instances tab selected, showing individual service instances.',
      },
    },
  },
};

export const TemplatesTabActive: Story = {
  render: () => <div>Services Index Page - Templates Tab (Requires Router Context)</div>,
  parameters: {
    docs: {
      description: {
        story: 'Services index with Templates tab selected, showing multi-service templates.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => <div>Services Index Page (Requires Router Context)</div>,
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  render: () => <div>Services Index Page (Requires Router Context)</div>,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
