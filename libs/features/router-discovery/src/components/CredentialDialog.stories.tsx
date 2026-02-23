import { fn } from 'storybook/test';

import { CredentialDialog } from './CredentialDialog';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CredentialDialog> = {
  title: 'Features/RouterDiscovery/CredentialDialog',
  component: CredentialDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal dialog for entering and validating MikroTik router credentials. ' +
          'Supports username/password entry, password visibility toggle, ' +
          '"remember credentials" checkbox, loading state, and validation error display.',
      },
    },
  },
  args: {
    isOpen: true,
    routerIp: '192.168.88.1',
    onSubmit: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CredentialDialog>;

/**
 * Default idle state — dialog open with IP address only (no router name).
 * Pre-filled with MikroTik defaults (admin / empty password).
 */
export const Default: Story = {
  args: {
    routerIp: '192.168.88.1',
  },
};

/**
 * When the router has a known hostname or label, it is shown alongside the IP.
 */
export const WithRouterName: Story = {
  args: {
    routerIp: '192.168.88.1',
    routerName: 'Home Router',
  },
};

/**
 * Connecting state — spinner inside the Connect button; all inputs are disabled.
 */
export const Validating: Story = {
  name: 'Validating (connecting…)',
  args: {
    routerIp: '10.0.0.1',
    routerName: 'Office Gateway',
    isValidating: true,
  },
};

/**
 * Bad credentials — the error banner appears below the form fields.
 */
export const WithValidationError: Story = {
  name: 'Validation Error (wrong password)',
  args: {
    routerIp: '192.168.1.1',
    routerName: 'Branch Router',
    validationError: 'Invalid username or password',
  },
};

/**
 * Network / proxy failure scenario.
 */
export const WithNetworkError: Story = {
  name: 'Network Error (unreachable)',
  args: {
    routerIp: '192.168.200.1',
    validationError:
      'Cannot connect to router proxy. Check network connection.',
  },
};

/**
 * Pre-populated for a retry scenario — initial credentials are already filled in
 * from a previous attempt so the user only needs to correct the password.
 */
export const PrePopulatedForRetry: Story = {
  name: 'Pre-populated (retry)',
  args: {
    routerIp: '172.16.0.1',
    routerName: 'VPN Endpoint',
    initialCredentials: {
      username: 'netadmin',
      password: 'wrongpass',
    },
    validationError: 'Invalid username or password',
  },
};

/**
 * Closed state — nothing renders; useful for testing AnimatePresence exit.
 */
export const Closed: Story = {
  args: {
    isOpen: false,
  },
};
