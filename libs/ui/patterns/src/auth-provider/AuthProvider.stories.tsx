/**
 * AuthProvider Storybook Stories
 * Demonstrates authentication context and related components
 */

import { fn } from 'storybook/test';

import { useAuth, AuthProvider, RequireAuth } from './AuthProvider';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AuthProvider> = {
  title: 'Patterns/Common/AuthProvider',
  component: AuthProvider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Authentication context provider with session management and permission checking.',
      },
    },
    layout: 'padded',
  },
  args: {
    showSessionWarning: true,
    sessionWarningThreshold: 300,
    enableAutoRefresh: true,
    onRefreshToken: fn(async () => ({
      accessToken: 'new-token-123',
      refreshToken: 'new-refresh-token-456',
      expiresIn: 3600,
    })),
    onSessionExpired: fn(),
  },
  argTypes: {
    children: {
      control: false,
      description: 'Child components',
    },
    showSessionWarning: {
      control: 'boolean',
      description: 'Show session expiring dialog',
    },
    sessionWarningThreshold: {
      control: { type: 'number', min: 60, max: 600, step: 60 },
      description: 'Session warning threshold in seconds',
    },
    enableAutoRefresh: {
      control: 'boolean',
      description: 'Enable automatic token refresh',
    },
    onRefreshToken: {
      action: 'onRefreshToken',
      description: 'Token refresh callback',
    },
    onSessionExpired: {
      action: 'onSessionExpired',
      description: 'Session expired callback',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuthProvider>;

/**
 * Demo component that consumes auth context
 */
function AuthConsumer() {
  const auth = useAuth();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div>
        <p className="text-sm font-medium">Authenticated:</p>
        <p className="text-sm text-muted-foreground">{auth.isAuthenticated ? 'Yes' : 'No'}</p>
      </div>

      {auth.user && (
        <>
          <div>
            <p className="text-sm font-medium">User:</p>
            <p className="text-sm text-muted-foreground">{auth.user.username}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Permissions:</p>
            <p className="text-sm text-muted-foreground">
              {auth.user.permissions.join(', ') || 'None'}
            </p>
          </div>
        </>
      )}

      <div className="flex gap-2">
        {auth.isAuthenticated && (
          <button
            onClick={() => auth.logout()}
            className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Basic Auth Provider with minimal configuration
 */
export const Default: Story = {
  render: (args) => (
    <AuthProvider {...args}>
      <AuthConsumer />
    </AuthProvider>
  ),
};

/**
 * With session warning enabled
 */
export const WithSessionWarning: Story = {
  args: {
    showSessionWarning: true,
    sessionWarningThreshold: 120,
  },
  render: (args) => (
    <AuthProvider {...args}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Session warning will appear when 2 minutes remain
        </p>
        <AuthConsumer />
      </div>
    </AuthProvider>
  ),
};

/**
 * RequireAuth - Content shown when authenticated
 */
export const RequireAuthShown: Story = {
  render: (args) => (
    <AuthProvider {...args}>
      <RequireAuth fallback={<p>Not authenticated</p>}>
        <div className="p-4 border border-success/20 bg-success/10 rounded">
          <p className="text-success">This content is only shown when authenticated</p>
        </div>
      </RequireAuth>
    </AuthProvider>
  ),
};

/**
 * RequireAuth - With permissions check
 */
export const RequireAuthWithPermissions: Story = {
  render: (args) => (
    <AuthProvider {...args}>
      <RequireAuth
        fallback={<p>Not authenticated</p>}
        permissions={['admin']}
        unauthorizedFallback={
          <div className="p-4 border border-warning/20 bg-warning/10 rounded">
            <p className="text-warning">You need admin permission to view this</p>
          </div>
        }
      >
        <div className="p-4 border border-secondary/20 bg-secondary/10 rounded">
          <p className="text-secondary">Admin content only</p>
        </div>
      </RequireAuth>
    </AuthProvider>
  ),
};

/**
 * Auto refresh enabled
 */
export const WithAutoRefresh: Story = {
  args: {
    enableAutoRefresh: true,
  },
  render: (args) => (
    <AuthProvider {...args}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Token will automatically refresh before expiration
        </p>
        <AuthConsumer />
      </div>
    </AuthProvider>
  ),
};
