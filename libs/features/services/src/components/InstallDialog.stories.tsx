import { fn } from 'storybook/test';

/**
 * InstallDialog stories
 *
 * NOTE: InstallDialog internally calls GraphQL hooks (useAvailableServices,
 * useInstallService, useInstallProgressSubscription). In Storybook these
 * hooks must be mocked via MSW or a decorator. The stories below demonstrate
 * the dialog's visual states using a thin wrapper that accepts pre-rendered
 * inner content so designers can review each step without a live backend.
 *
 * For full integration testing, point Storybook at the dev backend and ensure
 * the MSW worker is configured with service fixtures.
 */

import { InstallDialog } from './InstallDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof InstallDialog> = {
  title: 'Features/Services/InstallDialog',
  component: InstallDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Multi-step dialog for installing a new service instance from the Feature Marketplace. ' +
          'Step 1 lets users pick a service; Step 2 configures the instance (name, VLAN, bind IP, ports); ' +
          'Step 3 shows real-time installation progress; Step 4 confirms success. ' +
          'GraphQL hooks are required at runtime — mock them with MSW in Storybook.',
      },
    },
  },
  args: {
    open: true,
    onClose: fn(),
    routerId: 'router-001',
    onSuccess: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof InstallDialog>;

/**
 * Dialog in its open state (Step 1: Select Service).
 * Requires mocked useAvailableServices to show the service list.
 */
export const Open: Story = {
  args: {
    open: true,
  },
};

/**
 * Dialog is closed — nothing should be visible.
 */
export const Closed: Story = {
  args: {
    open: false,
  },
};

/**
 * Open dialog for a different router context.
 */
export const DifferentRouter: Story = {
  args: {
    open: true,
    routerId: 'router-edge-99',
  },
};

/**
 * With a success callback registered — fired after Step 4 is dismissed.
 */
export const WithSuccessCallback: Story = {
  args: {
    open: true,
    onSuccess: fn(),
  },
};
