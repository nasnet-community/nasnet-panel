import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof Avatar> = {
  title: 'Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A circular avatar component built on Radix UI Avatar primitive. Supports image display with automatic fallback to initials or placeholder text when the image fails to load. Uses semantic color tokens for dark mode compatibility. WCAG AAA accessible with 7:1 contrast on fallback text.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Optional custom CSS classes for sizing (e.g., "h-14 w-14")',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-image.png" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>RZ</AvatarFallback>
    </Avatar>
  ),
};

export const RouterAdminAvatars: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="Admin" />
        <AvatarFallback>AD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">MK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-info/20 text-info font-semibold">RT</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-success/20 text-success font-semibold">SV</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const CustomSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">XS</AvatarFallback>
      </Avatar>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">SM</AvatarFallback>
      </Avatar>
      <Avatar>
        {/* default h-10 w-10 */}
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-14 w-14">
        <AvatarFallback className="text-lg">LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-20 w-20">
        <AvatarFallback className="text-2xl">XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">A1</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-info/20 text-info text-xs font-semibold">A2</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-success/20 text-success text-xs font-semibold">A3</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-warning/20 text-warning text-xs font-semibold">+4</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/**
 * Mobile viewport story (375px) - Verifies component scales appropriately
 */
export const Mobile: Story = {
  render: () => (
    <div className="space-y-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar className="h-8 w-8">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport story (768px) - Verifies component maintains proportions
 */
export const Tablet: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>RZ</AvatarFallback>
      </Avatar>
      <Avatar className="h-14 w-14">
        <AvatarFallback className="text-lg">LG</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Desktop viewport story (1280px) - Full detail view
 */
export const Desktop: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Standard avatars</h3>
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="Admin user" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">MK</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback className="bg-success/20 text-success font-semibold">SV</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-3">Avatar group (overlapping)</h3>
        <div className="flex -space-x-2">
          <Avatar className="border-2 border-background">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">U1</AvatarFallback>
          </Avatar>
          <Avatar className="border-2 border-background">
            <AvatarFallback className="bg-info/20 text-info text-xs font-semibold">U2</AvatarFallback>
          </Avatar>
          <Avatar className="border-2 border-background">
            <AvatarFallback className="bg-warning/20 text-warning text-xs font-semibold">+3</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

/**
 * Dark mode story - Verifies color tokens adapt correctly
 */
export const DarkMode: Story = {
  render: () => (
    <div className="space-y-4">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">CD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback className="bg-success/20 text-success font-semibold">SV</AvatarFallback>
      </Avatar>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    layout: 'centered',
  },
};
