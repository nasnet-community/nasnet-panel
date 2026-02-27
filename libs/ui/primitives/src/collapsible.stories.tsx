import * as React from 'react';

import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

// Icons imported individually for tree-shaking (not entire lucide-react library)
import { ChevronsUpDown, ChevronDown, Settings, Wifi, Shield } from 'lucide-react';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Collapsible> = {
  title: 'Primitives/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Interactive component that expands or collapses a panel of content. Built on @radix-ui/react-collapsible. Unlike Accordion, Collapsible is a single-panel toggle — use for "show more", advanced options, and filter sidebars. Fully keyboard accessible and WCAG AAA compliant.',
      },
    },
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controlled open state (requires onOpenChange handler)',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Default open state for uncontrolled usage',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the collapsible trigger and prevents interaction',
    },
    onOpenChange: {
      action: 'onOpenChange triggered',
      description: 'Callback fired when open state changes',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="space-y-2">
      <div className="flex items-center justify-between rounded-md border px-4 py-2">
        <span className="text-sm font-medium">Advanced Network Settings</span>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle advanced settings</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="bg-muted/30 rounded-md border px-4 py-3 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">MTU Size</span>
            <span className="font-mono">1500</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">TTL</span>
            <span className="font-mono">64</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">ARP Timeout</span>
            <span className="font-mono">30s</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible
      defaultOpen
      className="space-y-2"
    >
      <div className="flex items-center justify-between rounded-md border px-4 py-2">
        <span className="text-sm font-medium">Router Status</span>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle router status</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="bg-muted/30 space-y-2 rounded-md border px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span>14d 6h 32m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPU Load</span>
            <span>23%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Free Memory</span>
            <span>41 MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Free HDD</span>
            <span>512 MB</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Controlled: Story = {
  render: function ControlledCollapsible() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className="space-y-3">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div className="flex items-center gap-2">
              <Settings className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Firewall Configuration</span>
            </div>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
              >
                {isOpen ? 'Hide' : 'Show'}
                <ChevronDown
                  className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="bg-muted/20 space-y-2 rounded-md border px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filter rules</span>
              <span>24 rules</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">NAT rules</span>
              <span>6 rules</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address lists</span>
              <span>8 lists</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <p className="text-muted-foreground text-center text-xs">
          Panel is currently {isOpen ? 'open' : 'closed'}
        </p>
      </div>
    );
  },
};

