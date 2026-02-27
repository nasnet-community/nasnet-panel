/**
 * VPNIssueAlert Storybook Stories
 *
 * Demonstrates the VPNIssueAlert pattern for displaying VPN connection
 * issues, warnings, and errors. Covers different severity levels and
 * dismissible states.
 *
 * @module @nasnet/ui/patterns/vpn-issue-alert
 */

import { fn } from 'storybook/test';

import { VPNIssueAlert, VPNIssuesList } from './VPNIssueAlert';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof VPNIssueAlert> = {
  title: 'Patterns/VPN/VPNIssueAlert',
  component: VPNIssueAlert,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
An alert component for displaying VPN connection issues, warnings, and errors with protocol information.

## Features
- Severity levels: Warning and Error
- Protocol icon and label
- Entity type and name (e.g., "WireGuard Client — Office VPN")
- Detailed error message
- Relative timestamp ("2h ago")
- Dismissible with optional dismiss handler
- WCAG AAA accessible

## Usage
\`\`\`tsx
import { VPNIssueAlert, VPNIssuesList } from '@nasnet/ui/patterns';

// Single issue
<VPNIssueAlert
  issue={issue}
  onDismiss={() => handleDismiss(issue.id)}
/>

// Multiple issues
<VPNIssuesList
  issues={issues}
  maxItems={5}
  showSeeAll={true}
  onSeeAll={() => navigateToIssuesPage()}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    onDismiss: {
      description: 'Called when dismiss button is clicked',
      action: 'dismissed',
    },
  },
  args: {
    onDismiss: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof VPNIssueAlert>;

// ============================================================================
// Stories
// ============================================================================

/**
 * A warning-level issue (orange alert).
 */
export const ConnectionWarning: Story = {
  name: 'Warning — Connection Issue',
  args: {
    issue: {
      id: '1',
      severity: 'warning',
      protocol: 'wireguard',
      entityType: 'client',
      entityName: 'Office VPN',
      message:
        'Connection unstable — intermittent disconnections detected. Consider checking your network connection.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
  },
};

/**
 * An error-level issue (red alert).
 */
export const ConnectionError: Story = {
  name: 'Error — Connection Failed',
  args: {
    issue: {
      id: '2',
      severity: 'error',
      protocol: 'openvpn',
      entityType: 'server',
      entityName: 'Main OpenVPN',
      message:
        'Connection failed — Server unreachable. Check your firewall rules and network connectivity.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    },
  },
};

/**
 * Warning without dismiss handler (read-only view).
 */
export const ReadOnlyWarning: Story = {
  name: 'Read-Only Warning',
  args: {
    issue: {
      id: '3',
      severity: 'warning',
      protocol: 'l2tp',
      entityType: 'server',
      entityName: 'Legacy L2TP',
      message: 'Protocol L2TP is deprecated. Consider migrating to WireGuard or OpenVPN.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  },
};

/**
 * IKEv2 authentication error.
 */
export const AuthenticationError: Story = {
  name: 'Error — Authentication Failed',
  args: {
    issue: {
      id: '4',
      severity: 'error',
      protocol: 'ikev2',
      entityType: 'client',
      entityName: 'Mobile VPN',
      message:
        'Authentication failed — Invalid credentials. Please verify your username and password.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
  },
};

/**
 * Recently detected issue (just now).
 */
export const RecentIssue: Story = {
  name: 'Recent Issue',
  args: {
    issue: {
      id: '5',
      severity: 'error',
      protocol: 'wireguard',
      entityType: 'client',
      entityName: 'wg0-secure',
      message: 'Interface down — All clients disconnected. Restarting service...',
      timestamp: new Date(), // Just now
    },
  },
};

/**
 * SSTP protocol issue.
 */
export const SSTPWarning: Story = {
  name: 'Warning — SSTP Performance',
  args: {
    issue: {
      id: '6',
      severity: 'warning',
      protocol: 'sstp',
      entityType: 'server',
      entityName: 'SSTP Gateway',
      message:
        'High latency detected — Response times averaging 250ms. Network quality may be degraded.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
  },
};

/**
 * Long error message (tests text wrapping).
 */
export const LongErrorMessage: Story = {
  name: 'Long Error Message',
  args: {
    issue: {
      id: '7',
      severity: 'error',
      protocol: 'openvpn',
      entityType: 'client',
      entityName: 'Production-VPN-Connection-Primary-Link',
      message:
        'Connection failed due to certificate validation error. The server certificate does not match the expected fingerprint. This could indicate a security issue or misconfiguration. Please verify the server certificate and CA chain, then retry the connection.',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    },
  },
};
