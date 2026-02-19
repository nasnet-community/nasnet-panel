/**
 * Storybook stories for NetworkDashboard
 *
 * NetworkDashboard is the main network overview screen. It composes four sections:
 *   1. DHCPPoolSummary  — DHCP server count, active leases, pool utilisation bar
 *   2. InterfaceGridCard grid — up to 6 interface cards (running/link-up status dots)
 *   3. ConnectedDevicesCard — ARP table summary with device list
 *   4. QuickIPOverview  — IP addresses grouped by interface, expandable rows
 *
 * Data is fetched via Apollo hooks (useInterfaces, useARPTable, useIPAddresses,
 * useDHCPServers, useDHCPLeases, useDHCPPools) using currentRouterIp from Zustand.
 *
 * The page handles three top-level render paths:
 *   - Loading : LoadingSkeleton replaces the full page while useInterfaces is pending
 *   - Error   : ErrorDisplay replaces the page when useInterfaces fails
 *   - Loaded  : Full four-section layout with inner per-section loading/error states
 */

import { NetworkDashboard } from './NetworkDashboard';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof NetworkDashboard> = {
  title: 'App/Pages/NetworkDashboard',
  component: NetworkDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Network overview dashboard. Four sections in a single-column layout ' +
          '(two-column on lg+ for devices + IP overview):\n\n' +
          '1. **DHCP Pool Status** — server count, active leases, available IPs, ' +
          'total pool size, and a colour-coded utilisation bar ' +
          '(green < 70 %, amber 70–90 %, red ≥ 90 %).\n' +
          '2. **Interfaces** — responsive grid of up to 6 InterfaceGridCard tiles. ' +
          'Each card shows status dot (green = running+link-up, amber = running+no-link, ' +
          'grey = disabled), type icon, name, and collapsible traffic stats (RX/TX bytes).\n' +
          '3. **Connected Devices** — ARP table entry count with complete/incomplete/failed ' +
          'breakdown and a list of up to 5 recent entries.\n' +
          '4. **IP Addresses** — all configured IP addresses grouped by interface, ' +
          'collapsible per-interface with Dynamic/Static badges.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NetworkDashboard>;

/**
 * Default – initial render before interface data is fetched.
 * useInterfaces returns isLoading=true which causes the full-page LoadingSkeleton.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  parameters: {
    docs: {
      description: {
        story:
          'Before interface data arrives the page renders a full-page LoadingSkeleton ' +
          '(several grey pulse bars that represent the DHCP, interface grid, devices, ' +
          'and IP sections). This is the first visible state after navigating to /network.',
      },
    },
  },
};

/**
 * Healthy network – all sections populated with realistic data.
 * Annotated with a badge describing the mock data.
 */
export const HealthyNetwork: Story = {
  name: 'Healthy Network (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(30,30,30,0.9)',
            color: '#d4d4d4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 320,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Simulated healthy network</strong>
          <br />
          Interfaces (6): ether1–4 (running+link-up), wlan1 (running), bridge1 (running)
          <br />
          DHCP: 1 server · 18/50 leases · 36% utilisation (green)
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
          'Represents a typical healthy home/SOHO network state. ' +
          'DHCP utilisation is 36 % (green bar). Six interface cards are visible: ' +
          'four ethernet ports with active links (green dot + ping animation), ' +
          'a wireless interface (running, amber dot), and a bridge (running, amber dot). ' +
          'The ARP section lists 18 devices, 16 complete. IPs grouped by interface.',
      },
    },
  },
};

/**
 * High DHCP utilisation – pool is nearly exhausted (≥ 90 %).
 */
export const HighDHCPUtilisation: Story = {
  name: 'High DHCP Utilisation (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(239,68,68,0.9)',
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
          47/50 leases bound · 3 available
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
          'When DHCP pool utilisation exceeds 90 % the DHCPPoolSummary bar renders red ' +
          'and the percentage label switches to the destructive red colour token. ' +
          'This warns administrators that the pool is nearly exhausted and may need ' +
          'expanding or that an IP exhaustion event is imminent.',
      },
    },
  },
};

/**
 * Error state – interface fetch fails, ErrorDisplay replaces the page.
 */
export const InterfaceLoadError: Story = {
  name: 'Interface Load Error',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(239,68,68,0.9)',
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated: useInterfaces returned an error
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When the useInterfaces query rejects (e.g. the router is unreachable or ' +
          'the session expired) the page switches to an ErrorDisplay that fills the ' +
          'viewport with an error message and a retry action. ' +
          'The role="alert" attribute ensures screen readers announce the failure.',
      },
    },
  },
};
