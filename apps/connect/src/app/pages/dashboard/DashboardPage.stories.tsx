/**
 * Storybook stories for DashboardPage
 *
 * DashboardPage is the primary post-connection landing screen. It composes:
 *   - StatusCard        : hero status pill with device count, available CPU %, and uptime
 *   - VPNCardEnhanced   : quick VPN toggle with profile info (name, location, flag)
 *   - QuickActionButton : 5-button grid (WiFi, Network, Firewall, Settings, Troubleshoot)
 *   - ResourceGauge     : CPU / Memory / Disk gauge tiles
 *   - SystemInfoCard    : router identity, model, version card
 *   - HardwareCard      : routerboard hardware details
 *
 * All data is sourced from Apollo hooks (useRouterInfo, useRouterResource,
 * useRouterboard) using the currentRouterIp from the Zustand connection store.
 */

import { DashboardPage } from './DashboardPage';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof DashboardPage> = {
  title: 'App/Pages/DashboardPage',
  component: DashboardPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main dashboard screen displayed after successfully connecting to a router. ' +
          'The page is structured in four vertical sections:\n\n' +
          '1. **Hero StatusCard** — overall health pill (healthy / warning / error / loading) ' +
          'with three quick metrics: connected device count, available CPU headroom, and uptime.\n' +
          '2. **VPN Quick Toggle** — VPNCardEnhanced showing current profile (name, location, flag emoji) ' +
          'with a toggle to connect/disconnect.\n' +
          '3. **Quick Actions** — 5-button grid for common navigation: WiFi, Network, Firewall, ' +
          'Settings, Troubleshoot.\n' +
          '4. **Resource Monitor + Hardware** — SystemInfoCard, CPU/Memory/Disk ResourceGauges, ' +
          'and a HardwareCard grid.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

/**
 * Default – renders the full dashboard shell.
 * Without an Apollo/Zustand context the resource gauges display loading skeletons.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  parameters: {
    docs: {
      description: {
        story:
          'Initial paint before any router data arrives. ' +
          'StatusCard shows "Loading...", ResourceGauge tiles display skeletons, ' +
          'and VPNCardEnhanced renders with "disconnected" status (hardcoded placeholder).',
      },
    },
  },
};

/**
 * Healthy system – all metrics green, VPN disconnected.
 */
export const HealthySystem: Story = {
  name: 'Healthy System (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(34,197,94,0.92)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 260,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated healthy state
          <br />
          CPU: 18% · RAM: 42% · Disk: 28%
          <br />
          Status: "All Systems Online"
          <br />
          VPN: disconnected · Uptime: 14d 6h
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'All resource metrics are below 70 % so calculateStatus() returns "healthy". ' +
          'The StatusCard hero shows the green "All Systems Online" pill. ' +
          'ResourceGauge arcs are rendered in the success green colour token.',
      },
    },
  },
};

/**
 * Warning state – one or more metrics between 70-90 %.
 */
export const WarningState: Story = {
  name: 'Warning State (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(245,158,11,0.92)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 260,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated warning state
          <br />
          CPU: 76% · RAM: 84% · Disk: 35%
          <br />
          Status: "Attention Needed"
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'CPU or memory usage is between 70–90 %. The overall network status becomes ' +
          '"warning", the StatusCard hero turns amber, and the affected ResourceGauge ' +
          'arcs switch to the warning amber colour token.',
      },
    },
  },
};

/**
 * Critical / error state – metrics above 90 % or an API error.
 */
export const CriticalState: Story = {
  name: 'Critical / Error State (annotated)',
  decorators: [
    (Story) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(239,68,68,0.92)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.7,
            maxWidth: 260,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          Simulated critical state
          <br />
          CPU: 96% · RAM: 94% · Disk: 91%
          <br />
          Status: "System Issues Detected"
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'At least one metric exceeds 90 %. calculateStatus() returns "critical", ' +
          'the StatusCard hero turns red ("System Issues Detected"), and the ' +
          'corresponding ResourceGauge arcs render in the destructive red colour token.',
      },
    },
  },
};
