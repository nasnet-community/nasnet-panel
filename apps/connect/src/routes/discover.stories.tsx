/**
 * Storybook stories for the Discover route
 *
 * The /discover route renders the RouterDiscoveryPage which is the landing page
 * for discovering and connecting to MikroTik routers. Three modes are available:
 * Auto-Scan, Manual Entry, and My Routers list.
 */

import { RouterDiscoveryPage } from '@/app/pages/router-discovery';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof RouterDiscoveryPage> = {
  title: 'App/Discover/RouterDiscoveryPage',
  component: RouterDiscoveryPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Router discovery landing page (Epic 0.1). Provides three methods for connecting ' +
          'to MikroTik routers: **Auto-Scan** runs a subnet sweep to find devices; ' +
          '**Manual Entry** allows typing an IP address directly; **My Routers** shows ' +
          'previously discovered routers. On router selection, a CredentialDialog validates ' +
          'username/password before navigating to the router panel.',
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RouterDiscoveryPage>;

/**
 * Default view - "My Routers" tab with an empty router list.
 */
export const Default: Story = {
  name: 'Default - Empty Router List',
  parameters: {
    docs: {
      description: {
        story:
          'First-time user experience: the "My Routers" tab is active with no routers ' +
          'discovered yet. The empty state shows "No routers yet" with action buttons ' +
          'to "Scan Network" or "Add Manually".',
      },
    },
  },
};

/**
 * Auto-Scan view - NetworkScanner panel.
 */
export const ScanView: Story = {
  name: 'Auto-Scan Mode',
  decorators: [
    (Story: React.ComponentType) => (
      <div>
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(59,130,246,0.85)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          Storybook: "Auto-Scan" tab active
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The Auto-Scan tab renders the NetworkScanner component. Users choose a subnet, ' +
          'launch a scan, and see discovered MikroTik devices in real time. ' +
          'Clicking a result triggers the CredentialDialog.',
      },
    },
  },
};

/**
 * Manual Entry view - form for typing a router IP.
 */
export const ManualEntryView: Story = {
  name: 'Manual Entry Mode',
  decorators: [
    (Story: React.ComponentType) => (
      <div>
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(59,130,246,0.85)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          Storybook: "Manual Entry" tab active
        </div>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The Manual Entry tab renders a simple form with an IP address field and ' +
          'optional display name. Submitting adds the router to the Zustand store ' +
          'and opens the CredentialDialog immediately.',
      },
    },
  },
};

/**
 * Populated router list - documents the state after routers are discovered.
 */
export const PopulatedRouterList: Story = {
  name: 'Populated Router List (annotated)',
  decorators: [
    (Story: React.ComponentType) => (
      <div className="relative">
        <Story />
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'rgba(30,30,30,0.88)',
            color: '#d4d4d4',
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.6,
            maxWidth: 280,
            pointerEvents: 'none',
          }}
        >
          <strong style={{ color: '#EFC729' }}>Mock data description</strong>
          <br />
          In a live context the "My Routers" list would show:
          <br />- 192.168.1.1 — hAP ax3 (online)
          <br />- 10.0.0.1 — CCR2004-1G-12S (offline)
          <br />- 172.16.0.1 — RB4011 (unknown)
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Once routers are in the Zustand store the "My Routers" tab shows RouterCard ' +
          'entries with status badges (online/offline/unknown), model info, last-connected ' +
          'time, and Connect/Remove actions. Double-clicking with saved credentials ' +
          'auto-connects without showing the dialog.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
