import { FormSkeleton } from './FormSkeleton';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof FormSkeleton> = {
  title: 'App/Skeletons/FormSkeleton',
  component: FormSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Loading skeleton for form views. Used for configuration forms, settings pages, etc. Provides a skeleton layout with section headers, form fields with labels, helper text, and action buttons.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormSkeleton>;

export const Default: Story = {
  args: {
    fields: 5,
    showActions: true,
  },
};

export const WithSections: Story = {
  args: {
    sections: 3,
    fields: 4,
    showSections: true,
    showActions: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 600 }}>
        <Story />
      </div>
    ),
  ],
};

export const Compact: Story = {
  args: {
    fields: 3,
    showActions: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 400 }}>
        <Story />
      </div>
    ),
  ],
};

export const Wide: Story = {
  args: {
    fields: 8,
    showSections: true,
    sections: 2,
    showActions: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 800 }}>
        <Story />
      </div>
    ),
  ],
};
