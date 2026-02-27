/**
 * Storybook stories for NetworkTab
 *
 * NetworkTab is a thin structural wrapper that renders the full NetworkDashboard
 * inside the router panel's "Network" tab slot. It has no props of its own —
 * all behaviour, data-fetching, loading/error states, and layout come from
 * NetworkDashboard, which is composed directly:
 *
 *   export function NetworkTab() {
 *     return <NetworkDashboard />;
 *   }
 *
 * Because NetworkDashboard is already covered by its own story file
 * (App/Pages/NetworkDashboard), these stories focus on:
 *   1. Documenting the tab-level context in which NetworkDashboard appears.
 *   2. Showing how the tab fits inside the router panel layout (sidebar +
 *      tab navigation + content area).
 *   3. Calling out the three observable render states: loading skeleton,
 *      error display, and the fully-loaded four-section dashboard.
 *
 * Data is fetched via Apollo hooks (useInterfaces, useARPTable, useIPAddresses,
 * useDHCPServers, useDHCPLeases, useDHCPPools) using the currentRouterIp from
 * the Zustand connection store. Neither Apollo nor Zustand is available in the
 * Storybook sandbox, so stories use annotated decorators to explain each state.
 */

import { NetworkTab } from './NetworkTab';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof NetworkTab> = {
  title: 'App/Pages/NetworkTab',
  component: NetworkTab,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Structural wrapper that places `NetworkDashboard` into the "Network" tab of the ' +
          'router panel.\n\n' +
          '`NetworkTab` has no props — it is a pure delegation component:\n\n' +
          '```tsx\n' +
          'export function NetworkTab() {\n' +
          '  return <NetworkDashboard />;\n' +
          '}\n' +
          '```\n\n' +
          'All content, logic, and state handling live in `NetworkDashboard`. ' +
          'The dashboard is composed of four sections:\n\n' +
          '1. **DHCP Pool Status** — server count, active leases, available IPs, ' +
          'and a colour-coded utilisation bar (green < 70 %, amber 70–90 %, red ≥ 90 %).\n' +
          '2. **Interfaces** — responsive grid of up to 6 `InterfaceGridCard` tiles ' +
          '(status dot, type icon, name, RX/TX traffic stats).\n' +
          '3. **Connected Devices** — ARP table summary (complete / incomplete / failed ' +
          'breakdown) with a compact list of up to 5 entries.\n' +
          '4. **IP Addresses** — configured IPs grouped by interface with Dynamic/Static badges.\n\n' +
          'See the **App/Pages/NetworkDashboard** story set for exhaustive per-section coverage.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkTab>;

// ---------------------------------------------------------------------------
// Default — initial render (loading skeleton)
// ---------------------------------------------------------------------------

/**
 * Default — first render before any interface data arrives.
 * NetworkDashboard shows a full-page LoadingSkeleton while useInterfaces is pending.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  parameters: {
    docs: {
      description: {
        story:
          'NetworkTab delegates immediately to NetworkDashboard. Before interface data ' +
          'arrives the dashboard renders a full-page LoadingSkeleton composed of several ' +
          'grey pulse bars representing the DHCP, interface grid, connected-devices, and ' +
          'IP-overview sections. This is the first visible state after the user selects ' +
          'the Network tab in the router panel.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Loaded — healthy network, all sections populated
// ---------------------------------------------------------------------------

/**
 * Loaded (healthy network) — all four dashboard sections are populated.
 * DHCP utilisation is well below 70 % so the utilisation bar renders green.
 */
export const LoadedHealthyNetwork: Story = {
  name: 'Loaded — Healthy Network (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(30,30,30,0.90)',
            color: '#d4d4d4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 320,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Simulated: NetworkTab — healthy network</strong>
          <br />
          Interfaces (6): ether1–4 (running + link-up), wlan1 (running), bridge1
          <br />
          DHCP: 1 server · 18/50 leases · 36% utilisation (green bar)
          <br />
          ARP: 18 entries (16 complete, 2 incomplete)
          <br />
          IPs: ether1 → 192.168.1.1/24, ether2 → 10.0.0.1/30
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Fully loaded state representing a healthy SOHO network. All four NetworkDashboard ' +
          'sections are visible: the DHCP pool bar is green (36 % utilisation), six interface ' +
          'cards display green status dots for ethernet ports with active links, the ARP section ' +
          'shows 18 devices, and the IP overview lists addresses grouped by interface.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Loaded — high DHCP utilisation warning
// ---------------------------------------------------------------------------

/**
 * Loaded (high DHCP utilisation) — pool is at or above 90 %, bar renders red.
 */
export const LoadedHighDHCPUtilisation: Story = {
  name: 'Loaded — High DHCP Utilisation (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(239,68,68,0.90)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 300,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated: DHCP pool at 94% capacity
          <br />
          47/50 leases bound · 3 IPs available
          <br />
          Utilisation bar renders red (≥ 90%)
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When the DHCP pool is nearly exhausted (≥ 90 % utilisation) the DHCPPoolSummary ' +
          'bar and percentage label switch to the destructive red colour token, alerting the ' +
          'administrator that IP exhaustion is imminent. All other NetworkDashboard sections ' +
          'render normally.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Error — interface fetch failed
// ---------------------------------------------------------------------------

/**
 * Error — useInterfaces query rejected. ErrorDisplay replaces the full page.
 */
export const InterfaceLoadError: Story = {
  name: 'Error — Interface Load Failed (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(239,68,68,0.90)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated: useInterfaces returned an error
          <br />
          ErrorDisplay replaces all four sections
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When the interface query fails (router unreachable, session expired, network ' +
          'timeout) NetworkDashboard switches to an ErrorDisplay that fills the viewport ' +
          'with an error message and a retry action. The role="alert" attribute ensures ' +
          'screen readers announce the failure immediately.',
      },
    },
  },
};

/**
 * Mobile viewport story – verifies the dashboard sections are responsive on narrow screens.
 */
export const Mobile: Story = {
  name: 'Mobile Viewport',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'NetworkTab rendered on a mobile viewport (375px). DHCP, interface, device, and IP sections stack vertically with mobile-optimized spacing.',
      },
    },
  },
};

/**
 * Desktop viewport story – verifies the dashboard layout optimized for larger screens.
 */
export const Desktop: Story = {
  name: 'Desktop Viewport',
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    docs: {
      description: {
        story:
          'NetworkTab rendered on a desktop viewport (1280px+). Multi-column layout with dense data tables and full-width visualizations.',
      },
    },
  },
};
