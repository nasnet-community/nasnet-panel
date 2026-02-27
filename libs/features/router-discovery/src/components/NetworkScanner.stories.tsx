import type { ScanResult } from '@nasnet/core/types';

import { NetworkScanner } from './NetworkScanner';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NetworkScanner> = {
  title: 'Features/RouterDiscovery/NetworkScanner',
  component: NetworkScanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Provides a subnet input and scan trigger that auto-discovers MikroTik routers on the local network. The component manages its own scan lifecycle (idle → scanning → results/error). Story props control the default subnet and callbacks; internal state transitions are driven by user interaction.',
      },
    },
  },
  argTypes: {
    defaultSubnet: {
      control: 'text',
      description: 'Pre-filled subnet value in CIDR notation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkScanner>;

// ─── Mock callback helpers ────────────────────────────────────────────────────

const _mockResults: ScanResult[] = [
  {
    ipAddress: '192.168.88.1',
    isReachable: true,
    responseTime: 4,
    model: 'RB5009UPr+S+IN',
    routerOsVersion: '7.16.2',
    macAddress: '2C:C8:1B:AA:BB:CC',
    httpPort: 80,
  },
  {
    ipAddress: '192.168.88.2',
    isReachable: true,
    responseTime: 12,
    model: 'hEX S',
    routerOsVersion: '7.14',
    macAddress: 'DC:2C:6E:11:22:33',
  },
  {
    ipAddress: '192.168.88.10',
    isReachable: true,
    responseTime: 28,
    model: 'RB760iGS',
    routerOsVersion: '6.49.15',
    macAddress: 'B8:69:F4:44:55:66',
    httpPort: 443,
  },
];

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default idle state — the scanner is ready for the user to click Scan Network.
 * The subnet field is pre-populated with the common MikroTik default.
 */
export const Default: Story = {
  args: {
    defaultSubnet: '192.168.88.0/24',
    onScanComplete: (results) => console.log('Scan complete, found:', results.length),
    onRouterSelect: (result) => console.log('Selected router:', result.ipAddress),
  },
};

/**
 * Custom subnet pre-filled — useful for enterprise environments using 10.x addressing.
 */
export const CustomSubnet: Story = {
  args: {
    defaultSubnet: '10.0.0.0/24',
    onScanComplete: (results) => console.log('Scan complete:', results),
    onRouterSelect: (result) => console.log('Router selected:', result),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The defaultSubnet prop pre-fills the input with a custom CIDR range, covering enterprise 10.x networks.',
      },
    },
  },
};

/**
 * Demonstrates the layout when scan results populate — click "Scan Network" in
 * the Default story to reach this state interactively. This story documents the
 * props passed to onScanComplete once results arrive.
 *
 * Note: because NetworkScanner owns its state, this story shows the idle view
 * but documents what the result list looks like (see _mockResults above).
 */
export const WithResultsCallback: Story = {
  args: {
    defaultSubnet: '192.168.88.0/24',
    onScanComplete: (results: ScanResult[]) => {
      console.log(
        `Found ${results.length} routers:`,
        results.map((r) => r.ipAddress)
      );
      // In a real app this data would be passed to RouterList
      alert(
        `Scan found ${results.length} router(s):\n${results.map((r) => `  • ${r.ipAddress} (${r.model ?? 'unknown'})`).join('\n')}`
      );
    },
    onRouterSelect: (result: ScanResult) => {
      console.log('User selected:', result);
      alert(`Connecting to ${result.ipAddress}…`);
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Illustrates the shape of ScanResult objects passed to onScanComplete and onRouterSelect callbacks after a successful scan.',
      },
    },
  },
};

/**
 * No callbacks wired — useful for embedding as a display-only component
 * or when the parent provides no handler yet.
 */
export const Standalone: Story = {
  args: {
    defaultSubnet: '192.168.1.0/24',
  },
  parameters: {
    docs: {
      description: {
        story:
          'NetworkScanner with no callback props. The scan still runs but discovered routers cannot be selected.',
      },
    },
  },
};

/**
 * Wide container — verifies the layout fills larger viewports gracefully.
 */
export const WideLayout: Story = {
  args: {
    defaultSubnet: '192.168.88.0/24',
    onScanComplete: (results) => console.log('results:', results),
    onRouterSelect: (result) => console.log('selected:', result),
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Renders inside a full-width container to verify responsive behaviour on large screens.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-component-xl mx-auto max-w-3xl">
        <Story />
      </div>
    ),
  ],
};
