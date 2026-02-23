/**
 * RouteDeleteConfirmation Storybook Stories
 * NAS-6.5: Task 9.8 - Static Route Management
 *
 * Demonstrates the RouteDeleteConfirmation component with safety confirmation
 * patterns for deleting routes (CRITICAL for default route, STANDARD for others).
 */

import { useState } from 'react';
import { fn } from 'storybook/test';

import { RouteType, RouteScope, type Route } from '@nasnet/api-client/queries';
import { Button } from '@nasnet/ui/primitives';

import { RouteDeleteConfirmation } from './RouteDeleteConfirmation';

import type { Meta, StoryObj } from '@storybook/react';



/**
 * Mock route data for stories
 */
const mockDefaultRoute: Route = {
  id: '*1',
  destination: '0.0.0.0/0',
  gateway: '192.168.88.1',
  interface: 'ether1-wan',
  distance: 1,
  routingMark: undefined,
  routingTable: 'main',
  type: RouteType.STATIC,
  scope: RouteScope.GLOBAL,
  comment: 'Default internet route',
  active: true,
  disabled: false,
};

const mockStandardRoute: Route = {
  id: '*2',
  destination: '10.10.0.0/24',
  gateway: '192.168.88.254',
  interface: 'ether2-lan',
  distance: 1,
  routingMark: undefined,
  routingTable: 'main',
  type: RouteType.STATIC,
  scope: RouteScope.GLOBAL,
  comment: 'VPN network route',
  active: true,
  disabled: false,
};

const mockSpecificRoute: Route = {
  id: '*3',
  destination: '172.16.100.0/24',
  gateway: '192.168.1.1',
  interface: 'bridge1',
  distance: 5,
  routingMark: 'vpn-mark',
  routingTable: 'vpn-table',
  type: RouteType.STATIC,
  scope: RouteScope.GLOBAL,
  comment: 'Guest network route',
  active: true,
  disabled: false,
};

const mockInactiveRoute: Route = {
  id: '*4',
  destination: '192.168.200.0/24',
  gateway: '10.0.0.1',
  interface: 'ether3',
  distance: 10,
  routingMark: undefined,
  routingTable: 'main',
  type: RouteType.STATIC,
  scope: RouteScope.GLOBAL,
  comment: 'Inactive backup route',
  active: false,
  disabled: false,
};

/**
 * Interactive wrapper component to manage dialog open state
 * Provides trigger button and handles confirmation flow
 */
function RouteDeleteConfirmationWrapper({
  route,
  autoOpen = false,
}: {
  route: Route;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    // Simulate deletion API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Route deleted:', route.destination);
    setDeleting(false);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-lg font-semibold">Route Management</h3>
        <p className="text-sm text-muted-foreground">
          Click below to delete route: <code className="font-mono">{route.destination}</code>
        </p>
        <Button variant="destructive" size="lg" onClick={() => setOpen(true)}>
          Delete Route
        </Button>
      </div>

      <RouteDeleteConfirmation
        route={route}
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        loading={deleting}
      />
    </div>
  );
}

/**
 * Storybook Meta Configuration
 */
