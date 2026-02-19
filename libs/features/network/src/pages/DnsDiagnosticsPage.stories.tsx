/**
 * DnsDiagnosticsPage Storybook Stories
 *
 * Page-level stories for the DNS Diagnostics page.
 * Covers default, alternate device IDs, and mobile viewport.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DnsDiagnosticsPage } from './DnsDiagnosticsPage';

const meta: Meta<typeof DnsDiagnosticsPage> = {
  title: 'Pages/Network/DnsDiagnosticsPage',
  component: DnsDiagnosticsPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Diagnostic hub for DNS troubleshooting and server benchmarking.

Composes three focused tools in a responsive layout:

| Tool | Purpose |
|------|---------|
| **DnsLookupTool** | Resolve a hostname and display A / AAAA / MX / TXT records |
| **DnsBenchmark** | Measure and compare latency for each configured DNS server |
| **DnsCachePanel** | View cache hit/miss statistics and flush the DNS cache |

### Layout
- **Desktop (lg+):** DnsLookupTool and DnsBenchmark sit side-by-side in a 2-column grid; DnsCachePanel spans full width below.
- **Mobile:** All three tools are stacked vertically in a single column.

### Props
- **deviceId** – The router/device identifier forwarded to each child tool for
  its GraphQL queries. Defaults to \`'default'\`.
      `,
      },
    },
  },
  argTypes: {
    deviceId: {
      control: 'text',
      description: 'Device ID forwarded to DnsLookupTool, DnsBenchmark, and DnsCachePanel',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DnsDiagnosticsPage>;

/**
 * Default – page with a concrete device ID ready for interactive use.
 */
export const Default: Story = {
  args: {
    deviceId: 'device-demo-001',
  },
};

/**
 * DefaultDeviceFallback – no deviceId supplied; falls back to the string "default".
 */
export const DefaultDeviceFallback: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'When deviceId is omitted the page falls back to the string "default". ' +
          'All three child tools receive this value for their GraphQL queries.',
      },
    },
  },
};

/**
 * AlternateDevice – diagnostic tools scoped to a different device ID.
 */
export const AlternateDevice: Story = {
  args: {
    deviceId: 'router-edge-3',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates that all three diagnostic tools (lookup, benchmark, cache) are ' +
          'independently re-scoped when a different deviceId is provided.',
      },
    },
  },
};

/**
 * MobileViewport – single-column stacked layout at 375 px wide.
 */
export const MobileViewport: Story = {
  args: {
    deviceId: 'device-demo-001',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'On narrow viewports the 2-column grid collapses to a single column: ' +
          'DnsLookupTool, then DnsBenchmark, then DnsCachePanel stacked vertically.',
      },
    },
  },
};
