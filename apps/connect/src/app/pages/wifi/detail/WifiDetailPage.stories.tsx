/**
 * Storybook stories for WifiDetailPage
 *
 * WifiDetailPage is the per-interface detail screen. It is mounted at the route
 *   /router/:id/wifi/:interfaceName
 * and composes three distinct render paths:
 *
 *   - Loading  : skeleton bars while useWirelessInterfaceDetail is pending
 *   - Error    : red error panel + "Back to WiFi" link when the query rejects or
 *                the interface is not found
 *   - Success  : back-button header, page title (SSID / interface name), and the
 *                full WirelessInterfaceDetail component with six card sections
 *                (header, radio settings, security, optional signal, optional
 *                regional, hardware)
 *
 * Route params are consumed via Route.useParams() (TanStack Router) and router
 * data is fetched via Apollo. Neither is available in the Storybook sandbox, so
 * each story documents and annotates the state that would be visible at runtime.
 *
 * Mock interface data follows the WirelessInterfaceDetail type from
 * @nasnet/core/types.
 */

import { WifiDetailPage } from './WifiDetailPage';

import type { Meta, StoryObj } from '@storybook/react';


const meta: Meta<typeof WifiDetailPage> = {
  title: 'App/Pages/WifiDetailPage',
  component: WifiDetailPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Per-interface WiFi configuration detail page. Accessed via the route ' +
          '`/router/:id/wifi/:interfaceName`.\n\n' +
          'The page renders three states based on the `useWirelessInterfaceDetail` query:\n\n' +
          '1. **Loading** — three skeleton bars (back-button, title, and three detail cards) ' +
          'are displayed while the Apollo query is in-flight.\n' +
          '2. **Error** — a red bordered error panel with the Apollo error message (or a ' +
          '"not found" fallback) is shown below the "Back to WiFi" navigation button.\n' +
          '3. **Loaded** — back-navigation button, page title (SSID or "Wireless Interface"), ' +
          'interface name subtitle, and a `WirelessInterfaceDetail` component with six ' +
          'expandable card sections: Header, Radio Settings, Security, Connection ' +
          '(station mode only), Regional (when country code is present), and Hardware.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WifiDetailPage>;

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

/**
 * Loading — initial paint before the wireless interface data arrives.
 * useWirelessInterfaceDetail sets isLoading=true which renders three skeleton bars.
 */
export const Default: Story = {
  name: 'Default (loading state)',
  parameters: {
    docs: {
      description: {
        story:
          'Before the wireless interface data arrives from the router the page renders ' +
          'a three-row skeleton: a back-button placeholder, a page title placeholder, ' +
          'and three detail-card rectangles with a pulse animation. ' +
          'This is the first visible state after navigating to /router/:id/wifi/:interfaceName.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

/**
 * Error — the useWirelessInterfaceDetail query failed or returned no data.
 * Renders the "Back to WiFi" button followed by a red error panel.
 */
export const ErrorState: Story = {
  name: 'Error State',
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
          Simulated: useWirelessInterfaceDetail returned an error
          <br />
          Message: "Connection to router timed out"
          <br />
          Back-button visible; detail cards not rendered
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When the Apollo query rejects (router offline, session expired) or the ' +
          'interface name is not found in the response the page renders a red bordered ' +
          'error panel that includes the error message or a fallback "Interface not found" ' +
          'string. The "Back to WiFi" navigation button remains accessible so the user ' +
          'can return to the interface list without using the browser back button.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Access Point (AP-Bridge) mode — typical home router interface
// ---------------------------------------------------------------------------

/**
 * AP-Bridge (Access Point) — most common MikroTik wireless interface configuration.
 * Shows all six card sections: header, radio settings, security, regional, hardware.
 * The Connection card is hidden (station mode only).
 */
export const AccessPointMode: Story = {
  name: 'Access Point Mode (annotated)',
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
          <strong style={{ color: '#EFC729' }}>Simulated: AP-Bridge mode</strong>
          <br />
          Interface: wlan1 · SSID: HomeNetwork_5G
          <br />
          Band: 5GHz · Channel: 36 · Width: 80MHz
          <br />
          TX Power: 23 dBm · Security: WPA2-PSK (AES)
          <br />
          Country: US · MAC: D4:CA:6D:AA:11:22
          <br />
          Connected Clients: 4
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Loaded state for a 5 GHz access point interface (ap-bridge mode). ' +
          'Displays the SSID as the page heading and the interface name as the subtitle. ' +
          'The Radio Settings card shows frequency (5180 MHz), channel (36), channel ' +
          'width (80 MHz), and TX power (23 dBm). The Security card shows the profile ' +
          'name and network visibility (Visible). The Regional card shows the US country ' +
          'code. The Hardware card shows the MAC address with a copy button and the ' +
          'connected client count. The Connection (signal) card is absent because ' +
          'ap-bridge mode does not report upstream signal strength.',
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Station mode — router acting as a wireless client
// ---------------------------------------------------------------------------

/**
 * Station mode — interface is connected to an upstream AP.
 * Renders the additional Connection card showing signal strength and connected-to SSID.
 */
export const StationMode: Story = {
  name: 'Station Mode (with signal card)',
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
          <strong style={{ color: '#4972BA' }}>Simulated: Station mode</strong>
          <br />
          Interface: wlan2 · SSID: UpstreamAP
          <br />
          Band: 2.4GHz · Channel: 6 · Width: 20MHz
          <br />
          Signal Strength: −62 dBm
          <br />
          Connected To: OfficeRouter_2G
          <br />
          The Connection card is visible (station mode only)
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'When the wireless interface operates in station mode (acting as a client ' +
          'connected to an upstream access point) the page renders an extra Connection ' +
          'card between the Security and Regional sections. The card shows the signal ' +
          'strength in dBm and, if available, the SSID of the upstream AP the interface ' +
          'is associated with. The Hardware card omits the Connected Clients row because ' +
          'station mode interfaces do not aggregate downstream clients.',
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
