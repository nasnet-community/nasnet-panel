/**
 * ResourceCard Stories
 *
 * Storybook stories for the ResourceCard pattern component.
 * Demonstrates different variants, states, and platform presentations.
 */

import { Play, Settings, Trash2, Wifi, WifiOff, RefreshCw } from 'lucide-react';

import { ResourceCard } from './ResourceCard';
import { ResourceCardDesktop } from './ResourceCard.Desktop';
import { ResourceCardMobile } from './ResourceCard.Mobile';

import type { BaseResource, ResourceAction } from './types';
import type { Meta, StoryObj } from '@storybook/react';

// Sample resources for stories
const onlineResource: BaseResource = {
  id: '1',
  name: 'WireGuard VPN',
  description: 'Main VPN connection for secure browsing',
  runtime: {
    status: 'online',
    lastSeen: new Date(),
  },
};

const offlineResource: BaseResource = {
  id: '2',
  name: 'OpenVPN Client',
  description: 'Backup VPN connection',
  runtime: {
    status: 'offline',
    lastSeen: new Date(Date.now() - 3600000),
  },
};

const pendingResource: BaseResource = {
  id: '3',
  name: 'L2TP Server',
  description: 'Connecting to server...',
  runtime: {
    status: 'pending',
  },
};

const errorResource: BaseResource = {
  id: '4',
  name: 'PPTP Client',
  description: 'Connection failed - authentication error',
  runtime: {
    status: 'error',
  },
};

const sampleActions: ResourceAction[] = [
  {
    id: 'connect',
    label: 'Connect',
    icon: <Play className="h-4 w-4" />,
    onClick: () => console.log('Connect clicked'),
  },
  {
    id: 'configure',
    label: 'Configure',
    icon: <Settings className="h-4 w-4" />,
    onClick: () => console.log('Configure clicked'),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: () => console.log('Delete clicked'),
    variant: 'destructive',
  },
];

// Meta configuration
const meta: Meta<typeof ResourceCard> = {
  title: 'Patterns/Common/ResourceCard',
  component: ResourceCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Generic resource display card with status indicator and actions.

Implements the **Headless + Platform Presenters** pattern (ADR-018):
- **Headless Hook** (\`useResourceCard\`): Contains all business logic
- **Mobile Presenter**: Touch-optimized with 44px targets
- **Desktop Presenter**: Dense layout with hover states and dropdowns

## Usage

\`\`\`tsx
import { ResourceCard } from '@nasnet/ui/patterns';

<ResourceCard
  resource={{
    id: '1',
    name: 'WireGuard VPN',
    runtime: { status: 'online' }
  }}
  actions={[
    { id: 'connect', label: 'Connect', onClick: () => {} }
  ]}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    resource: {
      description: 'The resource object to display',
      control: 'object',
    },
    actions: {
      description: 'Array of action buttons',
      control: 'object',
    },
    expanded: {
      description: 'Whether the card is expanded (for expandable variants)',
      control: 'boolean',
    },
    showLivePulse: {
      description: 'Show pulse animation for online status',
      control: 'boolean',
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceCard>;

// Stories
export const Online: Story = {
  args: {
    resource: onlineResource,
    actions: sampleActions,
  },
};

export const Offline: Story = {
  args: {
    resource: offlineResource,
    actions: [
      {
        id: 'connect',
        label: 'Connect',
        icon: <Wifi className="h-4 w-4" />,
        onClick: () => console.log('Connect clicked'),
      },
    ],
  },
};

export const Pending: Story = {
  args: {
    resource: pendingResource,
    actions: [
      {
        id: 'cancel',
        label: 'Cancel',
        onClick: () => console.log('Cancel clicked'),
        variant: 'secondary',
      },
    ],
  },
};

export const Error: Story = {
  args: {
    resource: errorResource,
    actions: [
      {
        id: 'retry',
        label: 'Retry',
        icon: <RefreshCw className="h-4 w-4" />,
        onClick: () => console.log('Retry clicked'),
      },
      {
        id: 'configure',
        label: 'Configure',
        onClick: () => console.log('Configure clicked'),
        variant: 'secondary',
      },
    ],
  },
};

export const WithoutActions: Story = {
  args: {
    resource: onlineResource,
    actions: [],
  },
};

export const WithoutDescription: Story = {
  args: {
    resource: {
      id: '1',
      name: 'Simple Resource',
      runtime: { status: 'online' },
    },
    actions: sampleActions,
  },
};

export const WithCustomContent: Story = {
  args: {
    resource: onlineResource,
    actions: sampleActions.slice(0, 1),
    children: (
      <div className="text-sm text-muted-foreground">
        <p>Upload: 1.2 MB/s</p>
        <p>Download: 5.8 MB/s</p>
      </div>
    ),
  },
};

// Platform-specific stories
export const MobilePresenter: Story = {
  render: (args) => <ResourceCardMobile {...args} />,
  args: {
    resource: onlineResource,
    actions: sampleActions,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized presenter with large touch targets and full-width actions.',
      },
    },
  },
};

export const DesktopPresenter: Story = {
  render: (args) => <ResourceCardDesktop {...args} />,
  args: {
    resource: onlineResource,
    actions: sampleActions,
  },
  parameters: {
    docs: {
      description: {
        story: 'Desktop-optimized presenter with hover states and dropdown menus.',
      },
    },
  },
};

// Interactive story
export const Interactive: Story = {
  args: {
    resource: {
      id: '1',
      name: 'Interactive Resource',
      description: 'Click the card or actions to see console logs',
      runtime: { status: 'online' },
    },
    actions: [
      {
        id: 'connect',
        label: 'Connect',
        onClick: () => alert('Connect clicked!'),
      },
      {
        id: 'configure',
        label: 'Configure',
        onClick: () => alert('Configure clicked!'),
      },
    ],
    onClick: () => console.log('Card clicked'),
  },
};

// List of cards
export const CardList: Story = {
  render: () => (
    <div className="space-y-2">
      <ResourceCard resource={onlineResource} actions={sampleActions.slice(0, 2)} />
      <ResourceCard resource={offlineResource} actions={sampleActions.slice(0, 1)} />
      <ResourceCard resource={pendingResource} actions={[]} />
      <ResourceCard resource={errorResource} actions={sampleActions.slice(0, 1)} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple ResourceCard components in a list layout.',
      },
    },
  },
};
