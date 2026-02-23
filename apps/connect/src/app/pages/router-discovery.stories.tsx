/**
 * Storybook stories for RouterDiscoveryPage
 *
 * The RouterDiscoveryPage is the entry-point landing page where users discover
 * and connect to MikroTik routers. It offers three modes:
 *   - Auto-Scan  : subnet scanner (NetworkScanner component)
 *   - Manual Entry: form to type an IP directly (ManualRouterEntry)
 *   - My Routers : list of previously discovered routers (RouterList)
 *
 * The page integrates with Zustand router/connection stores and TanStack Router
 * (useNavigate). Stories document the three view modes and empty/populated
 * router list variants.
 */

import { RouterDiscoveryPage } from './router-discovery';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof RouterDiscoveryPage> = {
  title: 'App/Pages/RouterDiscoveryPage',
  component: RouterDiscoveryPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Landing page for discovering and connecting to MikroTik routers. ' +
          'Three modes are available via tab-style buttons at the top: ' +
          '**Auto-Scan** runs a subnet sweep and auto-populates the router list; ' +
          '**Manual Entry** lets users type an IP address directly; ' +
          '**My Routers** shows previously discovered routers with connect/remove actions. ' +
          'On router selection a CredentialDialog opens to validate username/password before ' +
          'navigating to the router panel.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RouterDiscoveryPage>;

/**
 * Default view – "My Routers" tab with an empty router list.
 * This is what a first-time user sees.
 */
export const Default: Story = {
  name: 'Default – Empty Router List',
  parameters: {
    docs: {
      description: {
        story:
          'First-time user experience: no routers have been discovered yet. ' +
          'The "My Routers" tab is active and shows the empty-state with ' +
          '"Scan Network" and "Add Manually" action buttons.',
      },
    },
  },
};

/**
 * Auto-Scan view – the NetworkScanner panel is displayed.
 */
export const ScanView: Story = {
  name: 'Auto-Scan Mode',
  decorators: [
    (Story) => (
      <div>
        {/* Annotate which tab is active for documentation purposes */}
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
          'The Auto-Scan tab renders the NetworkScanner component which allows users ' +
          'to choose a subnet, launch a background scan, and see discovered MikroTik ' +
          'devices in real time. Clicking a result triggers the CredentialDialog.',
      },
    },
  },
};

/**
 * Manual Entry view – ManualRouterEntry form is shown.
 */
export const ManualEntryView: Story = {
  name: 'Manual Entry Mode',
  decorators: [
    (Story) => (
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
          'optional display-name field. Submitting the form adds the router to the ' +
          'store and opens the CredentialDialog immediately.',
      },
    },
  },
};

/**
 * Populated router list – documents the state after several routers are known.
 * Because the page pulls from Zustand, we describe this variant in docs.
 */
export const PopulatedRouterList: Story = {
  name: 'Populated Router List (annotated)',
  decorators: [
    (Story) => (
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
          In a live context the "My Routers" list would show routers such as:
          <br />• 192.168.1.1 — MikroTik hAP ax³ (online)
          <br />• 10.0.0.1 — CCR2004-1G-12S (offline)
          <br />• 172.16.0.1 — RB4011 (unknown)
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Once routers are added to the Zustand router store the "My Routers" tab ' +
          'shows RouterCard entries with status badges (online / offline / unknown), ' +
          'model information, last-connected time, and Connect / Remove action buttons. ' +
          'Double-clicking a card with saved credentials auto-connects without the dialog.',
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
