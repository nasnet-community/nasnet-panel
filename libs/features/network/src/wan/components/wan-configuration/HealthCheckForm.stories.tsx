/**
 * Health Check Form Storybook Stories
 *
 * Interactive documentation and visual testing for the WAN health monitoring
 * configuration form (netwatch integration).
 */

import { HealthCheckForm } from './HealthCheckForm';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof HealthCheckForm> = {
  title: 'Features/Network/WAN/HealthCheckForm',
  component: HealthCheckForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Form for configuring WAN health monitoring using MikroTik's netwatch tool.
Periodically pings a target host and marks the WAN link as HEALTHY, DEGRADED,
or DOWN based on the results.

## Features
- **Enable/Disable toggle** - Shows a warning banner when monitoring is off
- **Target presets** - Cloudflare (1.1.1.1), Google (8.8.8.8), Quad9 (9.9.9.9), and optionally the WAN gateway
- **Interval presets** - Fast (5s), Standard (10s), Conservative (30s), Slow (60s)
- **Failure threshold** - Number of consecutive failures before marking as DOWN
- **Timeout validation** - Timeout must be less than interval (enforced in real-time)
- **Comment** - Optional 255-character annotation

## Validation
Timeout must always be less than the check interval. If the operator enters a
conflicting value the form shows an inline error and the submit button is disabled.
        `,
      },
    },
  },
  argTypes: {
    routerID: {
      control: 'text',
      description: 'Router ID for scoping the mutation',
    },
    wanID: {
      control: 'text',
      description: 'WAN interface ID to attach the health check to',
    },
    gateway: {
      control: 'text',
      description: 'Optional WAN gateway IP shown as a target preset',
    },
    onSuccess: { action: 'success' },
    onCancel: { action: 'cancelled' },
  },
};

export default meta;
type Story = StoryObj<typeof HealthCheckForm>;

/**
 * Default - empty form with monitoring disabled.
 */
export const Default: Story = {
  args: {
    routerID: 'router-demo-123',
    wanID: 'wan-001',
    onSuccess: () => {},
    onCancel: () => {},
  },
};

/**
 * MonitoringEnabled - form with health check active and standard defaults.
 */
export const MonitoringEnabled: Story = {
  args: {
    routerID: 'router-demo-123',
    wanID: 'wan-001',
    gateway: '203.0.113.1',
    initialValues: {
      isEnabled: true,
      target: '1.1.1.1',
      intervalSeconds: 10,
      timeoutSeconds: 2,
      failureThreshold: 3,
      comment: 'Primary WAN health check',
    },
    onSuccess: () => {},
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Health monitoring is enabled with standard settings: ping Cloudflare every 10s, 2s timeout, mark as DOWN after 3 consecutive failures.',
      },
    },
  },
};

/**
 * WithGatewayPreset - gateway IP shown as a target preset button.
 */
export const WithGatewayPreset: Story = {
  args: {
    routerID: 'router-demo-123',
    wanID: 'wan-002',
    gateway: '10.0.0.1',
    initialValues: {
      isEnabled: true,
      target: '10.0.0.1',
      intervalSeconds: 10,
      timeoutSeconds: 2,
      failureThreshold: 3,
    },
    onSuccess: () => {},
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'When the gateway prop is provided, a "Gateway (10.0.0.1)" preset button appears in the Quick Targets grid. The gateway target is already selected here.',
      },
    },
  },
};

/**
 * FastChecks - aggressive health check for mission-critical WAN links.
 */
export const FastChecks: Story = {
  args: {
    routerID: 'router-demo-123',
    wanID: 'wan-003',
    gateway: '198.51.100.1',
    initialValues: {
      isEnabled: true,
      target: '8.8.8.8',
      intervalSeconds: 5,
      timeoutSeconds: 1,
      failureThreshold: 2,
      comment: 'Mission-critical WAN - fast failure detection',
    },
    onSuccess: () => {},
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Aggressive 5-second interval with 1-second timeout and 2-failure threshold. Suitable for high-availability setups where fast failover is critical.',
      },
    },
  },
};

/**
 * ConservativeChecks - low-frequency checks for metered or constrained links.
 */
export const ConservativeChecks: Story = {
  args: {
    routerID: 'router-demo-123',
    wanID: 'wan-lte-1',
    initialValues: {
      isEnabled: true,
      target: '9.9.9.9',
      intervalSeconds: 60,
      timeoutSeconds: 10,
      failureThreshold: 5,
      comment: 'LTE backup - conserve data allowance',
    },
    onSuccess: () => {},
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Conservative 60-second interval suitable for metered LTE backup links. Reduces unnecessary data usage while still detecting failures.',
      },
    },
  },
};

/**
 * MonitoringDisabledWarning - form in disabled state showing the warning banner.
 */
export const MonitoringDisabledWarning: Story = {
  args: {
    routerID: 'router-demo-123',
    wanID: 'wan-004',
    initialValues: {
      isEnabled: false,
    },
    onSuccess: () => {},
    onCancel: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'When monitoring is toggled off the form collapses the configuration sections and shows an amber warning banner explaining that link failures will not be automatically detected.',
      },
    },
  },
};