const meta: Meta<typeof RouteDeleteConfirmation> = {
  title: 'Features/Network/Routes/RouteDeleteConfirmation',
  component: RouteDeleteConfirmation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Multi-step safety confirmation dialog for deleting routes with impact analysis.

## Features
- **Impact Analysis**: Automatically detects critical routes (default route 0.0.0.0/0)
- **Type-to-confirm**: User must type exact text to enable confirmation
- **Countdown Timer**: 10 seconds for CRITICAL, 5 seconds for STANDARD
- **Severity Levels**: CRITICAL (red) for default route, STANDARD (amber) for others
- **Platform Adaptive**: Desktop uses Dialog, Mobile uses Sheet

## Safety Levels
### CRITICAL (0.0.0.0/0 - Default Route)
- **Countdown**: 10 seconds
- **Confirm Text**: "DELETE DEFAULT ROUTE"
- **Visual**: Red warning styling
- **Consequences**: Internet disconnection, loss of remote access

### STANDARD (Other Static Routes)
- **Countdown**: 5 seconds
- **Confirm Text**: Route destination (e.g., "10.10.0.0/24")
- **Visual**: Amber warning styling
- **Consequences**: Traffic to network segment will fail

## Integration
Use with useDeleteRoute() mutation hook for actual deletion operations.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state during deletion',
    },
    route: {
      control: 'object',
      description: 'Route object to delete',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Callback when deletion is confirmed',
    },
    onOpenChange: {
      action: 'openChanged',
      description: 'Callback when dialog open state changes',
    },
  },
  args: {
    onConfirm: fn(),
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof RouteDeleteConfirmation>;

/**
 * CRITICAL operation: Deleting default route (0.0.0.0/0).
 * Shows 10-second countdown with red warning styling.
 * User must type "DELETE DEFAULT ROUTE" exactly.
 */
export const DefaultRoute: Story = {
  render: () => <RouteDeleteConfirmationWrapper route={mockDefaultRoute} />,
  parameters: {
    docs: {
      description: {
        story:
          'CRITICAL operation: Deleting default route. Shows 10-second countdown with red warning styling. User must type "DELETE DEFAULT ROUTE" exactly.',
      },
    },
  },
};

/**
 * STANDARD operation: Deleting non-critical route.
 * Shows 5-second countdown with amber warning styling.
 * User must type destination CIDR (e.g., "10.10.0.0/24").
 */
export const StandardRoute: Story = {
  render: () => <RouteDeleteConfirmationWrapper route={mockStandardRoute} />,
  parameters: {
    docs: {
      description: {
        story:
          'STANDARD operation: Deleting non-critical route. Shows 5-second countdown with amber warning styling. User must type destination CIDR.',
      },
    },
  },
};

/**
 * Route with custom routing mark and table.
 * Demonstrates deletion of policy routing configuration.
 */
export const AdvancedRoute: Story = {
  render: () => <RouteDeleteConfirmationWrapper route={mockSpecificRoute} />,
  parameters: {
    docs: {
      description: {
        story: 'Deleting route with custom routing mark and table. Shows full route details in warning.',
      },
    },
  },
};

/**
 * Deleting an inactive/disabled route.
 * Lower impact but still requires confirmation.
 */
export const InactiveRoute: Story = {
  render: () => <RouteDeleteConfirmationWrapper route={mockInactiveRoute} />,
  parameters: {
    docs: {
      description: {
        story: 'Deleting an inactive/disabled route. Lower impact but still requires confirmation.',
      },
    },
  },
};

/**
 * Mobile viewport variant using Sheet instead of Dialog.
 * Full-width buttons and optimized spacing for touch interaction.
 */
export const MobileView: Story = {
  render: () => <RouteDeleteConfirmationWrapper route={mockStandardRoute} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile viewport (< 640px). Dialog adapts to smaller screen with full-width buttons and optimized spacing.',
      },
    },
  },
};

/**
 * Desktop viewport variant using centered Dialog.
 * Centered modal with max-width 500px and horizontal button layout.
 */
export const DesktopView: Story = {
  render: () => <RouteDeleteConfirmationWrapper route={mockDefaultRoute} />,
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story:
          'Desktop viewport (> 1024px). Shows centered modal with max-width 500px and horizontal button layout.',
      },
    },
  },
};

/**
 * Dark theme variant to verify styling in dark mode.
 * Ensures color contrast and readability with dark backgrounds.
 */
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-background min-h-screen flex items-center justify-center">
      <RouteDeleteConfirmationWrapper route={mockDefaultRoute} />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dark theme variant. Verifies color contrast and readability in dark mode.',
      },
    },
  },
};

/**
 * Demonstration of loading state during deletion.
 * Shows spinner in confirm button with all inputs disabled.
 */
export const Submitting: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Route
        </Button>
        <RouteDeleteConfirmation
          route={mockStandardRoute}
          open={open}
          onOpenChange={setOpen}
          onConfirm={async () => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 2000));
            setLoading(false);
            setOpen(false);
          }}
          loading={loading}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates loading state during route deletion. Shows spinner in confirm button and disables all inputs.',
      },
    },
  },
};

/**
 * Controlled story with all props exposed in Storybook controls.
 * Allows customization of route properties and behavior.
 */
export const Playground: Story = {
  args: {
    route: mockStandardRoute,
  },
  render: ({ route }) => <RouteDeleteConfirmationWrapper route={route as Route} />,
  parameters: {
    docs: {
      description: {
        story: 'Playground story with customizable route properties. Use controls to test different scenarios.',
      },
    },
  },
};
