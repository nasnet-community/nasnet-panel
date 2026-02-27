/**
 * Storybook stories for PingTool
 *
 * Demonstrates all states and variants of the Ping Diagnostic Tool.
 */

import { MockedProvider } from '@apollo/client/testing';

import { RUN_PING } from './ping.graphql';
import { PingTool } from './PingTool';
import { PingToolDesktop } from './PingToolDesktop';
import { PingToolMobile } from './PingToolMobile';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PingTool> = {
  title: 'Features/Diagnostics/PingTool',
  component: PingTool,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive ping diagnostic tool with real-time results streaming, statistics, and latency visualization.',
      },
    },
  },
  decorators: [
    (Story) => (
      <MockedProvider
        mocks={[]}
        addTypename={false}
      >
        <Story />
      </MockedProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PingTool>;

/**
 * Idle State - Ready to Start
 *
 * Initial state with empty form waiting for user input.
 */
export const Idle: Story = {
  args: {
    routerId: 'router-demo-001',
  },
};

/**
 * Desktop Layout
 *
 * Full desktop layout with side-by-side form and results.
 * Shows all advanced options and results in a grid layout.
 */
export const Desktop: Story = {
  render: (args) => (
    <MockedProvider
      mocks={[]}
      addTypename={false}
    >
      <PingToolDesktop {...args} />
    </MockedProvider>
  ),
  args: {
    routerId: 'router-demo-001',
  },
};

/**
 * Mobile Layout
 *
 * Compact mobile layout with stacked form and bottom sheet for results.
 * Only shows essential fields (target, count, timeout).
 */
export const Mobile: Story = {
  render: (args) => (
    <MockedProvider
      mocks={[]}
      addTypename={false}
    >
      <PingToolMobile {...args} />
    </MockedProvider>
  ),
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * With Callbacks
 *
 * Demonstrates onComplete and onError callbacks.
 */
export const WithCallbacks: Story = {
  args: {
    routerId: 'router-demo-001',
    onComplete: () => {
      console.log('Ping test completed!');
      alert('Ping test completed!');
    },
    onError: (error) => {
      console.error('Ping error:', error);
      alert(`Ping error: ${error}`);
    },
  },
};

/**
 * Form Validation
 *
 * Shows form validation errors for invalid inputs.
 */
export const FormValidation: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Try entering invalid values like "999.999.999.999" or leaving target empty to see validation errors.',
      },
    },
  },
};

/**
 * IPv6 Target
 *
 * Example with IPv6 target address.
 */
export const IPv6Target: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Supports IPv6 addresses. Try entering "2001:4860:4860::8888" (Google DNS) as target.',
      },
    },
  },
};

/**
 * Hostname Target
 *
 * Example with hostname instead of IP address.
 */
export const HostnameTarget: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story: 'Supports hostnames. Try entering "google.com" or "cloudflare.com" as target.',
      },
    },
  },
};

/**
 * Custom Settings
 *
 * Example with custom count, size, and timeout values.
 */
export const CustomSettings: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Customize ping parameters: count (1-100), size (56-65500 bytes), timeout (100-30000ms), and source interface.',
      },
    },
  },
};

/**
 * Accessibility Features
 *
 * Demonstrates WCAG AAA accessibility features.
 */
export const Accessibility: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Accessibility Features:**
- Semantic HTML (form, labels, description lists)
- ARIA labels and live regions
- Keyboard navigation support
- 7:1 contrast ratio (WCAG AAA)
- Screen reader announcements for results
- Proper focus management
        `.trim(),
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'label',
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * Dark Mode
 *
 * Component in dark mode theme.
 */
export const DarkMode: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

/**
 * Interactive Demo
 *
 * Fully interactive demo with mocked GraphQL responses.
 * Click "Start Ping" to see simulated results.
 */
export const InteractiveDemo: Story = {
  render: (args) => {
    const mocks = [
      {
        request: {
          query: RUN_PING,
          variables: {
            input: {
              deviceId: args.routerId,
              target: '8.8.8.8',
              count: 10,
              size: 56,
              timeout: 1000,
              sourceInterface: undefined,
            },
          },
        },
        result: {
          data: {
            runPing: {
              jobId: 'demo-job-123',
              status: 'RUNNING',
            },
          },
        },
      },
    ];

    return (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
      >
        <PingTool {...args} />
      </MockedProvider>
    );
  },
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo with mocked GraphQL responses. Enter "8.8.8.8" and click "Start Ping" to see the component in action.',
      },
    },
  },
};