export const ShowMorePattern: Story = {
  render: function ShowMoreCollapsible() {
    const [isOpen, setIsOpen] = React.useState(false);

    const allInterfaces = [
      { name: 'ether1', type: 'WAN', status: 'up', ip: '203.0.113.45/24' },
      { name: 'ether2', type: 'LAN', status: 'up', ip: '192.168.1.1/24' },
      { name: 'ether3', type: 'LAN', status: 'up', ip: '192.168.2.1/24' },
      { name: 'wlan1', type: 'WiFi', status: 'up', ip: '192.168.10.1/24' },
      { name: 'ether4', type: 'LAN', status: 'down', ip: 'N/A' },
      { name: 'bridge1', type: 'Bridge', status: 'up', ip: '10.0.0.1/24' },
    ];

    const visibleInterfaces = allInterfaces.slice(0, 3);
    const hiddenInterfaces = allInterfaces.slice(3);

    return (
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-medium">Network Interfaces</h3>
        </div>
        <div className="divide-y">
          {visibleInterfaces.map((iface) => (
            <div
              key={iface.name}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <span className="font-mono text-sm">{iface.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">{iface.type}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-mono text-xs">{iface.ip}</span>
                <span
                  className={`text-xs font-medium ${
                    iface.status === 'up' ? 'text-success' : 'text-error'
                  }`}
                >
                  {iface.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <CollapsibleContent>
            <div className="divide-y">
              {hiddenInterfaces.map((iface) => (
                <div
                  key={iface.name}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <span className="font-mono text-sm">{iface.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{iface.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono text-xs">{iface.ip}</span>
                    <span
                      className={`text-xs font-medium ${
                        iface.status === 'up' ? 'text-success' : 'text-error'
                      }`}
                    >
                      {iface.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <button className="text-muted-foreground hover:bg-muted/30 flex w-full items-center justify-center gap-1 border-t px-4 py-2 text-xs transition-colors">
              {isOpen ?
                <>Show less</>
              : <>{hiddenInterfaces.length} more interfaces</>}
            </button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>
    );
  },
};

export const SidebarFilter: Story = {
  render: function SidebarFilterCollapsible() {
    const [wifiOpen, setWifiOpen] = React.useState(true);
    const [securityOpen, setSecurityOpen] = React.useState(false);

    return (
      <div className="w-64 space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Filters</h3>

        <Collapsible
          open={wifiOpen}
          onOpenChange={setWifiOpen}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wifi className="h-4 w-4 text-cyan-500" />
              WiFi Bands
            </div>
            <ChevronDown
              className={`text-muted-foreground h-4 w-4 transition-transform duration-200 ${
                wifiOpen ? 'rotate-180' : ''
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {['2.4 GHz', '5 GHz', '6 GHz'].map((band) => (
              <label
                key={band}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  defaultChecked={band !== '6 GHz'}
                  className="rounded"
                />
                {band}
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t" />

        <Collapsible
          open={securityOpen}
          onOpenChange={setSecurityOpen}
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-orange-500" />
              Security
            </div>
            <ChevronDown
              className={`text-muted-foreground h-4 w-4 transition-transform duration-200 ${
                securityOpen ? 'rotate-180' : ''
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {['WPA2', 'WPA3', 'Open'].map((protocol) => (
              <label
                key={protocol}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  defaultChecked={protocol !== 'Open'}
                  className="rounded"
                />
                {protocol}
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Collapsible
      disabled
      className="space-y-2"
    >
      <div className="flex items-center justify-between rounded-md border px-4 py-2">
        <span className="text-muted-foreground text-sm font-medium">Locked Settings</span>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            disabled
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
            <span className="sr-only">Toggle (disabled)</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <p className="text-muted-foreground px-2 text-sm">
          This content is not reachable when disabled.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Mobile viewport story (375px - touch-first design with larger hit areas)
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <Collapsible
      defaultOpen
      className="space-y-2"
    >
      <div className="flex items-center justify-between rounded-md border px-4 py-3">
        <span className="text-sm font-medium">Advanced Network Settings</span>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
          >
            <ChevronsUpDown className="h-5 w-5" />
            <span className="sr-only">Toggle advanced settings</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="bg-muted/30 rounded-md border px-4 py-3 text-sm">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">MTU Size</span>
            <span className="font-mono">1500</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">TTL</span>
            <span className="font-mono">64</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button');
    if (trigger) {
      await new Promise((r) => setTimeout(r, 500));
      trigger.click();
      await new Promise((r) => setTimeout(r, 300));
      trigger.click();
    }
  },
};

/**
 * Tablet viewport story (768px - balanced design with medium hit areas)
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <Collapsible className="space-y-2">
      <div className="flex items-center justify-between rounded-md border px-4 py-3">
        <span className="text-sm font-medium">Router Status</span>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
          >
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle router status</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="bg-muted/30 space-y-2 rounded-md border px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span>14d 6h 32m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPU Load</span>
            <span>23%</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Desktop viewport story (1280px - full detail with keyboard shortcuts visible)
 */
export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
  render: () => (
    <Collapsible className="space-y-2">
      <div className="flex items-center justify-between rounded-md border px-4 py-2">
        <span className="text-sm font-medium">Firewall Configuration</span>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 gap-1 p-0"
          >
            <ChevronsUpDown className="h-4 w-4" />
            <span className="text-muted-foreground ml-1 text-xs">Space</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="bg-muted/20 space-y-2 rounded-md border px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Filter rules</span>
          <span>24 rules</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">NAT rules</span>
          <span>6 rules</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Address lists</span>
          <span>8 lists</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
