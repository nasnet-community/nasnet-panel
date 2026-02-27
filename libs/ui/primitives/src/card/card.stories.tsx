import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from '../button/button';

import type { Meta, StoryObj } from '@storybook/react';

/**
 * Card - A flexible container for grouping related content.
 * Supports four visual variants: default, elevated, interactive, and flat.
 * Use for organizing information, displaying data, or creating clickable content areas.
 */
const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A flexible container component for grouping related content with support for headers, content areas, and footers. Available in four visual variants to suit different visual hierarchy needs.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'interactive', 'flat'],
      description: 'Visual variant of the card',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the card',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content area. Add any content here.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card variant="default">
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Standard card with subtle shadow</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Default card content</p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Card with prominent shadow</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Elevated card content</p>
        </CardContent>
      </Card>

      <Card variant="interactive">
        <CardHeader>
          <CardTitle>Interactive</CardTitle>
          <CardDescription>Hover to see effect</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Interactive card content</p>
        </CardContent>
      </Card>

      <Card variant="flat">
        <CardHeader>
          <CardTitle>Flat</CardTitle>
          <CardDescription>No shadow, muted background</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Flat card content</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const NotificationCard: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-4 rounded-md border p-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">Push Notifications</p>
            <p className="text-muted-foreground text-sm">Send notifications to device.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Mark all as read</Button>
      </CardFooter>
    </Card>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Mobile Card</CardTitle>
        <CardDescription>Optimized for small screens</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card is responsive and adapts to mobile viewport.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Tablet Card</CardTitle>
        <CardDescription>Optimized for medium screens</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card is responsive and adapts to tablet viewport.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <Card className="w-[500px]">
      <CardHeader>
        <CardTitle>Desktop Card</CardTitle>
        <CardDescription>Optimized for large screens</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card is responsive and adapts to desktop viewport.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Long Content Example</CardTitle>
        <CardDescription>
          This card demonstrates how the component handles longer text content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Read More</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithMultipleButtons: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Action Card</CardTitle>
        <CardDescription>Multiple action buttons</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card has multiple actions in the footer.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};
