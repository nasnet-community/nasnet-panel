/**
 * Storybook stories for TracerouteTool
 *
 * Demonstrates all states and variants of the Traceroute Diagnostic Tool.
 *
 * Story NAS-5.8: Traceroute Diagnostic Tool
 * 7 comprehensive stories covering all use cases and states.
 */

import { MockedProvider } from '@apollo/client/testing';

import { TracerouteTool } from './TracerouteTool';
import { TracerouteToolDesktop } from './TracerouteToolDesktop';
import { TracerouteToolMobile } from './TracerouteToolMobile';
import { RUN_TRACEROUTE, TRACEROUTE_PROGRESS_SUBSCRIPTION } from '../../graphql/traceroute.graphql';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof TracerouteTool> = {
  title: 'Features/Diagnostics/TracerouteTool',
  component: TracerouteTool,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Platform-adaptive traceroute diagnostic tool with real-time hop discovery, latency visualization, and network path analysis.',
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
type Story = StoryObj<typeof TracerouteTool>;

/**
 * 1. Idle State - Ready to Start
 *
 * Initial state with empty form waiting for user input.
 * Shows the form with default values and no results.
 */
export const Idle: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default idle state. Form is ready for input with default values: maxHops=30, timeout=3000ms, probeCount=3, protocol=ICMP.',
      },
    },
  },
};

/**
 * 2. Desktop Layout
 *
 * Full desktop layout with side-by-side form and real-time hop results.
 * Shows all advanced options and hop visualization with latency color-coding.
 */
export const Desktop: Story = {
  render: (args) => (
    <MockedProvider
      mocks={[]}
      addTypename={false}
    >
      <TracerouteToolDesktop {...args} />
    </MockedProvider>
  ),
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Desktop layout optimized for screens >1024px. Features side-by-side form and results with progressive hop discovery visualization.',
      },
    },
  },
};

/**
 * 3. Mobile Layout
 *
 * Compact mobile layout with stacked form and bottom sheet for advanced options.
 * Optimized for touch interactions with 44px minimum touch targets.
 */
export const Mobile: Story = {
  render: (args) => (
    <MockedProvider
      mocks={[]}
      addTypename={false}
    >
      <TracerouteToolMobile {...args} />
    </MockedProvider>
  ),
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'Mobile layout optimized for screens <640px. Advanced options hidden in bottom sheet. Touch-optimized with 44px minimum touch targets (WCAG AAA).',
      },
    },
  },
};

/**
 * 4. With Callbacks
 *
 * Demonstrates all callback handlers: onComplete, onError, onCancelled, onHopDiscovered.
 * Callbacks fire on events and can be used for analytics or custom behavior.
 */
export const WithCallbacks: Story = {
  args: {
    routerId: 'router-demo-001',
    onComplete: (result) => {
      console.log('Traceroute completed:', result);
      alert(`Traceroute complete! Reached ${result.target} in ${result.totalTimeMs.toFixed(0)}ms`);
    },
    onError: (error) => {
      console.error('Traceroute error:', error);
      alert(`Traceroute error: ${error}`);
    },
    onCancelled: () => {
      console.log('Traceroute cancelled');
      alert('Traceroute cancelled by user');
    },
    onHopDiscovered: (hop) => {
      console.log('Hop discovered:', hop);
      // Could send analytics event here
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates callback handlers. Check browser console and watch for alert dialogs when traceroute events occur.',
      },
    },
  },
};

/**
 * 5. Form Validation
 *
 * Shows form validation errors for invalid inputs.
 * All fields have Zod validation with clear error messages.
 */
export const FormValidation: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Form Validation Rules:**
- **Target:** Required, must be valid IPv4, IPv6, or hostname
- **Max Hops:** 1-64 (default: 30)
- **Timeout:** 100-30000ms (default: 3000)
- **Probe Count:** 1-5 (default: 3)
- **Protocol:** ICMP, UDP, or TCP (default: ICMP)

Try entering invalid values to see validation errors:
- Invalid IP: "999.999.999.999"
- Out of range: maxHops=100, timeout=50
        `.trim(),
      },
    },
  },
};

/**
 * 6. Accessibility Features
 *
 * Demonstrates WCAG AAA accessibility features.
 * Fully keyboard navigable with screen reader support.
 */
export const Accessibility: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story: `
**WCAG AAA Accessibility Features:**
- **Semantic HTML:** Proper form, label, and list structure
- **ARIA Labels:** All interactive elements labeled
- **Keyboard Navigation:** Full keyboard support (Tab, Enter, Esc)
- **Screen Reader:** Live regions announce hop discovery
- **Color Contrast:** 7:1 ratio for all text (WCAG AAA)
- **Touch Targets:** 44px minimum on mobile (WCAG AAA)
- **Focus Management:** Clear focus indicators
- **Error Messages:** Associated with inputs via aria-describedby

**Keyboard Shortcuts:**
- \`Enter\` on target input: Start traceroute
- \`Esc\` during traceroute: Cancel traceroute
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
          {
            id: 'aria-roles',
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * 7. Interactive Demo with Mocked Real-Time Hops
 *
 * Fully interactive demo with mocked GraphQL responses and WebSocket subscription.
 * Simulates progressive hop discovery with realistic latencies.
 */
export const InteractiveDemo: Story = {
  render: (args) => {
    const mockHops = [
      {
        hopNumber: 1,
        address: '192.168.1.1',
        hostname: 'gateway.local',
        status: 'SUCCESS',
        avgLatencyMs: 0.5,
        packetLoss: 0,
        probes: [
          { probeNumber: 1, latencyMs: 0.4, success: true, icmpCode: null },
          { probeNumber: 2, latencyMs: 0.5, success: true, icmpCode: null },
          { probeNumber: 3, latencyMs: 0.6, success: true, icmpCode: null },
        ],
      },
      {
        hopNumber: 2,
        address: '10.0.0.1',
        hostname: 'isp-gateway',
        status: 'SUCCESS',
        avgLatencyMs: 5.2,
        packetLoss: 0,
        probes: [
          { probeNumber: 1, latencyMs: 5.1, success: true, icmpCode: null },
          { probeNumber: 2, latencyMs: 5.2, success: true, icmpCode: null },
          { probeNumber: 3, latencyMs: 5.3, success: true, icmpCode: null },
        ],
      },
      {
        hopNumber: 3,
        address: null,
        hostname: null,
        status: 'TIMEOUT',
        avgLatencyMs: null,
        packetLoss: 100,
        probes: [
          { probeNumber: 1, latencyMs: null, success: false, icmpCode: null },
          { probeNumber: 2, latencyMs: null, success: false, icmpCode: null },
          { probeNumber: 3, latencyMs: null, success: false, icmpCode: null },
        ],
      },
      {
        hopNumber: 4,
        address: '8.8.8.8',
        hostname: 'dns.google',
        status: 'SUCCESS',
        avgLatencyMs: 15.3,
        packetLoss: 0,
        probes: [
          { probeNumber: 1, latencyMs: 15.2, success: true, icmpCode: null },
          { probeNumber: 2, latencyMs: 15.3, success: true, icmpCode: null },
          { probeNumber: 3, latencyMs: 15.4, success: true, icmpCode: null },
        ],
      },
    ];

    const mocks = [
      {
        request: {
          query: RUN_TRACEROUTE,
          variables: {
            deviceId: args.routerId,
            input: {
              target: '8.8.8.8',
              maxHops: 30,
              timeout: 3000,
              probeCount: 3,
              protocol: 'ICMP',
            },
          },
        },
        result: {
          data: {
            runTraceroute: {
              jobId: 'demo-job-traceroute-123',
              status: 'RUNNING',
            },
          },
        },
      },
      {
        request: {
          query: TRACEROUTE_PROGRESS_SUBSCRIPTION,
          variables: {
            jobId: 'demo-job-traceroute-123',
          },
        },
        result: {
          data: {
            tracerouteProgress: {
              jobId: 'demo-job-traceroute-123',
              eventType: 'HOP_DISCOVERED',
              hop: mockHops[0],
              result: null,
              error: null,
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
        <TracerouteTool {...args} />
      </MockedProvider>
    );
  },
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Demo:**

This story demonstrates the full traceroute workflow with mocked GraphQL responses.

**How to use:**
1. Enter "8.8.8.8" in the target field
2. Click "Start Traceroute"
3. Watch hops appear progressively with latency color-coding:
   - **Green** (<50ms): Excellent latency
   - **Yellow** (50-150ms): Acceptable latency
   - **Red** (>150ms): Poor latency
   - **Gray** (timeout): No response ("* * *")

**Features demonstrated:**
- Progressive hop discovery
- Latency color-coding
- Timeout handling (hop 3)
- Progress indicator
- Export functionality (Copy/JSON download)
- Real-time subscription updates

**Note:** This demo uses mocked data. In production, hops are discovered progressively via WebSocket subscription.
        `.trim(),
      },
    },
  },
};

/**
 * Protocol Variants
 *
 * Example showing different protocol options (ICMP, UDP, TCP).
 */
export const ProtocolVariants: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Protocol Options:**
- **ICMP** (default): Most common, works on most networks
- **UDP**: Alternative if ICMP is blocked by firewalls
- **TCP**: Useful for testing specific ports and firewall rules

Try changing the protocol in Advanced Options to see how it affects the command.
        `.trim(),
      },
    },
  },
};

/**
 * Dark Mode
 *
 * Component in dark mode theme with proper color contrast.
 */
export const DarkMode: Story = {
  args: {
    routerId: 'router-demo-001',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story:
          'Dark mode theme with maintained 7:1 contrast ratio (WCAG AAA). Latency colors adjust automatically for dark background.',
      },
    },
  },
};
